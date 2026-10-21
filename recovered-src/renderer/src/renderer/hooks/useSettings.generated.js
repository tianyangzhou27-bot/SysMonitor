// GENERATED FRAGMENT — extracted from out/renderer/assets/index-CzIv0K4n.js, lines 25944-25956.
// Original module marker: src/renderer/hooks/useSettings.ts. Not the original TypeScript/TSX source.
// Depends on bundle-level imports, globals, and other fragments; not standalone.
function useSettings() {
	const [settings, setSettings] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		window.api.settings.get().then(setSettings);
		return window.api.settings.onChange(setSettings);
	}, []);
	return {
		settings,
		update: (0, import_react.useCallback)((patch) => {
			window.api.settings.set(patch).then(setSettings);
		}, [])
	};
}
