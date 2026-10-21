param([int]$IntervalMs = 1000, [int]$FastMs = 200)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Text;

public sealed class PdhSampler : IDisposable
{
    [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
    static extern uint PdhOpenQueryW(string source, IntPtr userData, out IntPtr query);

    [DllImport("pdh.dll", CharSet = CharSet.Unicode)]
    static extern uint PdhAddEnglishCounterW(IntPtr query, string path, IntPtr userData, out IntPtr counter);

    [DllImport("pdh.dll")]
    static extern uint PdhCollectQueryData(IntPtr query);

    [DllImport("pdh.dll")]
    static extern uint PdhGetFormattedCounterValue(IntPtr counter, uint format, IntPtr type, out FmtValue value);

    [DllImport("pdh.dll")]
    static extern uint PdhGetFormattedCounterArrayW(IntPtr counter, uint format, ref uint bufferSize, ref uint itemCount, IntPtr buffer);

    [DllImport("pdh.dll")]
    static extern uint PdhCloseQuery(IntPtr query);

    [StructLayout(LayoutKind.Explicit, Size = 16)]
    struct FmtValue
    {
        [FieldOffset(0)] public uint Status;
        [FieldOffset(8)] public double Value;
    }

    const uint FMT_DOUBLE = 0x00000200;
    const uint MORE_DATA = 0x800007D2;
    const int ITEM_SIZE = 24;
    const int ITEM_STATUS_OFFSET = 8;
    const int ITEM_VALUE_OFFSET = 16;

    class Counter
    {
        public string Key;
        public IntPtr Handle;
        public bool IsArray;
        public bool IsList;
    }

    IntPtr query;
    readonly List<Counter> counters = new List<Counter>();

    public PdhSampler()
    {
        if (IntPtr.Size != 8) throw new Exception("64-bit PowerShell required");
        uint r = PdhOpenQueryW(null, IntPtr.Zero, out query);
        if (r != 0) throw new Exception("PdhOpenQuery failed: 0x" + r.ToString("X"));
    }

    public bool Add(string key, string path, bool isArray)
    {
        IntPtr handle;
        if (PdhAddEnglishCounterW(query, path, IntPtr.Zero, out handle) != 0) return false;
        counters.Add(new Counter { Key = key, Handle = handle, IsArray = isArray });
        return true;
    }

    public bool AddList(string key, string path)
    {
        IntPtr handle;
        if (PdhAddEnglishCounterW(query, path, IntPtr.Zero, out handle) != 0) return false;
        counters.Add(new Counter { Key = key, Handle = handle, IsArray = true, IsList = true });
        return true;
    }

    public void Collect()
    {
        PdhCollectQueryData(query);
    }

    static string Num(double v)
    {
        if (double.IsNaN(v) || double.IsInfinity(v)) return "null";
        return v.ToString("R", CultureInfo.InvariantCulture);
    }

    static string Esc(string s)
    {
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"");
    }

