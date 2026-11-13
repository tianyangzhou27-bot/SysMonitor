//#region src/main/collectors/tunnels.ts
var RULES$1 = [
	[/wintun|meta tunnel|mihomo|clash|sing-?tun|\btun\b/i, "TUN"],
	[/wireguard|nordlynx/i, "WireGuard"],
	[/tap-windows|tap0901|openvpn|ovpn|wintap/i, "TAP / OpenVPN"],
	[/tailscale/i, "Tailscale"],
	[/zerotier/i, "ZeroTier"],
	[/hamachi/i, "Hamachi"],
	[/\bvpn\b|proton|expressvpn|surfshark/i, "VPN"]
];
function tunnelKind(name, description) {
	const text = `${name} ${description}`;
	for (const [re, label] of RULES$1) if (re.test(text)) return label;
	return null;
}
//#endregion
