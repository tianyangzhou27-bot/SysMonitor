//#region node_modules/react-resizable/build/ResizableBox.js
var require_ResizableBox = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	var _propTypes = _interopRequireDefault(require_prop_types());
	var _Resizable = _interopRequireDefault(require_Resizable());
	var _propTypes2 = require_propTypes();
	var _excluded = [
		"handle",
		"handleSize",
		"onResize",
		"onResizeStart",
		"onResizeStop",
		"draggableOpts",
		"minConstraints",
		"maxConstraints",
		"lockAspectRatio",
		"axis",
		"width",
		"height",
		"resizeHandles",
		"style",
		"transformScale"
	];
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { default: e };
	}
	function _interopRequireWildcard(e, t) {
		if ("function" == typeof WeakMap) var r = /* @__PURE__ */ new WeakMap(), n = /* @__PURE__ */ new WeakMap();
		return (_interopRequireWildcard = function(e, t) {
			if (!t && e && e.__esModule) return e;
			var o, i, f = {
				__proto__: null,
				default: e
			};
			if (null === e || "object" != typeof e && "function" != typeof e) return f;
			if (o = t ? n : r) {
				if (o.has(e)) return o.get(e);
				o.set(e, f);
			}
			for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]);
			return f;
		})(e, t);
	}
	function _extends() {
		return _extends = Object.assign ? Object.assign.bind() : function(n) {
			for (var e = 1; e < arguments.length; e++) {
				var t = arguments[e];
				for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
			}
			return n;
		}, _extends.apply(null, arguments);
	}
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	function _defineProperty(e, r, t) {
		return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	function _toPropertyKey(t) {
		var i = _toPrimitive(t, "string");
		return "symbol" == typeof i ? i : i + "";
	}
	function _toPrimitive(t, r) {
		if ("object" != typeof t || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != typeof i) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (-1 !== e.indexOf(n)) continue;
			t[n] = r[n];
		}
		return t;
	}
	var ResizableBox = class extends React.Component {
		constructor() {
			super(...arguments);
			this.state = {
				width: this.props.width,
				height: this.props.height,
				propsWidth: this.props.width,
				propsHeight: this.props.height
			};
			this.onResize = (e, data) => {
				const size = data.size;
				if (this.props.onResize) {
					e.persist == null || e.persist();
					this.setState(size, () => this.props.onResize && this.props.onResize(e, data));
				} else this.setState(size);
			};
		}
		static getDerivedStateFromProps(props, state) {
			if (state.propsWidth !== props.width || state.propsHeight !== props.height) return {
				width: props.width,
				height: props.height,
				propsWidth: props.width,
				propsHeight: props.height
			};
			return null;
		}
		render() {
			const _this$props = this.props, handle = _this$props.handle, handleSize = _this$props.handleSize;
			_this$props.onResize;
			const onResizeStart = _this$props.onResizeStart, onResizeStop = _this$props.onResizeStop, draggableOpts = _this$props.draggableOpts, minConstraints = _this$props.minConstraints, maxConstraints = _this$props.maxConstraints, lockAspectRatio = _this$props.lockAspectRatio, axis = _this$props.axis;
			_this$props.width;
			_this$props.height;
			const resizeHandles = _this$props.resizeHandles, style = _this$props.style, transformScale = _this$props.transformScale, props = _objectWithoutPropertiesLoose(_this$props, _excluded);
			return /*#__PURE__*/ React.createElement(_Resizable.default, {
				axis,
				draggableOpts,
				handle,
				handleSize,
				height: this.state.height,
				lockAspectRatio,
				maxConstraints,
				minConstraints,
				onResizeStart,
				onResize: this.onResize,
				onResizeStop,
				resizeHandles,
				transformScale,
				width: this.state.width
			}, /*#__PURE__*/ React.createElement("div", _extends({}, props, { style: _objectSpread(_objectSpread({}, style), {}, {
				width: this.state.width + "px",
				height: this.state.height + "px"
			}) })));
		}
	};
	exports.default = ResizableBox;
	ResizableBox.propTypes = _objectSpread(_objectSpread({}, _propTypes2.resizableProps), {}, { children: _propTypes.default.element });
}));
//#endregion