    public string ToJson(string kind)
    {
        var sb = new StringBuilder();
        sb.Append("{\"k\":\"").Append(kind).Append("\",\"t\":").Append(DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
        foreach (var c in counters)
        {
            sb.Append(",\"").Append(c.Key).Append("\":");
            if (c.IsList) AppendList(sb, c);
            else if (c.IsArray) AppendArray(sb, c);
            else AppendScalar(sb, c);
        }
        sb.Append('}');
        return sb.ToString();
    }

    void AppendScalar(StringBuilder sb, Counter c)
    {
        FmtValue v;
        uint r = PdhGetFormattedCounterValue(c.Handle, FMT_DOUBLE, IntPtr.Zero, out v);
        if (r == 0 && (v.Status == 0 || v.Status == 1)) sb.Append(Num(v.Value));
        else sb.Append("null");
    }

    // Duplicate instance names (e.g. many chrome) are emitted as an ordered list;
    // invalid values stay as null so that separate counters align by index.
    void AppendList(StringBuilder sb, Counter c)
    {
        uint size = 0, count = 0;
        uint r = PdhGetFormattedCounterArrayW(c.Handle, FMT_DOUBLE, ref size, ref count, IntPtr.Zero);
        if (r != MORE_DATA || size == 0) { sb.Append("[]"); return; }

        IntPtr buf = Marshal.AllocHGlobal((int)size);
        try
        {
            r = PdhGetFormattedCounterArrayW(c.Handle, FMT_DOUBLE, ref size, ref count, buf);
            if (r != 0) { sb.Append("[]"); return; }

            sb.Append('[');
            for (int i = 0; i < count; i++)
            {
                IntPtr item = IntPtr.Add(buf, i * ITEM_SIZE);
                uint status = (uint)Marshal.ReadInt32(item, ITEM_STATUS_OFFSET);
                string name = Marshal.PtrToStringUni(Marshal.ReadIntPtr(item)) ?? "";
                string num = "null";
                if (status == 0 || status == 1)
                    num = Num(BitConverter.Int64BitsToDouble(Marshal.ReadInt64(item, ITEM_VALUE_OFFSET)));
                if (i > 0) sb.Append(',');
                sb.Append("[\"").Append(Esc(name)).Append("\",").Append(num).Append(']');
            }
            sb.Append(']');
        }
        finally
        {
            Marshal.FreeHGlobal(buf);
        }
    }

    void AppendArray(StringBuilder sb, Counter c)
    {
        uint size = 0, count = 0;
        uint r = PdhGetFormattedCounterArrayW(c.Handle, FMT_DOUBLE, ref size, ref count, IntPtr.Zero);
        if (r != MORE_DATA || size == 0) { sb.Append("{}"); return; }

        IntPtr buf = Marshal.AllocHGlobal((int)size);
        try
        {
            r = PdhGetFormattedCounterArrayW(c.Handle, FMT_DOUBLE, ref size, ref count, buf);
            if (r != 0) { sb.Append("{}"); return; }

            sb.Append('{');
            bool first = true;
            for (int i = 0; i < count; i++)
            {
                IntPtr item = IntPtr.Add(buf, i * ITEM_SIZE);
                uint status = (uint)Marshal.ReadInt32(item, ITEM_STATUS_OFFSET);
                if (status != 0 && status != 1) continue;
                string name = Marshal.PtrToStringUni(Marshal.ReadIntPtr(item));
                double val = BitConverter.Int64BitsToDouble(Marshal.ReadInt64(item, ITEM_VALUE_OFFSET));
                string num = Num(val);
                if (name == null || num == "null") continue;
                if (!first) sb.Append(',');
                first = false;
                sb.Append('"').Append(Esc(name)).Append("\":").Append(num);
            }
            sb.Append('}');
        }
        finally
        {
            Marshal.FreeHGlobal(buf);
        }
    }

    public void Dispose()
    {
        if (query != IntPtr.Zero) { PdhCloseQuery(query); query = IntPtr.Zero; }
    }
}
public static class ShellInfo
{
    [DllImport("shell32.dll")]
    static extern int SHQueryUserNotificationState(out int state);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr FindWindowW(string cls, string title);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern IntPtr FindWindowExW(IntPtr parent, IntPtr after, string cls, string title);

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr h, out RECT r);

    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);

    static uint ForegroundPid()
    {
        uint pid = 0;
        GetWindowThreadProcessId(GetForegroundWindow(), out pid);
        return pid;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    static extern int GetClassNameW(IntPtr h, StringBuilder sb, int max);

    [DllImport("user32.dll")]
    static extern int GetSystemMetrics(int index);

    [DllImport("user32.dll")]
    static extern IntPtr GetDC(IntPtr h);

    [DllImport("user32.dll")]
    static extern int ReleaseDC(IntPtr h, IntPtr dc);

    [DllImport("gdi32.dll")]
    static extern uint GetPixel(IntPtr dc, int x, int y);

    [StructLayout(LayoutKind.Sequential)]
    struct RECT { public int L, T, R, B; }

    static bool Get(IntPtr h, out RECT r)
    {
        r = new RECT();
        return h != IntPtr.Zero && GetWindowRect(h, out r);
    }

    static string Str(RECT r, bool ok)
    {
        return ok ? "[" + r.L + "," + r.T + "," + r.R + "," + r.B + "]" : "null";
    }

    // True when the foreground window covers the whole primary screen (taskbar included).
    static int Fullscreen()
    {
        IntPtr fg = GetForegroundWindow();
        RECT r;
        if (!Get(fg, out r)) return 0;
        var sb = new StringBuilder(64);
        GetClassNameW(fg, sb, 64);
        string cls = sb.ToString();
        if (cls == "Progman" || cls == "WorkerW" || cls == "Shell_TrayWnd") return 0;
        int w = GetSystemMetrics(0), h = GetSystemMetrics(1);
        return (r.L <= 0 && r.T <= 0 && r.R >= w && r.B >= h) ? 1 : 0;
    }

    // Average luminance (0-255) of a small patch of the taskbar; -1 when unreadable.
    static int Brightness(int left, int top, int bottom)
    {
        IntPtr dc = GetDC(IntPtr.Zero);
        if (dc == IntPtr.Zero) return -1;
        double sum = 0;
        int n = 0;
        for (int dx = 0; dx < 6; dx++)
        {
            for (int k = 1; k <= 4; k++)
            {
                uint c = GetPixel(dc, left + dx * 6, top + (bottom - top) * k / 5);
                if (c == 0xFFFFFFFF) continue;
                sum += 0.2126 * (c & 0xFF) + 0.7152 * ((c >> 8) & 0xFF) + 0.0722 * ((c >> 16) & 0xFF);
                n++;
            }
        }
        ReleaseDC(IntPtr.Zero, dc);
        return n == 0 ? -1 : (int)(sum / n);
    }

    // qu: 3 = D3D full-screen, 4 = presentation mode (2 and 7 are unreliable, see fs)
    public static string ToJson()
    {
        int qu = 0;
        SHQueryUserNotificationState(out qu);

        IntPtr barH = FindWindowW("Shell_TrayWnd", null);
        IntPtr trayH = barH == IntPtr.Zero ? IntPtr.Zero : FindWindowExW(barH, IntPtr.Zero, "TrayNotifyWnd", null);
        RECT bar, tray;
        bool hasBar = Get(barH, out bar);
        bool hasTray = Get(trayH, out tray);

        int bright = -1;
        if (hasBar && hasTray && tray.L - 560 > bar.L) bright = Brightness(tray.L - 560, bar.T, bar.B);

        return "{\"k\":\"s\",\"qu\":" + qu + ",\"fs\":" + Fullscreen() + ",\"bar\":" + Str(bar, hasBar) +
               ",\"tray\":" + Str(tray, hasTray) + ",\"bright\":" + bright + ",\"fgpid\":" + ForegroundPid() + "}";
    }
}
'@

