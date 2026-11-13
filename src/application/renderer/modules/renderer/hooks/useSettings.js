//#region src/renderer/hooks/useSettings.ts
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
//#endregion
