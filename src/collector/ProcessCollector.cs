using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using Microsoft.Diagnostics.Tracing.Parsers;
using Microsoft.Diagnostics.Tracing.Parsers.Kernel;
using Microsoft.Diagnostics.Tracing.Session;

internal class ProcessCollector
{
	private struct IoCounters
	{
		public ulong ReadOperations;

		public ulong WriteOperations;

		public ulong OtherOperations;

		public ulong ReadBytes;

		public ulong WriteBytes;

		public ulong OtherBytes;
	}

	private class Previous
	{
		public long Creation;

		public long Cpu;

		public ulong Read;

		public ulong Write;

		public bool HasIo;
	}

	private class Row
	{
		public int pid;

		public string name;

		public string identity;

		public double? cpuPercent;

		public double? memBytes;

		public double? ioReadBytesPerSec;

		public double? ioWriteBytesPerSec;

		public double? netDownBytesPerSec;

		public double? netUpBytesPerSec;

		public bool accessible;
	}

	private static readonly JavaScriptSerializer Json = new JavaScriptSerializer
	{
		MaxJsonLength = 8000000
	};

	private static readonly object NetLock = new object();

	private static Dictionary<int, long[]> Network = new Dictionary<int, long[]>();

	private static string NetStatus = "starting";

	private static string NetError = null;

	private static TraceEventSession Session;

	private static ManualResetEvent Stop = new ManualResetEvent(false);

	private static readonly string[] ProtectedNames = new string[12]
	{
		"sysmonitor", "sysmonitor-processes", "system", "registry", "idle", "smss", "csrss", "wininit", "winlogon", "services",
		"lsass", "secure system"
	};

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern IntPtr OpenProcess(uint access, bool inherit, int pid);

	[DllImport("kernel32.dll")]
	private static extern bool CloseHandle(IntPtr handle);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool GetProcessTimes(IntPtr h, out long creation, out long exit, out long kernel, out long user);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool GetProcessIoCounters(IntPtr h, out IoCounters io);