[void][ShellInfo]::SetProcessDPIAware()

# NVMe health log (SMART): read-only "get log page" query. The drive handle is opened with
# access 0, so no admin rights are needed. Compiled separately so a failure here cannot
# break the rest of the sampler.
$nvmeSrc = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class NvmeSmart
{
    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    static extern IntPtr CreateFileW(string name, uint access, uint share, IntPtr sa, uint disp, uint flags, IntPtr tmpl);

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool DeviceIoControl(IntPtr h, uint code, byte[] inBuf, int inSize, byte[] outBuf, int outSize, out int ret, IntPtr ov);

    [DllImport("kernel32.dll")]
    static extern bool CloseHandle(IntPtr h);

    static string U64(byte[] b, int o) { return BitConverter.ToUInt64(b, o).ToString(); }

    // Returns a JSON object for one drive, or null when it is not an NVMe drive or cannot be queried.
    static string Query(int n)
    {
        IntPtr h = CreateFileW("\\\\.\\PhysicalDrive" + n, 0, 3, IntPtr.Zero, 3, 0, IntPtr.Zero);
        if (h == new IntPtr(-1) || h == IntPtr.Zero) return null;
        try
        {
            byte[] buf = new byte[8 + 40 + 512];
            BitConverter.GetBytes(50).CopyTo(buf, 0);   // StorageDeviceProtocolSpecificProperty
            BitConverter.GetBytes(0).CopyTo(buf, 4);    // PropertyStandardQuery
            BitConverter.GetBytes(3).CopyTo(buf, 8);    // ProtocolTypeNvme
            BitConverter.GetBytes(2).CopyTo(buf, 12);   // NVMeDataTypeLogPage
            BitConverter.GetBytes(2).CopyTo(buf, 16);   // log page 0x02 = SMART / Health information
            BitConverter.GetBytes(0).CopyTo(buf, 20);
            BitConverter.GetBytes(40).CopyTo(buf, 24);  // ProtocolDataOffset
            BitConverter.GetBytes(512).CopyTo(buf, 28); // ProtocolDataLength
            int ret;
            if (!DeviceIoControl(h, 0x002D1400, buf, buf.Length, buf, buf.Length, out ret, IntPtr.Zero)) return null;
            if (ret < 8 + 40 + 512) return null;

            int o = 8 + 40;
            StringBuilder sb = new StringBuilder();
            sb.Append("{\"i\":").Append(n);
            sb.Append(",\"w\":").Append((int)buf[o]);
            sb.Append(",\"tk\":").Append((int)BitConverter.ToUInt16(buf, o + 1));
            sb.Append(",\"s\":").Append((int)buf[o + 3]);
            sb.Append(",\"st\":").Append((int)buf[o + 4]);
            sb.Append(",\"u\":").Append((int)buf[o + 5]);
            sb.Append(",\"r\":").Append(U64(buf, o + 32));
            sb.Append(",\"wr\":").Append(U64(buf, o + 48));
            sb.Append(",\"c\":").Append(U64(buf, o + 112));
            sb.Append(",\"h\":").Append(U64(buf, o + 128));
            sb.Append(",\"us\":").Append(U64(buf, o + 144));
            sb.Append(",\"m\":").Append(U64(buf, o + 160));
            sb.Append(",\"e\":").Append(U64(buf, o + 176));
            sb.Append('}');
            return sb.ToString();
        }
        finally
        {
            CloseHandle(h);
        }
    }

    public static string ToJson()
    {
        StringBuilder sb = new StringBuilder("{\"k\":\"n\",\"drives\":[");
        bool first = true;
        for (int i = 0; i < 16; i++)
        {
            string j = Query(i);
            if (j == null) continue;
            if (!first) sb.Append(',');
            first = false;
            sb.Append(j);
        }
        sb.Append("]}");
        return sb.ToString();
    }
}
'@
$nvmeOk = $false
try { Add-Type -TypeDefinition $nvmeSrc; $nvmeOk = $true } catch { }

