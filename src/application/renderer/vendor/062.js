//#region node_modules/react-draggable/build/cjs/Draggable.js
var require_Draggable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __export = (target, all) => {
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
	var Draggable_exports = {};
	__export(Draggable_exports, {
		DraggableCore: () => DraggableCore,
		default: () => Draggable
	});
	module.exports = __toCommonJS(Draggable_exports);
	var React2 = __toESM(require_react());
	var import_prop_types2 = __toESM(require_prop_types());
	var import_react_dom2 = __toESM(require_react_dom());
	var import_clsx = require_clsx();
	function findInArray(array, callback) {
		for (let i = 0, length = array.length; i < length; i++) if (callback.apply(callback, [
			array[i],
			i,
			array
		])) return array[i];
	}
	function isFunction(func) {
		return typeof func === "function" || Object.prototype.toString.call(func) === "[object Function]";
	}
	function isNum(num) {
		return typeof num === "number" && !isNaN(num);
	}
	function int(a) {
		return parseInt(a, 10);
	}
	function dontSetMe(props, propName, componentName) {
		if (props[propName]) return /* @__PURE__ */ new Error(`Invalid prop ${propName} passed to ${componentName} - do not set this, set it on the child.`);
	}
	var prefixes = [
		"Moz",
		"Webkit",
		"O",
		"ms"
	];
	function getPrefix(prop = "transform") {
		var _a, _b;
		if (typeof window === "undefined") return "";
		const style = (_b = (_a = window.document) == null ? void 0 : _a.documentElement) == null ? void 0 : _b.style;
		if (!style) return "";
		if (prop in style) return "";
		for (let i = 0; i < prefixes.length; i++) if (browserPrefixToKey(prop, prefixes[i]) in style) return prefixes[i];
		return "";
	}
	function browserPrefixToKey(prop, prefix) {
		return prefix ? `${prefix}${kebabToTitleCase(prop)}` : prop;
	}
	function kebabToTitleCase(str) {
		let out = "";
		let shouldCapitalize = true;
		for (let i = 0; i < str.length; i++) if (shouldCapitalize) {
			out += str[i].toUpperCase();
			shouldCapitalize = false;
		} else if (str[i] === "-") shouldCapitalize = true;
		else out += str[i];
		return out;
	}
	var getPrefix_default = getPrefix();
	var matchesSelectorFunc = "";
	function matchesSelector(el, selector) {
		var _a;
		if (!matchesSelectorFunc) matchesSelectorFunc = (_a = findInArray([
			"matches",
			"webkitMatchesSelector",
			"mozMatchesSelector",
			"msMatchesSelector",
			"oMatchesSelector"
		], function(method) {
			return isFunction(el[method]);
		})) != null ? _a : "";
		const matchFn = el[matchesSelectorFunc];
		if (!isFunction(matchFn)) return false;
		return Boolean(matchFn.call(el, selector));
	}
	function matchesSelectorAndParentsTo(el, selector, baseNode) {
		let node = el;
		do {
			if (matchesSelector(node, selector)) return true;
			if (node === baseNode) return false;
			node = node.parentNode;
		} while (node);
		return false;
	}
	function addEvent(el, event, handler, inputOptions) {
		if (!el) return;
		const options = {
			capture: true,
			...inputOptions
		};
		const listener = handler;
		if (el.addEventListener) el.addEventListener(event, listener, options);
		else if (el.attachEvent) el.attachEvent("on" + event, listener);
		else el["on" + event] = listener;
	}
	function removeEvent(el, event, handler, inputOptions) {
		if (!el) return;
		const options = {
			capture: true,
			...inputOptions
		};
		const listener = handler;
		if (el.removeEventListener) el.removeEventListener(event, listener, options);
		else if (el.detachEvent) el.detachEvent("on" + event, listener);
		else el["on" + event] = null;
	}
	function outerHeight(node) {
		let height = node.clientHeight;
		const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
		height += int(computedStyle.borderTopWidth);
		height += int(computedStyle.borderBottomWidth);
		return height;
	}
	function outerWidth(node) {
		let width = node.clientWidth;
		const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
		width += int(computedStyle.borderLeftWidth);
		width += int(computedStyle.borderRightWidth);
		return width;
	}
	function innerHeight(node) {
		let height = node.clientHeight;
		const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
		height -= int(computedStyle.paddingTop);
		height -= int(computedStyle.paddingBottom);
		return height;
	}
	function innerWidth(node) {
		let width = node.clientWidth;
		const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
		width -= int(computedStyle.paddingLeft);
		width -= int(computedStyle.paddingRight);
		return width;
	}
	function offsetXYFromParent(evt, offsetParent, scale) {
		const offsetParentRect = offsetParent === offsetParent.ownerDocument.body ? {
			left: 0,
			top: 0
		} : offsetParent.getBoundingClientRect();
		return {
			x: (evt.clientX + offsetParent.scrollLeft - offsetParentRect.left) / scale,
			y: (evt.clientY + offsetParent.scrollTop - offsetParentRect.top) / scale
		};
	}
	function createCSSTransform(controlPos, positionOffset) {
		const translation = getTranslation(controlPos, positionOffset, "px");
		return { [browserPrefixToKey("transform", getPrefix_default)]: translation };
	}
	function createSVGTransform(controlPos, positionOffset) {
		return getTranslation(controlPos, positionOffset, "");
	}
	function getTranslation({ x, y }, positionOffset, unitSuffix) {
		let translation = `translate(${x}${unitSuffix},${y}${unitSuffix})`;
		if (positionOffset) translation = `translate(${`${typeof positionOffset.x === "string" ? positionOffset.x : positionOffset.x + unitSuffix}`}, ${`${typeof positionOffset.y === "string" ? positionOffset.y : positionOffset.y + unitSuffix}`})` + translation;
		return translation;
	}
	function getTouch(e, identifier) {
		return e.targetTouches && findInArray(e.targetTouches, (t) => identifier === t.identifier) || e.changedTouches && findInArray(e.changedTouches, (t) => identifier === t.identifier);
	}
	function getTouchIdentifier(e) {
		if (e.targetTouches && e.targetTouches[0]) return e.targetTouches[0].identifier;
		if (e.changedTouches && e.changedTouches[0]) return e.changedTouches[0].identifier;
	}
	function getDefaultNonce() {
		return typeof __webpack_nonce__ !== "undefined" ? __webpack_nonce__ : void 0;
	}
	function addUserSelectStyles(doc, nonce) {
		if (!doc) return;
		let styleEl = doc.getElementById("react-draggable-style-el");
		if (!styleEl) {
			styleEl = doc.createElement("style");
			styleEl.type = "text/css";
			styleEl.id = "react-draggable-style-el";
			const resolvedNonce = nonce != null ? nonce : getDefaultNonce();
			if (resolvedNonce) styleEl.setAttribute("nonce", resolvedNonce);
			styleEl.innerHTML = ".react-draggable-transparent-selection *::-moz-selection {all: inherit;}\n";
			styleEl.innerHTML += ".react-draggable-transparent-selection *::selection {all: inherit;}\n";
			doc.getElementsByTagName("head")[0].appendChild(styleEl);
		}
		if (doc.body) addClassName(doc.body, "react-draggable-transparent-selection");
	}
	function scheduleRemoveUserSelectStyles(doc) {
		if (window.requestAnimationFrame) window.requestAnimationFrame(() => {
			removeUserSelectStyles(doc);
		});
		else removeUserSelectStyles(doc);
	}
	function removeUserSelectStyles(doc) {
		if (!doc) return;
		try {
			if (doc.body) removeClassName(doc.body, "react-draggable-transparent-selection");
			const ieSelection = doc.selection;
			if (ieSelection) ieSelection.empty();
			else {
				const selection = (doc.defaultView || window).getSelection();
				if (selection && selection.type !== "Caret") selection.removeAllRanges();
			}
		} catch {}
	}
	function addClassName(el, className) {
		if (el.classList) el.classList.add(className);
		else if (!el.className.match(new RegExp(`(?:^|\\s)${className}(?!\\S)`))) el.className += ` ${className}`;
	}
	function removeClassName(el, className) {
		if (el.classList) el.classList.remove(className);
		else el.className = el.className.replace(new RegExp(`(?:^|\\s)${className}(?!\\S)`, "g"), "");
	}
	function getBoundPosition(draggable, x, y) {
		if (!draggable.props.bounds) return [x, y];
		let { bounds } = draggable.props;
		bounds = typeof bounds === "string" ? bounds : cloneBounds(bounds);
		const node = findDOMNode(draggable);
		if (typeof bounds === "string") {
			const { ownerDocument } = node;
			const ownerWindow = ownerDocument.defaultView;
			if (!ownerWindow) throw new Error("Cannot resolve the owner window of the draggable node.");
			let boundNode;
			if (bounds === "parent") boundNode = node.parentNode;
			else boundNode = node.getRootNode().querySelector(bounds);
			if (!(boundNode instanceof ownerWindow.HTMLElement)) throw new Error("Bounds selector \"" + bounds + "\" could not find an element.");
			const boundNodeEl = boundNode;
			const nodeStyle = ownerWindow.getComputedStyle(node);
			const boundNodeStyle = ownerWindow.getComputedStyle(boundNodeEl);
			bounds = {
				left: -node.offsetLeft + int(boundNodeStyle.paddingLeft) + int(nodeStyle.marginLeft),
				top: -node.offsetTop + int(boundNodeStyle.paddingTop) + int(nodeStyle.marginTop),
				right: innerWidth(boundNodeEl) - outerWidth(node) - node.offsetLeft + int(boundNodeStyle.paddingRight) - int(nodeStyle.marginRight),
				bottom: innerHeight(boundNodeEl) - outerHeight(node) - node.offsetTop + int(boundNodeStyle.paddingBottom) - int(nodeStyle.marginBottom)
			};
		}
		if (isNum(bounds.right)) x = Math.min(x, bounds.right);
		if (isNum(bounds.bottom)) y = Math.min(y, bounds.bottom);
		if (isNum(bounds.left)) x = Math.max(x, bounds.left);
		if (isNum(bounds.top)) y = Math.max(y, bounds.top);
		return [x, y];
	}
	function snapToGrid(grid, pendingX, pendingY) {
		return [Math.round(pendingX / grid[0]) * grid[0], Math.round(pendingY / grid[1]) * grid[1]];
	}
	function canDragX(draggable) {
		return draggable.props.axis === "both" || draggable.props.axis === "x";
	}
	function canDragY(draggable) {
		return draggable.props.axis === "both" || draggable.props.axis === "y";
	}
	function getControlPosition(e, touchIdentifier, draggableCore) {
		const touchObj = typeof touchIdentifier === "number" ? getTouch(e, touchIdentifier) : null;
		if (typeof touchIdentifier === "number" && !touchObj) return null;
		const node = findDOMNode(draggableCore);
		const offsetParent = draggableCore.props.offsetParent || node.offsetParent || node.ownerDocument.body;
		return offsetXYFromParent(touchObj || e, offsetParent, draggableCore.props.scale);
	}
	function createCoreData(draggable, x, y) {
		const isStart = !isNum(draggable.lastX);
		const node = findDOMNode(draggable);
		if (isStart) return {
			node,
			deltaX: 0,
			deltaY: 0,
			lastX: x,
			lastY: y,
			x,
			y
		};
		else return {
			node,
			deltaX: x - draggable.lastX,
			deltaY: y - draggable.lastY,
			lastX: draggable.lastX,
			lastY: draggable.lastY,
			x,
			y
		};
	}
	function createDraggableData(draggable, coreData) {
		const scale = draggable.props.scale;
		return {
			node: coreData.node,
			x: draggable.state.x + coreData.deltaX / scale,
			y: draggable.state.y + coreData.deltaY / scale,
			deltaX: coreData.deltaX / scale,
			deltaY: coreData.deltaY / scale,
			lastX: draggable.state.x,
			lastY: draggable.state.y
		};
	}
	function cloneBounds(bounds) {
		return {
			left: bounds.left,
			top: bounds.top,
			right: bounds.right,
			bottom: bounds.bottom
		};
	}
	function findDOMNode(draggable) {
		const node = draggable.findDOMNode();
		if (!node) throw new Error("<DraggableCore>: Unmounted during event!");
		return node;
	}
	var React = __toESM(require_react());
	var import_prop_types = __toESM(require_prop_types());
	var import_react_dom = __toESM(require_react_dom());
	var log_default = typeof process !== "undefined" && {}.DRAGGABLE_DEBUG ? console.log.bind(console) : function noop() {};
	var eventsFor = {
		touch: {
			start: "touchstart",
			move: "touchmove",
			stop: "touchend"
		},
		mouse: {
			start: "mousedown",
			move: "mousemove",
			stop: "mouseup"
		}
	};
	var dragEventFor = eventsFor.mouse;
	var DraggableCore = class extends React.Component {
		constructor() {
			super(...arguments);
			this.dragging = false;
			this.lastX = NaN;
			this.lastY = NaN;
			this.touchIdentifier = null;
			this.mounted = false;
			this.handleDragStart = (e) => {
				this.props.onMouseDown(e);
				if (!this.props.allowAnyClick && (typeof e.button === "number" && e.button !== 0 || e.ctrlKey)) return false;
				const thisNode = this.findDOMNode();
				if (!thisNode || !thisNode.ownerDocument || !thisNode.ownerDocument.body) throw new Error("<DraggableCore> not mounted on DragStart!");
				const { ownerDocument } = thisNode;
				if (this.props.disabled || !(e.target instanceof ownerDocument.defaultView.Node) || this.props.handle && !matchesSelectorAndParentsTo(e.target, this.props.handle, thisNode) || this.props.cancel && matchesSelectorAndParentsTo(e.target, this.props.cancel, thisNode)) return;
				if (e.type === "touchstart" && !this.props.allowMobileScroll) e.preventDefault();
				const touchIdentifier = getTouchIdentifier(e);
				this.touchIdentifier = touchIdentifier;
				const position = getControlPosition(e, touchIdentifier, this);
				if (position == null) return;
				const { x, y } = position;
				const coreEvent = createCoreData(this, x, y);
				log_default("DraggableCore: handleDragStart: %j", coreEvent);
				log_default("calling", this.props.onStart);
				if (this.props.onStart(e, coreEvent) === false || this.mounted === false) return;
				if (this.props.enableUserSelectHack) addUserSelectStyles(ownerDocument, this.props.nonce);
				this.dragging = true;
				this.lastX = x;
				this.lastY = y;
				addEvent(ownerDocument, dragEventFor.move, this.handleDrag);
				addEvent(ownerDocument, dragEventFor.stop, this.handleDragStop);
			};
			this.handleDrag = (e) => {
				const position = getControlPosition(e, this.touchIdentifier, this);
				if (position == null) return;
				let { x, y } = position;
				if (Array.isArray(this.props.grid)) {
					let deltaX = x - this.lastX, deltaY = y - this.lastY;
					[deltaX, deltaY] = snapToGrid(this.props.grid, deltaX, deltaY);
					if (!deltaX && !deltaY) return;
					x = this.lastX + deltaX;
					y = this.lastY + deltaY;
				}
				const coreEvent = createCoreData(this, x, y);
				log_default("DraggableCore: handleDrag: %j", coreEvent);
				if (this.props.onDrag(e, coreEvent) === false || this.mounted === false) {
					try {
						this.handleDragStop(new MouseEvent("mouseup"));
					} catch {
						const event = document.createEvent("MouseEvents");
						event.initMouseEvent("mouseup", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
						this.handleDragStop(event);
					}
					return;
				}
				this.lastX = x;
				this.lastY = y;
			};
			this.handleDragStop = (e) => {
				if (!this.dragging) return;
				const position = getControlPosition(e, this.touchIdentifier, this);
				if (position == null) return;
				let { x, y } = position;
				if (Array.isArray(this.props.grid)) {
					let deltaX = x - this.lastX || 0;
					let deltaY = y - this.lastY || 0;
					[deltaX, deltaY] = snapToGrid(this.props.grid, deltaX, deltaY);
					x = this.lastX + deltaX;
					y = this.lastY + deltaY;
				}
				const coreEvent = createCoreData(this, x, y);
				if (this.props.onStop(e, coreEvent) === false || this.mounted === false) return false;
				const thisNode = this.findDOMNode();
				if (thisNode) {
					if (this.props.enableUserSelectHack) scheduleRemoveUserSelectStyles(thisNode.ownerDocument);
				}
				log_default("DraggableCore: handleDragStop: %j", coreEvent);
				this.dragging = false;
				this.lastX = NaN;
				this.lastY = NaN;
				if (thisNode) {
					log_default("DraggableCore: Removing handlers");
					removeEvent(thisNode.ownerDocument, dragEventFor.move, this.handleDrag);
					removeEvent(thisNode.ownerDocument, dragEventFor.stop, this.handleDragStop);
				}
			};
			this.onMouseDown = (e) => {
				dragEventFor = eventsFor.mouse;
				return this.handleDragStart(e);
			};
			this.onMouseUp = (e) => {
				dragEventFor = eventsFor.mouse;
				return this.handleDragStop(e);
			};
			this.onTouchStart = (e) => {
				dragEventFor = eventsFor.touch;
				return this.handleDragStart(e);
			};
			this.onTouchEnd = (e) => {
				dragEventFor = eventsFor.touch;
				return this.handleDragStop(e);
			};
		}
		componentDidMount() {
			this.mounted = true;
			const thisNode = this.findDOMNode();
			if (thisNode) addEvent(thisNode, eventsFor.touch.start, this.onTouchStart, { passive: false });
		}
		componentWillUnmount() {
			this.mounted = false;
			const thisNode = this.findDOMNode();
			if (thisNode) {
				const { ownerDocument } = thisNode;
				removeEvent(ownerDocument, eventsFor.mouse.move, this.handleDrag);
				removeEvent(ownerDocument, eventsFor.touch.move, this.handleDrag);
				removeEvent(ownerDocument, eventsFor.mouse.stop, this.handleDragStop);
				removeEvent(ownerDocument, eventsFor.touch.stop, this.handleDragStop);
				removeEvent(thisNode, eventsFor.touch.start, this.onTouchStart, { passive: false });
				if (this.props.enableUserSelectHack) scheduleRemoveUserSelectStyles(ownerDocument);
			}
		}
		findDOMNode() {
			var _a;
			if ((_a = this.props) == null ? void 0 : _a.nodeRef) return this.props.nodeRef.current;
			const legacyReactDOM = import_react_dom.default;
			if (typeof legacyReactDOM.findDOMNode === "function") return legacyReactDOM.findDOMNode(this);
			log_default("react-draggable: ReactDOM.findDOMNode is not available in React 19+. You must provide a nodeRef prop. See: https://github.com/react-grid-layout/react-draggable#noderef");
			return null;
		}
		render() {
			return React.cloneElement(React.Children.only(this.props.children), {
				onMouseDown: this.onMouseDown,
				onMouseUp: this.onMouseUp,
				onTouchEnd: this.onTouchEnd
			});
		}
	};
	DraggableCore.displayName = "DraggableCore";
	DraggableCore.propTypes = {
		/**
		* `allowAnyClick` allows dragging using any mouse button.
		* By default, we only accept the left button.
		*
		* Defaults to `false`.
		*/
		allowAnyClick: import_prop_types.default.bool,
		/**
		* `allowMobileScroll` turns off cancellation of the 'touchstart' event
		* on mobile devices. Only enable this if you are having trouble with click
		* events. Prefer using 'handle' / 'cancel' instead.
		*
		* Defaults to `false`.
		*/
		allowMobileScroll: import_prop_types.default.bool,
		children: import_prop_types.default.node.isRequired,
		/**
		* `disabled`, if true, stops the <Draggable> from dragging. All handlers,
		* with the exception of `onMouseDown`, will not fire.
		*/
		disabled: import_prop_types.default.bool,
		/**
		* By default, we add 'user-select:none' attributes to the document body
		* to prevent ugly text selection during drag. If this is causing problems
		* for your app, set this to `false`.
		*/
		enableUserSelectHack: import_prop_types.default.bool,
		/**
		* `offsetParent`, if set, uses the passed DOM node to compute drag offsets
		* instead of using the parent node.
		*/
		offsetParent: function(props, propName) {
			if (props[propName] && props[propName].nodeType !== 1) throw new Error("Draggable's offsetParent must be a DOM Node.");
		},
		/**
		* `grid` specifies the x and y that dragging should snap to.
		*/
		grid: import_prop_types.default.arrayOf(import_prop_types.default.number),
		/**
		* `handle` specifies a selector to be used as the handle that initiates drag.
		*
		* Example:
		*
		* ```jsx
		*   let App = React.createClass({
		*       render: function () {
		*         return (
		*            <Draggable handle=".handle">
		*              <div>
		*                  <div className="handle">Click me to drag</div>
		*                  <div>This is some other content</div>
		*              </div>
		*           </Draggable>
		*         );
		*       }
		*   });
		* ```
		*/
		handle: import_prop_types.default.string,
		/**
		* `cancel` specifies a selector to be used to prevent drag initialization.
		*
		* Example:
		*
		* ```jsx
		*   let App = React.createClass({
		*       render: function () {
		*           return(
		*               <Draggable cancel=".cancel">
		*                   <div>
		*                     <div className="cancel">You can't drag from here</div>
		*                     <div>Dragging here works fine</div>
		*                   </div>
		*               </Draggable>
		*           );
		*       }
		*   });
		* ```
		*/
		cancel: import_prop_types.default.string,
		nodeRef: import_prop_types.default.object,
		/**
		* `nonce` is applied to the dynamically-injected <style> element used by the
		* user-select hack, so it isn't blocked under a strict Content Security
		* Policy (`style-src` without `'unsafe-inline'`). If omitted, webpack's
		* `__webpack_nonce__` global is used when available.
		*/
		nonce: import_prop_types.default.string,
		/**
		* Called when dragging starts.
		* If this function returns the boolean false, dragging will be canceled.
		*/
		onStart: import_prop_types.default.func,
		/**
		* Called while dragging.
		* If this function returns the boolean false, dragging will be canceled.
		*/
		onDrag: import_prop_types.default.func,
		/**
		* Called when dragging stops.
		* If this function returns the boolean false, the drag will remain active.
		*/
		onStop: import_prop_types.default.func,
		/**
		* A workaround option which can be passed if onMouseDown needs to be accessed,
		* since it'll always be blocked (as there is internal use of onMouseDown)
		*/
		onMouseDown: import_prop_types.default.func,
		/**
		* `scale`, if set, applies scaling while dragging an element
		*/
		scale: import_prop_types.default.number,
		/**
		* These properties should be defined on the child, not here.
		*/
		className: dontSetMe,
		style: dontSetMe,
		transform: dontSetMe
	};
	DraggableCore.defaultProps = {
		allowAnyClick: false,
		allowMobileScroll: false,
		disabled: false,
		enableUserSelectHack: true,
		onStart: function() {},
		onDrag: function() {},
		onStop: function() {},
		onMouseDown: function() {},
		scale: 1
	};
	var Draggable = class extends React2.Component {
		constructor(props) {
			super(props);
			this.onDragStart = (e, coreData) => {
				log_default("Draggable: onDragStart: %j", coreData);
				if (this.props.onStart(e, createDraggableData(this, coreData)) === false) return false;
				this.setState({
					dragging: true,
					dragged: true
				});
			};
			this.onDrag = (e, coreData) => {
				if (!this.state.dragging) return false;
				log_default("Draggable: onDrag: %j", coreData);
				const uiData = createDraggableData(this, coreData);
				const newState = {
					x: uiData.x,
					y: uiData.y,
					slackX: 0,
					slackY: 0
				};
				if (this.props.bounds) {
					const { x, y } = newState;
					newState.x += this.state.slackX;
					newState.y += this.state.slackY;
					const [newStateX, newStateY] = getBoundPosition(this, newState.x, newState.y);
					newState.x = newStateX;
					newState.y = newStateY;
					newState.slackX = this.state.slackX + (x - newState.x);
					newState.slackY = this.state.slackY + (y - newState.y);
					uiData.x = newState.x;
					uiData.y = newState.y;
					uiData.deltaX = newState.x - this.state.x;
					uiData.deltaY = newState.y - this.state.y;
				}
				if (this.props.onDrag(e, uiData) === false) return false;
				this.setState(newState);
			};
			this.onDragStop = (e, coreData) => {
				if (!this.state.dragging) return false;
				if (this.props.onStop(e, createDraggableData(this, coreData)) === false) return false;
				log_default("Draggable: onDragStop: %j", coreData);
				const newState = {
					dragging: false,
					slackX: 0,
					slackY: 0
				};
				if (Boolean(this.props.position)) {
					const { x, y } = this.props.position;
					newState.x = x;
					newState.y = y;
				}
				this.setState(newState);
			};
			this.state = {
				dragging: false,
				dragged: false,
				x: props.position ? props.position.x : props.defaultPosition.x,
				y: props.position ? props.position.y : props.defaultPosition.y,
				prevPropsPosition: { ...props.position },
				slackX: 0,
				slackY: 0,
				isElementSVG: false
			};
			if (props.position && !(props.onDrag || props.onStop)) console.warn("A `position` was applied to this <Draggable>, without drag handlers. This will make this component effectively undraggable. Please attach `onDrag` or `onStop` handlers so you can adjust the `position` of this element.");
		}
		static getDerivedStateFromProps({ position }, { prevPropsPosition }) {
			if (position && (!prevPropsPosition || position.x !== prevPropsPosition.x || position.y !== prevPropsPosition.y)) {
				log_default("Draggable: getDerivedStateFromProps %j", {
					position,
					prevPropsPosition
				});
				return {
					x: position.x,
					y: position.y,
					prevPropsPosition: { ...position }
				};
			}
			return null;
		}
		componentDidMount() {
			if (typeof window.SVGElement !== "undefined" && this.findDOMNode() instanceof window.SVGElement) this.setState({ isElementSVG: true });
		}
		componentWillUnmount() {
			if (this.state.dragging) this.setState({ dragging: false });
		}
		findDOMNode() {
			var _a;
			if ((_a = this.props) == null ? void 0 : _a.nodeRef) return this.props.nodeRef.current;
			const legacyReactDOM = import_react_dom2.default;
			if (typeof legacyReactDOM.findDOMNode === "function") return legacyReactDOM.findDOMNode(this);
			return null;
		}
		render() {
			const { axis, bounds, children, defaultPosition, defaultClassName, defaultClassNameDragging, defaultClassNameDragged, position, positionOffset, scale, ...draggableCoreProps } = this.props;
			let style = {};
			let svgTransform = null;
			const draggable = !Boolean(position) || this.state.dragging;
			const validPosition = position || defaultPosition;
			const transformOpts = {
				x: canDragX(this) && draggable ? this.state.x : validPosition.x,
				y: canDragY(this) && draggable ? this.state.y : validPosition.y
			};
			if (this.state.isElementSVG) svgTransform = createSVGTransform(transformOpts, positionOffset);
			else style = createCSSTransform(transformOpts, positionOffset);
			const onlyChild = React2.Children.only(children);
			const className = (0, import_clsx.clsx)(onlyChild.props.className || "", defaultClassName, {
				[defaultClassNameDragging]: this.state.dragging,
				[defaultClassNameDragged]: this.state.dragged
			});
			return /* @__PURE__ */ React2.createElement(DraggableCore, {
				...draggableCoreProps,
				onStart: this.onDragStart,
				onDrag: this.onDrag,
				onStop: this.onDragStop
			}, React2.cloneElement(onlyChild, {
				className,
				style: {
					...onlyChild.props.style,
					...style
				},
				transform: svgTransform
			}));
		}
	};
	Draggable.displayName = "Draggable";
	Draggable.propTypes = {
		...DraggableCore.propTypes,
		/**
		* `axis` determines which axis the draggable can move.
		*
		*  Note that all callbacks will still return data as normal. This only
		*  controls flushing to the DOM.
		*
		* 'both' allows movement horizontally and vertically.
		* 'x' limits movement to horizontal axis.
		* 'y' limits movement to vertical axis.
		* 'none' limits all movement.
		*
		* Defaults to 'both'.
		*/
		axis: import_prop_types2.default.oneOf([
			"both",
			"x",
			"y",
			"none"
		]),
		/**
		* `bounds` determines the range of movement available to the element.
		* Available values are:
		*
		* 'parent' restricts movement within the Draggable's parent node.
		*
		* Alternatively, pass an object with the following properties, all of which are optional:
		*
		* {left: LEFT_BOUND, right: RIGHT_BOUND, bottom: BOTTOM_BOUND, top: TOP_BOUND}
		*
		* All values are in px.
		*
		* Example:
		*
		* ```jsx
		*   let App = React.createClass({
		*       render: function () {
		*         return (
		*            <Draggable bounds={{right: 300, bottom: 300}}>
		*              <div>Content</div>
		*           </Draggable>
		*         );
		*       }
		*   });
		* ```
		*/
		bounds: import_prop_types2.default.oneOfType([
			import_prop_types2.default.shape({
				left: import_prop_types2.default.number,
				right: import_prop_types2.default.number,
				top: import_prop_types2.default.number,
				bottom: import_prop_types2.default.number
			}),
			import_prop_types2.default.string,
			import_prop_types2.default.oneOf([false])
		]),
		defaultClassName: import_prop_types2.default.string,
		defaultClassNameDragging: import_prop_types2.default.string,
		defaultClassNameDragged: import_prop_types2.default.string,
		/**
		* `defaultPosition` specifies the x and y that the dragged item should start at
		*
		* Example:
		*
		* ```jsx
		*      let App = React.createClass({
		*          render: function () {
		*              return (
		*                  <Draggable defaultPosition={{x: 25, y: 25}}>
		*                      <div>I start with transformX: 25px and transformY: 25px;</div>
		*                  </Draggable>
		*              );
		*          }
		*      });
		* ```
		*/
		defaultPosition: import_prop_types2.default.shape({
			x: import_prop_types2.default.number,
			y: import_prop_types2.default.number
		}),
		positionOffset: import_prop_types2.default.shape({
			x: import_prop_types2.default.oneOfType([import_prop_types2.default.number, import_prop_types2.default.string]),
			y: import_prop_types2.default.oneOfType([import_prop_types2.default.number, import_prop_types2.default.string])
		}),
		/**
		* `position`, if present, defines the current position of the element.
		*
		*  This is similar to how form elements in React work - if no `position` is supplied, the component
		*  is uncontrolled.
		*
		* Example:
		*
		* ```jsx
		*      let App = React.createClass({
		*          render: function () {
		*              return (
		*                  <Draggable position={{x: 25, y: 25}}>
		*                      <div>I start with transformX: 25px and transformY: 25px;</div>
		*                  </Draggable>
		*              );
		*          }
		*      });
		* ```
		*/
		position: import_prop_types2.default.shape({
			x: import_prop_types2.default.number,
			y: import_prop_types2.default.number
		}),
		/**
		* These properties should be defined on the child, not here.
		*/
		className: dontSetMe,
		style: dontSetMe,
		transform: dontSetMe
	};
	Draggable.defaultProps = {
		...DraggableCore.defaultProps,
		axis: "both",
		bounds: false,
		defaultClassName: "react-draggable",
		defaultClassNameDragging: "react-draggable-dragging",
		defaultClassNameDragged: "react-draggable-dragged",
		defaultPosition: {
			x: 0,
			y: 0
		},
		scale: 1
	};
	0 && (module.exports = { DraggableCore });
}));
//#endregion
