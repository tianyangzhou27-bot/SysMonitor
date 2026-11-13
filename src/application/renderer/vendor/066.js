//#region node_modules/react-resizable/build/Resizable.js
var require_Resizable = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.__esModule = true;
	exports.default = void 0;
	var React = _interopRequireWildcard(require_react());
	var _reactDraggable = require_cjs();
	var _utils = require_utils();
	var _propTypes = require_propTypes();
	var _excluded = [
		"children",
		"className",
		"draggableOpts",
		"width",
		"height",
		"handle",
		"handleSize",
		"lockAspectRatio",
		"axis",
		"minConstraints",
		"maxConstraints",
		"onResize",
		"onResizeStop",
		"onResizeStart",
		"resizeHandles",
		"transformScale"
	];
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
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (-1 !== e.indexOf(n)) continue;
			t[n] = r[n];
		}
		return t;
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
	var Resizable = class extends React.Component {
		constructor() {
			super(...arguments);
			this.handleRefs = {};
			this.lastHandleRect = null;
			this.slack = null;
			this.lastSize = null;
		}
		componentWillUnmount() {
			this.resetData();
		}
		resetData() {
			this.lastHandleRect = this.slack = this.lastSize = null;
		}
		runConstraints(width, height) {
			const _this$props = this.props, minConstraints = _this$props.minConstraints, maxConstraints = _this$props.maxConstraints, lockAspectRatio = _this$props.lockAspectRatio;
			if (!minConstraints && !maxConstraints && !lockAspectRatio) return [width, height];
			if (lockAspectRatio) {
				const ratio = this.props.width / this.props.height;
				const deltaW = width - this.props.width;
				const deltaH = height - this.props.height;
				if (Math.abs(deltaW) > Math.abs(deltaH * ratio)) height = width / ratio;
				else width = height * ratio;
			}
			const oldW = width, oldH = height;
			let _ref = this.slack || [0, 0], slackW = _ref[0], slackH = _ref[1];
			width += slackW;
			height += slackH;
			if (minConstraints) {
				width = Math.max(minConstraints[0], width);
				height = Math.max(minConstraints[1], height);
			}
			if (maxConstraints) {
				width = Math.min(maxConstraints[0], width);
				height = Math.min(maxConstraints[1], height);
			}
			this.slack = [slackW + (oldW - width), slackH + (oldH - height)];
			return [width, height];
		}
		/**
		* Wrapper around drag events to provide more useful data.
		*
		* @param  {String} handlerName Handler name to wrap.
		* @return {Function}           Handler function.
		*/
		resizeHandler(handlerName, axis) {
			return (e, _ref2) => {
				var _this$lastSize$width, _this$lastSize, _this$lastSize$height, _this$lastSize2;
				let node = _ref2.node, deltaX = _ref2.deltaX, deltaY = _ref2.deltaY;
				if (handlerName === "onResizeStart") this.resetData();
				const canDragX = (this.props.axis === "both" || this.props.axis === "x") && axis !== "n" && axis !== "s";
				const canDragY = (this.props.axis === "both" || this.props.axis === "y") && axis !== "e" && axis !== "w";
				if (!canDragX && !canDragY) return;
				const axisV = axis[0];
				const axisH = axis[axis.length - 1];
				const handleRect = node.getBoundingClientRect();
				if (this.lastHandleRect != null) {
					if (axisH === "w") {
						const deltaLeftSinceLast = handleRect.left - this.lastHandleRect.left;
						deltaX += deltaLeftSinceLast;
					}
					if (axisV === "n") {
						const deltaTopSinceLast = handleRect.top - this.lastHandleRect.top;
						deltaY += deltaTopSinceLast;
					}
				}
				this.lastHandleRect = handleRect;
				if (axisH === "w") deltaX = -deltaX;
				if (axisV === "n") deltaY = -deltaY;
				const baseWidth = (_this$lastSize$width = (_this$lastSize = this.lastSize) == null ? void 0 : _this$lastSize.width) != null ? _this$lastSize$width : this.props.width;
				const baseHeight = (_this$lastSize$height = (_this$lastSize2 = this.lastSize) == null ? void 0 : _this$lastSize2.height) != null ? _this$lastSize$height : this.props.height;
				let width = baseWidth + (canDragX ? deltaX / this.props.transformScale : 0);
				let height = baseHeight + (canDragY ? deltaY / this.props.transformScale : 0);
				var _this$runConstraints = this.runConstraints(width, height);
				width = _this$runConstraints[0];
				height = _this$runConstraints[1];
				if (handlerName === "onResizeStop" && this.lastSize) {
					var _this$lastSize3 = this.lastSize;
					width = _this$lastSize3.width;
					height = _this$lastSize3.height;
				}
				const dimensionsChanged = width !== baseWidth || height !== baseHeight;
				if (handlerName !== "onResizeStop") this.lastSize = {
					width,
					height
				};
				const cb = typeof this.props[handlerName] === "function" ? this.props[handlerName] : null;
				if (cb && !(handlerName === "onResize" && !dimensionsChanged)) {
					e.persist == null || e.persist();
					cb(e, {
						node,
						size: {
							width,
							height
						},
						handle: axis
					});
				}
				if (handlerName === "onResizeStop") this.resetData();
			};
		}
		renderResizeHandle(handleAxis, ref) {
			const handle = this.props.handle;
			if (!handle) return /*#__PURE__*/ React.createElement("span", {
				className: "react-resizable-handle react-resizable-handle-" + handleAxis,
				ref
			});
			if (typeof handle === "function") return handle(handleAxis, ref);
			const isDOMElement = typeof handle.type === "string";
			const props = _objectSpread({ ref }, isDOMElement ? {} : { handleAxis });
			return /*#__PURE__*/ React.cloneElement(handle, props);
		}
		render() {
			const _this$props2 = this.props, children = _this$props2.children, className = _this$props2.className, draggableOpts = _this$props2.draggableOpts;
			_this$props2.width;
			_this$props2.height;
			_this$props2.handle;
			_this$props2.handleSize;
			_this$props2.lockAspectRatio;
			_this$props2.axis;
			_this$props2.minConstraints;
			_this$props2.maxConstraints;
			_this$props2.onResize;
			_this$props2.onResizeStop;
			_this$props2.onResizeStart;
			const resizeHandles = _this$props2.resizeHandles;
			_this$props2.transformScale;
			const p = _objectWithoutPropertiesLoose(_this$props2, _excluded);
			return (0, _utils.cloneElement)(children, _objectSpread(_objectSpread({}, p), {}, {
				className: (className ? className + " " : "") + "react-resizable",
				children: [...React.Children.toArray(children.props.children), ...resizeHandles.map((handleAxis) => {
					var _this$handleRefs$hand;
					const ref = (_this$handleRefs$hand = this.handleRefs[handleAxis]) != null ? _this$handleRefs$hand : this.handleRefs[handleAxis] = /*#__PURE__*/ React.createRef();
					return /*#__PURE__*/ React.createElement(_reactDraggable.DraggableCore, _extends({}, draggableOpts, {
						nodeRef: ref,
						key: "resizableHandle-" + handleAxis,
						onStop: this.resizeHandler("onResizeStop", handleAxis),
						onStart: this.resizeHandler("onResizeStart", handleAxis),
						onDrag: this.resizeHandler("onResize", handleAxis)
					}), this.renderResizeHandle(handleAxis, ref));
				})]
			}));
		}
	};
	exports.default = Resizable;
	Resizable.propTypes = _propTypes.resizableProps;
	Resizable.defaultProps = {
		axis: "both",
		handleSize: [20, 20],
		lockAspectRatio: false,
		minConstraints: [20, 20],
		maxConstraints: [Infinity, Infinity],
		resizeHandles: ["se"],
		transformScale: 1
	};
}));
//#endregion
