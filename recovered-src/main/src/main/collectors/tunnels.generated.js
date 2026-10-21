// GENERATED FRAGMENT — extracted from out/main/index.js, lines 2929-2942.
// Original module marker: src/main/collectors/tunnels.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
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
