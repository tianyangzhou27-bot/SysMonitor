# Features and user guide

Applies to the extracted SysMonitor 0.1.0 release. Last reviewed: 2026-10-21.

## What it does

SysMonitor is a local Windows desktop monitor. It brings hardware load, network state and recent performance changes into one window and can show key values in a taskbar overlay. It helps investigate slowdowns and observe temperature and load. Its “whole-system power” value is an estimate, not a measurement from a wall power meter.

## Interface observed on a Windows installation

We opened the main window, Settings and History in an existing Windows installation and observed:

| Area | Visible information and purpose |
| --- | --- |
| Overview | CPU, GPU, memory and estimated whole-system power cards with live graphs and status. |
| Network | Adapter and transfer rates, gateway latency, DNS and public IPs; proxy/VPN client, connection and node panels. |
| Processes and storage | Resource use by process, disk activity and hardware information. |
| Diagnosis and alerts | Potential performance bottlenecks and configurable threshold alerts. |
| History | Time-range graphs with up to eight selected metrics, events, CSV export and local history clearing. |
| Settings | Sampling intervals, taskbar metrics, startup, tray behavior, retention, alerts, frame capture and cooling configuration. |

The interface itself is currently in Chinese. Available sensors and details depend on hardware, drivers and network configuration. Observing a control in the UI does not mean every optional feature was exercised on this machine.

## Getting started

1. Install and run the app using the [English README](../README.md#requirements-and-run). Check that the CPU, GPU, memory and network cards populate.
2. Choose taskbar metrics and sampling intervals in Settings. More frequent sampling generally adds background work.
3. Open History from the top toolbar to inspect past trends. Recording is enabled by default; Settings can disable it and clear existing local records.
4. Set up PresentMon permissions only if you need frame data. Set up LibreHardwareMonitor separately only if you need extra sensors or fan controls. Neither is required for basic monitoring.
5. Closing the window normally hides it to the tray. Select Quit from the tray menu to stop the application.

## Limits and optional functions

- The power card combines collected CPU and GPU power with a configurable allowance for other components. It is an estimate and should not be used as a precise electricity or PSU-capacity measurement.
- Public IP checks contact external services automatically. A bandwidth test starts only on user action and can transfer substantial data. See [Permissions and privacy](PERMISSIONS_AND_PRIVACY.md).
- The proxy/VPN panel observes local clients and connections. Our review of this build found no call that changes Windows proxy settings.
- Frame capture uses PresentMon and depends on account permissions. The default mode targets fullscreen applications.
- Extra temperatures and fan control require a separate LibreHardwareMonitor service. Fan mode defaults to BIOS/GPU control. Verify the hardware channel before changing it, especially for pumps.
- Default history retention is 24 hours of fine samples, seven days of minute summaries and 30 days of events, with a configured 500 MB cap. Maintenance runs periodically, so this is not a strict real-time file-size guarantee.

## Verification scope

We inspected the existing Windows instance's main window, Settings and History without changing settings, activating fan control, running a bandwidth test, exporting personal data or publishing screenshots with real device information. Windows Sandbox, Hyper-V VM and Docker were unavailable in the current environment, so there was no separate VM run. Other details come from reviewing the committed generated code and PowerShell helpers. This is not a complete security audit. See the [source provenance note](../recovered-src/README.md) for the missing original project.
