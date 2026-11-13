//#region node_modules/react-resizable/build/propTypes.js
var require_propTypes = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.resizableProps = void 0;
	var _propTypes = _interopRequireDefault(require_prop_types());
	require_cjs();
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	exports.resizableProps = {
		axis: _propTypes.default.oneOf([
			"both",
			"x",
			"y",
			"none"
		]),
		className: _propTypes.default.string,
		children: _propTypes.default.element.isRequired,
		draggableOpts: _propTypes.default.shape({
			allowAnyClick: _propTypes.default.bool,
			cancel: _propTypes.default.string,
			children: _propTypes.default.node,
			disabled: _propTypes.default.bool,
			enableUserSelectHack: _propTypes.default.bool,
			offsetParent: typeof Element !== "undefined" ? _propTypes.default.instanceOf(Element) : _propTypes.default.any,
			grid: _propTypes.default.arrayOf(_propTypes.default.number),
			handle: _propTypes.default.string,
			nodeRef: _propTypes.default.object,
			onStart: _propTypes.default.func,
			onDrag: _propTypes.default.func,
			onStop: _propTypes.default.func,
			onMouseDown: _propTypes.default.func,
			scale: _propTypes.default.number
		}),
		height: function() {
			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) args[_key] = arguments[_key];
			const props = args[0];
			if (props.axis === "both" || props.axis === "y") return _propTypes.default.number.isRequired(...args);
			return _propTypes.default.number(...args);
		},
		handle: _propTypes.default.oneOfType([_propTypes.default.node, _propTypes.default.func]),
		handleSize: _propTypes.default.arrayOf(_propTypes.default.number),
		lockAspectRatio: _propTypes.default.bool,
		maxConstraints: _propTypes.default.arrayOf(_propTypes.default.number),
		minConstraints: _propTypes.default.arrayOf(_propTypes.default.number),
		onResizeStop: _propTypes.default.func,
		onResizeStart: _propTypes.default.func,
		onResize: _propTypes.default.func,
		resizeHandles: _propTypes.default.arrayOf(_propTypes.default.oneOf([
			"s",
			"w",
			"e",
			"n",
			"sw",
			"nw",
			"se",
			"ne"
		])),
		transformScale: _propTypes.default.number,
		width: function() {
			for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
			const props = args[0];
			if (props.axis === "both" || props.axis === "x") return _propTypes.default.number.isRequired(...args);
			return _propTypes.default.number(...args);
		}
	};
}));
//#endregion