	[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
	private static extern bool QueryFullProcessImageName(IntPtr h, int flags, StringBuilder name, ref int size);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool IsProcessCritical(IntPtr h, out bool critical);

	[DllImport("kernel32.dll", SetLastError = true)]
	private static extern bool TerminateProcess(IntPtr h, uint code);

	private static void AddNetwork(int pid, int size, bool send)
	{
		if (pid <= 0 || size < 0)
		{
			return;
		}
		lock (NetLock)
		{
			long[] value;
			if (!Network.TryGetValue(pid, out value))
			{
				value = (Network[pid] = new long[2]);
			}
			value[send ? 1 : 0] += size;
		}
	}

	private static void StartNetwork(int parent)
	{
		try
		{
			Session = new TraceEventSession("SysMonitor-Network-" + parent + "-" + Process.GetCurrentProcess().Id);
			Session.StopOnDispose = true;
			Session.BufferSizeMB = 16;
			Session.EnableKernelProvider(KernelTraceEventParser.Keywords.NetworkTCPIP | KernelTraceEventParser.Keywords.Process);
			KernelTraceEventParser kernel = Session.Source.Kernel;
			kernel.TcpIpSend += (TcpIpSendTraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, true);
			};
			kernel.TcpIpRecv += (TcpIpTraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, false);
			};
			kernel.UdpIpSend += (UdpIpTraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, true);
			};
			kernel.UdpIpRecv += (UdpIpTraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, false);
			};
			kernel.TcpIpSendIPV6 += (TcpIpV6SendTraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, true);
			};
			kernel.TcpIpRecvIPV6 += (TcpIpV6TraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, false);
			};
			kernel.UdpIpSendIPV6 += (UpdIpV6TraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, true);
			};
			kernel.UdpIpRecvIPV6 += (UpdIpV6TraceData d) =>
			{
				AddNetwork(d.ProcessID, d.size, false);
			};
			kernel.ProcessStart += (ProcessTraceData d) =>
			{
				lock (NetLock)
				{
					Network.Remove(d.ProcessID);
				}
			};
			kernel.ProcessStop += (ProcessTraceData d) =>
			{
				lock (NetLock)
				{
					Network.Remove(d.ProcessID);
				}
			};
			NetStatus = "etw";
			Task.Run(() =>
			{
				try
				{
					Session.Source.Process();
				}
				catch (Exception ex2)
				{
					NetError = ex2.GetType().Name;
					NetStatus = "unavailable";
				}
				finally
				{
					if (!Stop.WaitOne(0))
					{
						NetStatus = "unavailable";
					}
				}
			});
		}
		catch (Exception ex)
		{
			NetStatus = "unavailable";
			NetError = ((ex is UnauthorizedAccessException) ? "需要管理员权限才能采集系统级网络流量" : (ex.GetType().Name + ": " + ex.Message));
			if (Session != null)
			{
				Session.Dispose();
				Session = null;
			}
		}
	}

	private static string ImagePath(IntPtr handle)
	{
		int size = 32768;
		StringBuilder stringBuilder = new StringBuilder(size);
		if (!QueryFullProcessImageName(handle, 0, stringBuilder, ref size))
		{
			return null;
		}
		return stringBuilder.ToString();
	}

	private static bool Protected(int pid, string image)
	{
		if (pid <= 4 || string.IsNullOrEmpty(image))
		{
			return true;
		}
		string value = Path.GetFileNameWithoutExtension(image).ToLowerInvariant();
		return Array.IndexOf(ProtectedNames, value) >= 0;
	}

	private static object Action(string mode, int pid, string expected)
	{
		bool flag = mode == "--terminate";
		IntPtr intPtr = OpenProcess((uint)(0x1000 | (flag ? 1 : 0)), false, pid);
		if (intPtr == IntPtr.Zero)
		{
			throw new Exception("无法访问进程，进程可能已退出或权限不足。");
		}
		try
		{
			long creation;
			long exit;
			long kernel;
			long user;
			if (!GetProcessTimes(intPtr, out creation, out exit, out kernel, out user))
			{
				throw new Exception("无法核对进程身份。");
			}
			string text = creation.ToString(CultureInfo.InvariantCulture);
			if (expected != null && expected != text)
			{
				throw new Exception("进程已退出或 PID 已被复用，请刷新后重试。");
			}
			string text2 = ImagePath(intPtr);
			bool critical;
			bool flag2 = Protected(pid, text2) || !IsProcessCritical(intPtr, out critical) || critical;
			if (flag)
			{
				if (flag2)
				{
					throw new Exception("禁止结束系统关键进程或 SysMonitor 自身。");
				}
				if (!TerminateProcess(intPtr, 1u))
				{
					throw new Exception("结束进程失败，错误码 " + Marshal.GetLastWin32Error());
				}
				return new
				{
					ok = true,
					pid = pid,
					identity = text
				};
			}
			string priority = null;
			int? sessionId = null;
			try
			{
				using (Process process = Process.GetProcessById(pid))
				{
					priority = process.PriorityClass.ToString();
					sessionId = process.SessionId;
				}
			}
			catch
			{
			}
			return new
			{
				ok = true,
				pid = pid,
				identity = text,
				path = text2,
				name = ((text2 == null) ? null : Path.GetFileName(text2)),
				startedAt = DateTime.FromFileTimeUtc(creation).ToString("o"),
				priority = priority,
				sessionId = sessionId,
				canTerminate = !flag2
			};
		}
		finally
		{
			CloseHandle(intPtr);
		}
	}

	private static void Watch(int parent, int seconds)
	{
		StartNetwork(parent);
		if (seconds == 0)
		{
			Task.Run(() =>
			{
				try
				{
					while (Console.ReadLine() != null)
					{
					}
				}
				catch
				{
				}
				Stop.Set();
			});
		}
		Console.CancelKeyPress += (object s, ConsoleCancelEventArgs e) =>
		{
			e.Cancel = true;
			Stop.Set();
		};
		Dictionary<int, Previous> dictionary = new Dictionary<int, Previous>();
		Stopwatch stopwatch = Stopwatch.StartNew();
		double num = stopwatch.Elapsed.TotalSeconds;
		try
		{
			while (!Stop.WaitOne(1000) && (seconds <= 0 || !(stopwatch.Elapsed.TotalSeconds > (double)seconds)))
			{
				if (parent > 0)
				{
					try
					{
						using (Process process = Process.GetProcessById(parent))
						{
							if (process.HasExited)
							{
								break;
							}
						}
					}
					catch
					{
						break;
					}
				}
				double totalSeconds = stopwatch.Elapsed.TotalSeconds;
				double num2 = totalSeconds - num;
				num = totalSeconds;
				Dictionary<int, long[]> network;
				lock (NetLock)
				{
					network = Network;
					Network = new Dictionary<int, long[]>();
				}
				List<Row> list = new List<Row>();
				Dictionary<int, Previous> dictionary2 = new Dictionary<int, Previous>();
				Process[] processes = Process.GetProcesses();
				foreach (Process process2 in processes)
				{
					try
					{
						Row row = new Row();
						row.pid = process2.Id;
						row.name = process2.ProcessName;
						row.accessible = false;
						Row row2 = row;
						if (row2.pid == 0)
						{
							continue;
						}
						IntPtr intPtr = OpenProcess(4096u, false, row2.pid);
						try
						{
							long creation;
							long exit;
							long kernel;
							long user;
							if (intPtr != IntPtr.Zero && GetProcessTimes(intPtr, out creation, out exit, out kernel, out user))
							{
								row2.accessible = true;
								row2.identity = creation.ToString(CultureInfo.InvariantCulture);
								IoCounters io;
								bool processIoCounters = GetProcessIoCounters(intPtr, out io);
								Previous previous = new Previous();
								previous.Creation = creation;
								previous.Cpu = kernel + user;
								previous.Read = (processIoCounters ? io.ReadBytes : 0);
								previous.Write = (processIoCounters ? io.WriteBytes : 0);
								previous.HasIo = processIoCounters;
								Previous previous2 = previous;
								Previous value;
								if (dictionary.TryGetValue(row2.pid, out value) && value.Creation == creation && num2 > 0.0 && num2 <= 15.0)
								{
									row2.cpuPercent = Math.Max(0.0, Math.Min(100.0, (double)(previous2.Cpu - value.Cpu) / 10000000.0 / num2 / (double)Environment.ProcessorCount * 100.0));
									if (processIoCounters && value.HasIo && previous2.Read >= value.Read && previous2.Write >= value.Write)
									{
										row2.ioReadBytesPerSec = (double)(previous2.Read - value.Read) / num2;
										row2.ioWriteBytesPerSec = (double)(previous2.Write - value.Write) / num2;
									}
									if (NetStatus == "etw")
									{
										long[] value2;
										network.TryGetValue(row2.pid, out value2);
										row2.netDownBytesPerSec = ((value2 == null) ? 0.0 : ((double)value2[0] / num2));
										row2.netUpBytesPerSec = ((value2 == null) ? 0.0 : ((double)value2[1] / num2));
									}
								}
								dictionary2[row2.pid] = previous2;
							}
							try
							{
								row2.memBytes = process2.WorkingSet64;
							}
							catch
							{
							}
						}
						finally
						{
							if (intPtr != IntPtr.Zero)
							{
								CloseHandle(intPtr);
							}
						}
						list.Add(row2);
					}
					catch
					{
					}
					finally
					{
						process2.Dispose();
					}
				}
				dictionary = dictionary2;
				long eventsLost = 0L;
				try
				{
					if (Session != null)
					{
						eventsLost = Session.EventsLost;
					}
				}
				catch
				{
				}
				Console.WriteLine(Json.Serialize(new
				{
					ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
					netSource = NetStatus,
					netError = NetError,
					eventsLost = eventsLost,
					rows = list
				}));
			}
		}
		finally
		{
			Stop.Set();
			if (Session != null)
			{
				Session.Dispose();
			}
		}
	}

	private static int Main(string[] args)
	{
		Console.OutputEncoding = new UTF8Encoding(false);
		try
		{
			if (args.Length >= 2 && (args[0] == "--details" || args[0] == "--terminate"))
			{
				int result;
				if (!int.TryParse(args[1], out result) || result <= 0)
				{
					throw new Exception("无效 PID");
				}
				if (args[0] == "--terminate" && args.Length != 3)
				{
					throw new Exception("缺少进程启动标识。");
				}
				Console.WriteLine(Json.Serialize(Action(args[0], result, (args.Length > 2) ? args[2] : null)));
				return 0;
			}
			int result2 = 0;
			int result3 = 0;
			if (args.Length == 2 && args[0] == "--watch")
			{
				int.TryParse(args[1], out result2);
			}
			else
			{
				if (args.Length != 2 || !(args[0] == "--probe"))
				{
					throw new Exception("Invalid arguments");
				}
				int.TryParse(args[1], out result3);
			}
			Watch(result2, result3);
			return 0;
		}
		catch (Exception ex)
		{
			Console.WriteLine(Json.Serialize(new
			{
				ok = false,
				error = ex.Message
			}));
			return 1;
		}
	}
}