# Fast lane: CPU package power only, sampled every $FastMs (default 200 ms).
$fast = New-Object PdhSampler
$null = $fast.Add('energy', '\Energy Meter(*)\Power', $true)

# Slow lane: everything else, sampled every $IntervalMs.
$s = New-Object PdhSampler
$null = $s.Add('util', '\Processor Information(*)\% Processor Utility', $true)
$null = $s.Add('time', '\Processor Information(*)\% Processor Time', $true)
$null = $s.Add('perf', '\Processor Information(*)\% Processor Performance', $true)
$null = $s.Add('freq', '\Processor Information(*)\Processor Frequency', $true)
$null = $s.Add('memAvail', '\Memory\Available Bytes', $false)
$null = $s.Add('memCommit', '\Memory\Committed Bytes', $false)
$null = $s.Add('memLimit', '\Memory\Commit Limit', $false)
$null = $s.Add('diskR', '\PhysicalDisk(*)\Disk Read Bytes/sec', $true)
$null = $s.Add('diskW', '\PhysicalDisk(*)\Disk Write Bytes/sec', $true)
$null = $s.Add('diskT', '\PhysicalDisk(*)\% Disk Time', $true)
$null = $s.Add('netRx', '\Network Interface(*)\Bytes Received/sec', $true)
$null = $s.Add('netTx', '\Network Interface(*)\Bytes Sent/sec', $true)
$null = $s.AddList('procCpu', '\Process(*)\% Processor Time')
$null = $s.AddList('procMem', '\Process(*)\Working Set - Private')
$null = $s.AddList('procPid', '\Process(*)\ID Process')
$null = $s.Add('gpuEng', '\GPU Engine(*)\Utilization Percentage', $true)
$null = $s.Add('gpuMem', '\GPU Adapter Memory(*)\Dedicated Usage', $true)
$null = $s.Add('gpuShared', '\GPU Adapter Memory(*)\Shared Usage', $true)
# Stutter diagnosis inputs.
$null = $s.Add('diskLatR', '\PhysicalDisk(*)\Avg. Disk sec/Read', $true)
$null = $s.Add('diskLatW', '\PhysicalDisk(*)\Avg. Disk sec/Write', $true)
$null = $s.Add('diskQ', '\PhysicalDisk(*)\Current Disk Queue Length', $true)
$null = $s.Add('hardFaults', '\Memory\Pages Input/sec', $false)
$null = $s.Add('procQueue', '\System\Processor Queue Length', $false)
$null = $s.Add('perfLimit', '\Processor Information(_Total)\% Performance Limit', $false)
$null = $s.Add('perfFlags', '\Processor Information(_Total)\Performance Limit Flags', $false)
$null = $s.Add('dpc', '\Processor Information(_Total)\% DPC Time', $false)
$null = $s.Add('intr', '\Processor Information(_Total)\% Interrupt Time', $false)
# Per-process I/O includes network and device I/O, not only disk; aligned by index with procCpu.
$null = $s.AddList('procIoR', '\Process(*)\IO Read Bytes/sec')
$null = $s.AddList('procIoW', '\Process(*)\IO Write Bytes/sec')

$fast.Collect()
$s.Collect()
$sw = [System.Diagnostics.Stopwatch]::StartNew()
$nextSlow = [long]$IntervalMs
$nextShell = [long]0
$nextNvme = [long]0
while ($true) {
    Start-Sleep -Milliseconds $FastMs
    $fast.Collect()
    [Console]::Out.WriteLine($fast.ToJson('p'))
    if ($sw.ElapsedMilliseconds -ge $nextShell) {
        [Console]::Out.WriteLine([ShellInfo]::ToJson())
        $nextShell = $sw.ElapsedMilliseconds + 1000
    }
    if ($nvmeOk -and $sw.ElapsedMilliseconds -ge $nextNvme) {
        try { [Console]::Out.WriteLine([NvmeSmart]::ToJson()) } catch { }
        $nextNvme = $sw.ElapsedMilliseconds + 60000
    }
    if ($sw.ElapsedMilliseconds -ge $nextSlow) {
        $s.Collect()
        [Console]::Out.WriteLine($s.ToJson('m'))
        $nextSlow += $IntervalMs
        if ($sw.ElapsedMilliseconds -ge $nextSlow) { $nextSlow = $sw.ElapsedMilliseconds + $IntervalMs }
    }
    [Console]::Out.Flush()
}
