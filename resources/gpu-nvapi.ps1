# Read-only NVAPI queries for static GPU specs (CUDA core count, memory bus width, memory type).
# Prints one JSON object; prints {} when NVAPI or an NVIDIA GPU is not available.
# Keep this file ASCII only (Windows PowerShell 5.1 reads BOM-less files as the ANSI code page).
$src = @'
using System;
using System.Runtime.InteropServices;

public static class NvApiSpecs
{
    [DllImport("kernel32.dll", CharSet = CharSet.Ansi)]
    static extern IntPtr LoadLibraryA(string name);

    [DllImport("kernel32.dll", CharSet = CharSet.Ansi)]
    static extern IntPtr GetProcAddress(IntPtr h, string name);

    delegate IntPtr QueryInterfaceDelegate(uint id);
    delegate int InitDelegate();
    delegate int EnumGpusDelegate([MarshalAs(UnmanagedType.LPArray, SizeConst = 64)] IntPtr[] handles, ref uint count);
    delegate int GetUIntDelegate(IntPtr gpu, ref uint value);

    static QueryInterfaceDelegate query;

    static T Get<T>(uint id) where T : class
    {
        IntPtr p = query(id);
        if (p == IntPtr.Zero) return null;
        return Marshal.GetDelegateForFunctionPointer(p, typeof(T)) as T;
    }

    static string One(IntPtr gpu, string name, uint id)
    {
        GetUIntDelegate f = Get<GetUIntDelegate>(id);
        if (f == null) return "";
        uint v = 0;
        if (f(gpu, ref v) != 0) return "";
        return "\"" + name + "\":" + v + ",";
    }

    public static string Run()
    {
        IntPtr lib = LoadLibraryA("nvapi64.dll");
        if (lib == IntPtr.Zero) return "{}";
        IntPtr q = GetProcAddress(lib, "nvapi_QueryInterface");
        if (q == IntPtr.Zero) return "{}";
        query = (QueryInterfaceDelegate)Marshal.GetDelegateForFunctionPointer(q, typeof(QueryInterfaceDelegate));

        InitDelegate init = Get<InitDelegate>(0x0150E828);
        if (init == null || init() != 0) return "{}";

        EnumGpusDelegate enumGpus = Get<EnumGpusDelegate>(0xE5AC921F);
        IntPtr[] handles = new IntPtr[64];
        uint count = 0;
        if (enumGpus == null || enumGpus(handles, ref count) != 0 || count == 0) return "{}";

        string body = One(handles[0], "cores", 0xC7026A87)
                    + One(handles[0], "bus", 0x7975C581)
                    + One(handles[0], "ram", 0x57F7CAAC)
                    + One(handles[0], "fbKB", 0x46FBEB03);
        if (body.EndsWith(",")) body = body.Substring(0, body.Length - 1);
        return "{" + body + "}";
    }
}
'@
try {
    Add-Type -TypeDefinition $src
    [Console]::Out.WriteLine([NvApiSpecs]::Run())
} catch {
    [Console]::Out.WriteLine('{}')
}
