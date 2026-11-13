//#region node_modules/react-grid-layout/dist/chunk-Z6CWRR74.mjs
var import_react_resizable = require_react_resizable();
var import_jsx_runtime = require_jsx_runtime();
var import_fast_equals = require_fast_equals();
var EDGE_THRESHOLD = 50;
var SCROLL_STEP = 12;
function getNearestScrollable(node) {
	let el = node;
	while (el) {
		const overflowY = window.getComputedStyle(el).overflowY;
		if ((overflowY === "auto" || overflowY === "scroll") && el.scrollHeight > el.clientHeight) return el;
		el = el.parentElement;
	}
	return null;
}
function createEdgeScrollController(node) {
	const scrollContainer = getNearestScrollable(node);
	let rafId = null;
	let lastX = 0;
	let lastY = 0;
	let running = false;
	function step() {
		const container = scrollContainer;
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const { clientHeight, scrollTop, scrollHeight } = container;
		const { scrollLeft, scrollWidth, clientWidth } = container;
		let dy = 0;
		let dx = 0;
		if (lastY < rect.top + EDGE_THRESHOLD && scrollTop > 0) dy = -SCROLL_STEP;
		else if (lastY > rect.bottom - EDGE_THRESHOLD && scrollTop + clientHeight < scrollHeight) dy = SCROLL_STEP;
		if (lastX < rect.left + EDGE_THRESHOLD && scrollLeft > 0) dx = -SCROLL_STEP;
		else if (lastX > rect.right - EDGE_THRESHOLD && scrollLeft + clientWidth < scrollWidth) dx = SCROLL_STEP;
		if (dy !== 0 || dx !== 0) {
			container.scrollTop += dy;
			container.scrollLeft += dx;
		}
		if (running) rafId = requestAnimationFrame(step);
	}
	return {
		feed(clientX, clientY) {
			lastX = clientX;
			lastY = clientY;
			if (!running) {
				running = true;
				rafId = requestAnimationFrame(step);
			}
		},
		stop() {
			running = false;
			if (rafId !== null) {
				cancelAnimationFrame(rafId);
				rafId = null;
			}
		}
	};
}
function GridItemInner(props) {
	const { children, cols, containerWidth, margin, containerPadding, rowHeight, maxRows, isDraggable, isResizable, isBounded, allowMobileScroll, static: isStatic, useCSSTransforms = true, usePercentages = false, transformScale = 1, positionStrategy, dragThreshold = 0, droppingPosition, className = "", style, handle = "", cancel = "", x, y, w, h, minW = 1, maxW = Infinity, minH = 1, maxH = Infinity, i, resizeHandles, resizeHandle, constraints = defaultConstraints, layoutItem, layout = [], onDragStart: onDragStartProp, onDrag: onDragProp, onDragStop: onDragStopProp, onResizeStart: onResizeStartProp, onResize: onResizeProp, onResizeStop: onResizeStopProp } = props;
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [resizing, setResizing] = (0, import_react.useState)(false);
	const elementRef = (0, import_react.useRef)(null);
	const dragPositionRef = (0, import_react.useRef)({
		left: 0,
		top: 0
	});
	const resizePositionRef = (0, import_react.useRef)({
		top: 0,
		left: 0,
		width: 0,
		height: 0
	});
	const prevDroppingPositionRef = (0, import_react.useRef)(void 0);
	const layoutRef = (0, import_react.useRef)(layout);
	layoutRef.current = layout;
	const onDragStartRef = (0, import_react.useRef)(null);
	const onDragRef = (0, import_react.useRef)(null);
	const dragPendingRef = (0, import_react.useRef)(false);
	const initialDragClientRef = (0, import_react.useRef)({
		x: 0,
		y: 0
	});
	const thresholdExceededRef = (0, import_react.useRef)(false);
	const edgeScrollRef = (0, import_react.useRef)(null);
	const positionParams = (0, import_react.useMemo)(() => ({
		cols,
		containerPadding,
		containerWidth,
		margin,
		maxRows,
		rowHeight
	}), [
		cols,
		containerPadding,
		containerWidth,
		margin,
		maxRows,
		rowHeight
	]);
	const constraintContext = (0, import_react.useMemo)(() => ({
		cols,
		maxRows,
		containerWidth,
		containerHeight: 0,
		rowHeight,
		margin,
		layout: []
	}), [
		cols,
		maxRows,
		containerWidth,
		rowHeight,
		margin
	]);
	const getConstraintContext = (0, import_react.useCallback)((containerHeight) => ({
		...constraintContext,
		containerHeight: containerHeight ?? constraintContext.containerHeight,
		layout: layoutRef.current
	}), [constraintContext]);
	const effectiveLayoutItem = (0, import_react.useMemo)(() => layoutItem ?? {
		i,
		x,
		y,
		w,
		h,
		minW,
		maxW,
		minH,
		maxH
	}, [
		layoutItem,
		i,
		x,
		y,
		w,
		h,
		minW,
		maxW,
		minH,
		maxH
	]);
	const createStyle = (0, import_react.useCallback)((pos2) => {
		if (positionStrategy?.calcStyle) return positionStrategy.calcStyle(pos2);
		if (useCSSTransforms) return setTransform(pos2);
		const styleObj = setTopLeft(pos2);
		if (usePercentages) return {
			...styleObj,
			left: perc(pos2.left / containerWidth),
			width: perc(pos2.width / containerWidth)
		};
		return styleObj;
	}, [
		positionStrategy,
		useCSSTransforms,
		usePercentages,
		containerWidth
	]);
	const onDragStart = (0, import_react.useCallback)((e, { node }) => {
		if (!onDragStartProp) return;
		const { offsetParent } = node;
		if (!offsetParent) return;
		const parentRect = offsetParent.getBoundingClientRect();
		const clientRect = node.getBoundingClientRect();
		const cLeft = clientRect.left / transformScale;
		const pLeft = parentRect.left / transformScale;
		const cTop = clientRect.top / transformScale;
		const pTop = parentRect.top / transformScale;
		let newPosition;
		if (positionStrategy?.calcDragPosition) {
			const mouseEvent = e;
			newPosition = positionStrategy.calcDragPosition(mouseEvent.clientX, mouseEvent.clientY, mouseEvent.clientX - clientRect.left, mouseEvent.clientY - clientRect.top);
		} else newPosition = {
			left: cLeft - pLeft + offsetParent.scrollLeft,
			top: cTop - pTop + offsetParent.scrollTop
		};
		dragPositionRef.current = newPosition;
		if (!edgeScrollRef.current) edgeScrollRef.current = createEdgeScrollController(node instanceof HTMLElement ? node : null);
		if (dragThreshold > 0) {
			const mouseEvent = e;
			initialDragClientRef.current = {
				x: mouseEvent.clientX,
				y: mouseEvent.clientY
			};
			dragPendingRef.current = true;
			thresholdExceededRef.current = false;
			setDragging(true);
			return;
		}
		setDragging(true);
		const rawPos = calcXYRaw(positionParams, newPosition.top, newPosition.left);
		const { x: newX, y: newY } = applyPositionConstraints(constraints, effectiveLayoutItem, rawPos.x, rawPos.y, getConstraintContext());
		onDragStartProp(i, newX, newY, {
			e,
			node,
			newPosition
		});
	}, [
		onDragStartProp,
		transformScale,
		positionParams,
		positionStrategy,
		dragThreshold,
		constraints,
		effectiveLayoutItem,
		getConstraintContext,
		i
	]);
	const onDrag = (0, import_react.useCallback)((e, { node, deltaX, deltaY }) => {
		if (!onDragProp || !dragging) return;
		const mouseEvent = e;
		if (dragPendingRef.current && !thresholdExceededRef.current) {
			const dx = mouseEvent.clientX - initialDragClientRef.current.x;
			const dy = mouseEvent.clientY - initialDragClientRef.current.y;
			if (Math.hypot(dx, dy) < dragThreshold) return;
			thresholdExceededRef.current = true;
			dragPendingRef.current = false;
			if (onDragStartProp) {
				const rawPos2 = calcXYRaw(positionParams, dragPositionRef.current.top, dragPositionRef.current.left);
				const { x: startX, y: startY } = applyPositionConstraints(constraints, effectiveLayoutItem, rawPos2.x, rawPos2.y, getConstraintContext());
				onDragStartProp(i, startX, startY, {
					e,
					node,
					newPosition: dragPositionRef.current
				});
			}
		}
		edgeScrollRef.current?.feed(mouseEvent.clientX, mouseEvent.clientY);
		let top = dragPositionRef.current.top + deltaY;
		let left = dragPositionRef.current.left + deltaX;
		if (isBounded) {
			const { offsetParent } = node;
			if (offsetParent) {
				const bottomBoundary = offsetParent.clientHeight - calcGridItemWHPx(h, rowHeight, margin[1]);
				top = clamp$2(top, 0, bottomBoundary);
				const colWidth2 = calcGridColWidth(positionParams);
				const rightBoundary = containerWidth - calcGridItemWHPx(w, colWidth2, margin[0]);
				left = clamp$2(left, 0, rightBoundary);
			}
		}
		const newPosition = {
			top,
			left
		};
		dragPositionRef.current = newPosition;
		const rawPos = calcXYRaw(positionParams, top, left);
		const { x: newX, y: newY } = applyPositionConstraints(constraints, effectiveLayoutItem, rawPos.x, rawPos.y, getConstraintContext());
		onDragProp(i, newX, newY, {
			e,
			node,
			newPosition
		});
	}, [
		onDragProp,
		onDragStartProp,
		dragging,
		dragThreshold,
		isBounded,
		h,
		rowHeight,
		margin,
		positionParams,
		containerWidth,
		w,
		i,
		constraints,
		effectiveLayoutItem,
		getConstraintContext
	]);
	const onDragStop = (0, import_react.useCallback)((e, { node }) => {
		if (!onDragStopProp || !dragging) return;
		edgeScrollRef.current?.stop();
		edgeScrollRef.current = null;
		const wasPending = dragPendingRef.current;
		dragPendingRef.current = false;
		thresholdExceededRef.current = false;
		initialDragClientRef.current = {
			x: 0,
			y: 0
		};
		if (wasPending) {
			setDragging(false);
			dragPositionRef.current = {
				left: 0,
				top: 0
			};
			return;
		}
		const { left, top } = dragPositionRef.current;
		const newPosition = {
			top,
			left
		};
		setDragging(false);
		dragPositionRef.current = {
			left: 0,
			top: 0
		};
		const rawPos = calcXYRaw(positionParams, top, left);
		const { x: newX, y: newY } = applyPositionConstraints(constraints, effectiveLayoutItem, rawPos.x, rawPos.y, getConstraintContext());
		onDragStopProp(i, newX, newY, {
			e,
			node,
			newPosition
		});
	}, [
		onDragStopProp,
		dragging,
		positionParams,
		constraints,
		effectiveLayoutItem,
		getConstraintContext,
		i
	]);
	onDragStartRef.current = onDragStart;
	onDragRef.current = onDrag;
	const onResizeHandler = (0, import_react.useCallback)((e, { node, size, handle: resizeHandle2 }, position, handlerName) => {
		const handler = handlerName === "onResizeStart" ? onResizeStartProp : handlerName === "onResize" ? onResizeProp : onResizeStopProp;
		if (!handler) return;
		let updatedSize;
		if (node) updatedSize = resizeItemInDirection(resizeHandle2, position, size, containerWidth);
		else updatedSize = {
			...size,
			top: position.top,
			left: position.left
		};
		resizePositionRef.current = updatedSize;
		const containerHeight = node?.offsetParent?.clientHeight ?? 0;
		const rawSize = calcWHRaw(positionParams, updatedSize.width, updatedSize.height);
		const { w: newW, h: newH } = applySizeConstraints(constraints, effectiveLayoutItem, rawSize.w, rawSize.h, resizeHandle2, getConstraintContext(containerHeight));
		handler(i, newW, newH, {
			e: e.nativeEvent ?? e,
			node,
			size: updatedSize,
			handle: resizeHandle2
		});
	}, [
		onResizeStartProp,
		onResizeProp,
		onResizeStopProp,
		containerWidth,
		positionParams,
		i,
		constraints,
		effectiveLayoutItem,
		getConstraintContext
	]);
	const handleResizeStart = (0, import_react.useCallback)((e, data) => {
		setResizing(true);
		const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
		const typedData = {
			...data,
			handle: data.handle
		};
		onResizeHandler(e, typedData, pos2, "onResizeStart");
	}, [
		onResizeHandler,
		positionParams,
		x,
		y,
		w,
		h
	]);
	const handleResize = (0, import_react.useCallback)((e, data) => {
		const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
		const typedData = {
			...data,
			handle: data.handle
		};
		onResizeHandler(e, typedData, pos2, "onResize");
	}, [
		onResizeHandler,
		positionParams,
		x,
		y,
		w,
		h
	]);
	const handleResizeStop = (0, import_react.useCallback)((e, data) => {
		setResizing(false);
		resizePositionRef.current = {
			top: 0,
			left: 0,
			width: 0,
			height: 0
		};
		const pos2 = calcGridItemPosition(positionParams, x, y, w, h);
		const typedData = {
			...data,
			handle: data.handle
		};
		onResizeHandler(e, typedData, pos2, "onResizeStop");
	}, [
		onResizeHandler,
		positionParams,
		x,
		y,
		w,
		h
	]);
	(0, import_react.useEffect)(() => {
		if (!droppingPosition) return;
		const node = elementRef.current;
		if (!node) return;
		const prevDroppingPosition = prevDroppingPositionRef.current || {
			left: 0,
			top: 0
		};
		const shouldDrag = dragging && (droppingPosition.left !== prevDroppingPosition.left || droppingPosition.top !== prevDroppingPosition.top);
		if (!dragging) {
			const fakeData = {
				node,
				deltaX: droppingPosition.left,
				deltaY: droppingPosition.top,
				lastX: 0,
				lastY: 0,
				x: droppingPosition.left,
				y: droppingPosition.top
			};
			onDragStartRef.current?.(droppingPosition.e, fakeData);
		} else if (shouldDrag) {
			const fakeData = {
				node,
				deltaX: droppingPosition.left - dragPositionRef.current.left,
				deltaY: droppingPosition.top - dragPositionRef.current.top,
				lastX: dragPositionRef.current.left,
				lastY: dragPositionRef.current.top,
				x: droppingPosition.left,
				y: droppingPosition.top
			};
			onDragRef.current?.(droppingPosition.e, fakeData);
		}
		prevDroppingPositionRef.current = droppingPosition;
	}, [
		droppingPosition,
		dragging,
		i
	]);
	const pos = calcGridItemPosition(positionParams, x, y, w, h, dragging ? dragPositionRef.current : null, resizing ? resizePositionRef.current : null);
	const child = import_react.Children.only(children);
	const colWidth = calcGridColWidth(positionParams);
	const minConstraints = [calcGridItemWHPx(minW, colWidth, margin[0]), calcGridItemWHPx(minH, rowHeight, margin[1])];
	const maxConstraints = [calcGridItemWHPx(maxW, colWidth, margin[0]), calcGridItemWHPx(maxH, rowHeight, margin[1])];
	const childProps = child.props;
	const childClassName = childProps["className"];
	const childStyle = childProps["style"];
	let newChild = import_react.cloneElement(child, {
		ref: elementRef,
		className: clsx("react-grid-item", childClassName, className, {
			static: isStatic,
			resizing,
			"react-draggable": isDraggable,
			"react-draggable-dragging": dragging,
			dropping: Boolean(droppingPosition),
			cssTransforms: useCSSTransforms
		}),
		style: {
			...style,
			...childStyle,
			...createStyle(pos)
		}
	});
	const resizableHandle = resizeHandle;
	newChild = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react_resizable.Resizable, {
		draggableOpts: { disabled: !isResizable },
		className: isResizable ? void 0 : "react-resizable-hide",
		width: pos.width,
		height: pos.height,
		minConstraints,
		maxConstraints,
		onResizeStart: handleResizeStart,
		onResize: handleResize,
		onResizeStop: handleResizeStop,
		transformScale,
		resizeHandles,
		handle: resizableHandle,
		children: newChild
	});
	newChild = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DraggableCore, {
		disabled: !isDraggable,
		onStart: onDragStart,
		onDrag,
		onStop: onDragStop,
		handle,
		cancel: ".react-resizable-handle" + (cancel ? "," + cancel : ""),
		scale: transformScale,
		allowMobileScroll,
		nodeRef: elementRef,
		children: newChild
	});
	return newChild;
}
var GridItem = import_react.memo(GridItemInner, (prev, next) => {
	if (prev.x !== next.x || prev.y !== next.y) return false;
	if (prev.w !== next.w || prev.h !== next.h) return false;
	if (prev.minW !== next.minW || prev.maxW !== next.maxW) return false;
	if (prev.minH !== next.minH || prev.maxH !== next.maxH) return false;
	if (prev.cols !== next.cols) return false;
	if (prev.containerWidth !== next.containerWidth) return false;
	if (prev.rowHeight !== next.rowHeight) return false;
	if (prev.maxRows !== next.maxRows) return false;
	if (prev.margin !== next.margin) return false;
	if (prev.containerPadding !== next.containerPadding) return false;
	if (prev.transformScale !== next.transformScale) return false;
	if (prev.isDraggable !== next.isDraggable) return false;
	if (prev.isResizable !== next.isResizable) return false;
	if (prev.isBounded !== next.isBounded) return false;
	if (prev.allowMobileScroll !== next.allowMobileScroll) return false;
	if (prev.useCSSTransforms !== next.useCSSTransforms) return false;
	if (prev.usePercentages !== next.usePercentages) return false;
	if (prev.children !== next.children) return false;
	if (prev.onDrag !== next.onDrag) return false;
	if (prev.onDragStop !== next.onDragStop) return false;
	if (prev.onResize !== next.onResize) return false;
	if (prev.onResizeStop !== next.onResizeStop) return false;
	if (prev.droppingPosition !== next.droppingPosition) return false;
	return true;
});
GridItem.displayName = "GridItem";
function computeDropPosition(input) {
	const { clientX, clientY, gridElement, droppingItem, event, dragOffsetX = 0, dragOffsetY = 0, transformScale, cols, margin, maxRows, rowHeight, width, containerPadding } = input;
	const gridRect = gridElement.getBoundingClientRect();
	const positionParams = {
		cols,
		margin,
		maxRows,
		rowHeight,
		containerWidth: width,
		containerPadding
	};
	const actualColWidth = calcGridColWidth(positionParams);
	const itemPixelWidth = calcGridItemWHPx(droppingItem.w, actualColWidth, margin[0]);
	const itemPixelHeight = calcGridItemWHPx(droppingItem.h, rowHeight, margin[1]);
	const itemCenterOffsetX = itemPixelWidth / 2;
	const itemCenterOffsetY = itemPixelHeight / 2;
	const scrollLeft = gridElement.scrollLeft ?? 0;
	const scrollTop = gridElement.scrollTop ?? 0;
	const rawGridX = clientX - gridRect.left + scrollLeft + dragOffsetX - itemCenterOffsetX;
	const rawGridY = clientY - gridRect.top + scrollTop + dragOffsetY - itemCenterOffsetY;
	const clampedGridX = Math.max(0, rawGridX);
	const clampedGridY = Math.max(0, rawGridY);
	return {
		newDroppingPosition: {
			left: clampedGridX / transformScale,
			top: clampedGridY / transformScale,
			e: event
		},
		calculatedXY: calcXY(positionParams, clampedGridY, clampedGridX, droppingItem.w, droppingItem.h)
	};
}
var noop$1 = () => {};
var layoutClassName = "react-grid-layout";
var isFirefox = false;
try {
	isFirefox = /firefox/i.test(navigator.userAgent);
} catch {}
function childrenEqual(a, b) {
	const aArr = import_react.Children.toArray(a);
	const bArr = import_react.Children.toArray(b);
	if (aArr.length !== bArr.length) return false;
	for (let i = 0; i < aArr.length; i++) {
		const aChild = aArr[i];
		const bChild = bArr[i];
		if (aChild?.key !== bChild?.key) return false;
	}
	return true;
}
function synchronizeLayoutWithChildren(initialLayout, children, cols, compactor) {
	const layout = [];
	const childKeys = /* @__PURE__ */ new Set();
	import_react.Children.forEach(children, (child) => {
		if (!import_react.isValidElement(child) || child.key === null) return;
		const key = String(child.key);
		childKeys.add(key);
		const existingItem = initialLayout.find((l) => l.i === key);
		if (existingItem) layout.push(cloneLayoutItem(existingItem));
		else {
			const dataGrid = child.props["data-grid"];
			if (dataGrid) layout.push({
				i: key,
				x: dataGrid.x ?? 0,
				y: dataGrid.y ?? 0,
				w: dataGrid.w ?? 1,
				h: dataGrid.h ?? 1,
				minW: dataGrid.minW,
				maxW: dataGrid.maxW,
				minH: dataGrid.minH,
				maxH: dataGrid.maxH,
				static: dataGrid.static,
				isDraggable: dataGrid.isDraggable,
				isResizable: dataGrid.isResizable,
				resizeHandles: dataGrid.resizeHandles,
				isBounded: dataGrid.isBounded
			});
			else layout.push({
				i: key,
				x: 0,
				y: bottom(layout),
				w: 1,
				h: 1
			});
		}
	});
	const corrected = correctBounds(layout, { cols });
	return compactor.compact(corrected, cols);
}
function GridLayout(props) {
	const { children, width, gridConfig: gridConfigProp, dragConfig: dragConfigProp, resizeConfig: resizeConfigProp, dropConfig: dropConfigProp, positionStrategy = defaultPositionStrategy, compactor: compactorProp, constraints = defaultConstraints, layout: propsLayout = [], droppingItem: droppingItemProp, autoSize = true, className = "", style = {}, innerRef, onLayoutChange = noop$1, onDragStart: onDragStartProp = noop$1, onDrag: onDragProp = noop$1, onDragStop: onDragStopProp = noop$1, onResizeStart: onResizeStartProp = noop$1, onResize: onResizeProp = noop$1, onResizeStop: onResizeStopProp = noop$1, onDrop: onDropProp = noop$1, onDropDragOver: onDropDragOverProp = noop$1 } = props;
	const gridConfig = (0, import_react.useMemo)(() => ({
		...defaultGridConfig,
		...gridConfigProp
	}), [gridConfigProp]);
	const dragConfig = (0, import_react.useMemo)(() => ({
		...defaultDragConfig,
		...dragConfigProp
	}), [dragConfigProp]);
	const resizeConfig = (0, import_react.useMemo)(() => ({
		...defaultResizeConfig,
		...resizeConfigProp
	}), [resizeConfigProp]);
	const dropConfig = (0, import_react.useMemo)(() => ({
		...defaultDropConfig,
		...dropConfigProp
	}), [dropConfigProp]);
	const { cols, rowHeight, maxRows, margin, containerPadding } = gridConfig;
	const { enabled: isDraggable, bounded: isBounded, handle: draggableHandle, cancel: draggableCancel, threshold: dragThreshold, allowMobileScroll: dragAllowMobileScroll } = dragConfig;
	const { enabled: isResizable, handles: resizeHandles, handleComponent: resizeHandle } = resizeConfig;
	const { enabled: isDroppable, defaultItem: defaultDropItem, onDragOver: dropConfigOnDragOver, touchEnabled = true, touchDragSource = "[data-rgl-draggable]" } = dropConfig;
	const compactor = compactorProp ?? getCompactor("vertical");
	const compactType = compactor.type;
	const allowOverlap = compactor.allowOverlap;
	const preventCollision = compactor.preventCollision ?? false;
	const droppingItem = (0, import_react.useMemo)(() => droppingItemProp ?? {
		i: "__dropping-elem__",
		...defaultDropItem
	}, [droppingItemProp, defaultDropItem]);
	const useCSSTransforms = positionStrategy.type === "transform";
	const transformScale = positionStrategy.scale;
	const effectiveContainerPadding = containerPadding ?? margin;
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [layout, setLayout] = (0, import_react.useState)(() => synchronizeLayoutWithChildren(propsLayout, children, cols, compactor));
	const [activeDrag, setActiveDrag] = (0, import_react.useState)(null);
	const [resizing, setResizing] = (0, import_react.useState)(false);
	const [droppingDOMNode, setDroppingDOMNode] = (0, import_react.useState)(null);
	const [droppingPosition, setDroppingPosition] = (0, import_react.useState)();
	const droppingPositionRef = (0, import_react.useRef)(void 0);
	droppingPositionRef.current = droppingPosition;
	const oldDragItemRef = (0, import_react.useRef)(null);
	const oldResizeItemRef = (0, import_react.useRef)(null);
	const oldLayoutRef = (0, import_react.useRef)(null);
	const dragEnterCounterRef = (0, import_react.useRef)(0);
	const prevLayoutRef = (0, import_react.useRef)(layout);
	const prevPropsLayoutRef = (0, import_react.useRef)(propsLayout);
	const prevChildrenRef = (0, import_react.useRef)(children);
	const prevCompactTypeRef = (0, import_react.useRef)(compactType);
	const gridContainerRef = (0, import_react.useRef)(null);
	const touchDragActiveRef = (0, import_react.useRef)(false);
	const activeTouchIdRef = (0, import_react.useRef)(null);
	const droppingDOMNodeRef = (0, import_react.useRef)(null);
	droppingDOMNodeRef.current = droppingDOMNode;
	const onDropPropRef = (0, import_react.useRef)(onDropProp);
	(0, import_react.useLayoutEffect)(() => {
		onDropPropRef.current = onDropProp;
	});
	const layoutRef = (0, import_react.useRef)(layout);
	layoutRef.current = layout;
	(0, import_react.useEffect)(() => {
		setMounted(true);
		if (!(0, import_fast_equals.deepEqual)(layout, propsLayout)) onLayoutChange(layout);
	}, []);
	(0, import_react.useEffect)(() => {
		if (activeDrag) return;
		if (droppingDOMNode) return;
		const layoutChanged = !(0, import_fast_equals.deepEqual)(propsLayout, prevPropsLayoutRef.current);
		const childrenChanged = !childrenEqual(children, prevChildrenRef.current);
		const compactTypeChanged = compactType !== prevCompactTypeRef.current;
		if (layoutChanged || childrenChanged || compactTypeChanged) {
			const newLayout = synchronizeLayoutWithChildren(layoutChanged ? propsLayout : layout, children, cols, compactor);
			if (!(0, import_fast_equals.deepEqual)(newLayout, layout)) setLayout(newLayout);
		}
		prevPropsLayoutRef.current = propsLayout;
		prevChildrenRef.current = children;
		prevCompactTypeRef.current = compactType;
	}, [
		propsLayout,
		children,
		cols,
		compactType,
		compactor,
		activeDrag,
		droppingDOMNode,
		layout
	]);
	(0, import_react.useEffect)(() => {
		if (!activeDrag && !droppingDOMNode && !(0, import_fast_equals.deepEqual)(layout, prevLayoutRef.current)) {
			prevLayoutRef.current = layout;
			const publicLayout = layout.filter((l) => l.i !== droppingItem.i);
			onLayoutChange(publicLayout);
		}
	}, [
		layout,
		activeDrag,
		droppingDOMNode,
		onLayoutChange,
		droppingItem.i
	]);
	const containerHeight = (0, import_react.useMemo)(() => {
		if (!autoSize) return void 0;
		const nbRow = bottom(layout);
		const containerPaddingY = effectiveContainerPadding[1];
		return nbRow * rowHeight + (nbRow - 1) * margin[1] + containerPaddingY * 2 + "px";
	}, [
		autoSize,
		layout,
		rowHeight,
		margin,
		effectiveContainerPadding
	]);
	const onDragStart = (0, import_react.useCallback)((i, _x, _y, data) => {
		const currentLayout = layoutRef.current;
		const l = getLayoutItem(currentLayout, i);
		if (!l) return;
		const placeholder = {
			w: l.w,
			h: l.h,
			x: l.x,
			y: l.y,
			i
		};
		oldDragItemRef.current = cloneLayoutItem(l);
		oldLayoutRef.current = currentLayout;
		setActiveDrag(placeholder);
		onDragStartProp(currentLayout, l, l, null, data.e, data.node);
	}, [onDragStartProp]);
	const onDrag = (0, import_react.useCallback)((i, x, y, data) => {
		const currentLayout = layoutRef.current;
		const oldDragItem = oldDragItemRef.current;
		const l = getLayoutItem(currentLayout, i);
		if (!l) return;
		const placeholder = {
			w: l.w,
			h: l.h,
			x: l.x,
			y: l.y,
			i
		};
		const newLayout = moveElement(currentLayout, l, x, y, true, preventCollision, compactType, cols, allowOverlap);
		onDragProp(newLayout, oldDragItem, l, placeholder, data.e, data.node);
		setLayout(compactor.compact(newLayout, cols));
		setActiveDrag(placeholder);
	}, [
		preventCollision,
		compactType,
		cols,
		allowOverlap,
		compactor,
		onDragProp
	]);
	const onDragStop = (0, import_react.useCallback)((i, x, y, data) => {
		if (!oldDragItemRef.current) return;
		const currentLayout = layoutRef.current;
		const oldDragItem = oldDragItemRef.current;
		const l = getLayoutItem(currentLayout, i);
		if (!l) return;
		const newLayout = moveElement(currentLayout, l, x, y, true, preventCollision, compactType, cols, allowOverlap);
		const finalLayout = compactor.compact(newLayout, cols);
		onDragStopProp(finalLayout, oldDragItem, l, null, data.e, data.node);
		const oldLayout = oldLayoutRef.current;
		oldDragItemRef.current = null;
		oldLayoutRef.current = null;
		setActiveDrag(null);
		setLayout(finalLayout);
		if (oldLayout && !(0, import_fast_equals.deepEqual)(oldLayout, finalLayout)) onLayoutChange(finalLayout);
	}, [
		preventCollision,
		compactType,
		cols,
		allowOverlap,
		compactor,
		onDragStopProp,
		onLayoutChange
	]);
	const onResizeStart = (0, import_react.useCallback)((i, _w, _h, data) => {
		const currentLayout = layoutRef.current;
		const l = getLayoutItem(currentLayout, i);
		if (!l) return;
		oldResizeItemRef.current = cloneLayoutItem(l);
		oldLayoutRef.current = currentLayout;
		setResizing(true);
		onResizeStartProp(currentLayout, l, l, null, data.e, data.node);
	}, [onResizeStartProp]);
	const onResize = (0, import_react.useCallback)((i, w, h, data) => {
		const currentLayout = layoutRef.current;
		const oldResizeItem = oldResizeItemRef.current;
		const { handle } = data;
		let shouldMoveItem = false;
		let newX;
		let newY;
		const [newLayout, l] = withLayoutItem(currentLayout, i, (item) => {
			newX = item.x;
			newY = item.y;
			if ([
				"sw",
				"w",
				"nw",
				"n",
				"ne"
			].includes(handle)) {
				if ([
					"sw",
					"nw",
					"w"
				].includes(handle)) {
					newX = item.x + (item.w - w);
					w = item.x !== newX && newX < 0 ? item.w : w;
					newX = newX < 0 ? 0 : newX;
				}
				if ([
					"ne",
					"n",
					"nw"
				].includes(handle)) {
					newY = item.y + (item.h - h);
					h = item.y !== newY && newY < 0 ? item.h : h;
					newY = newY < 0 ? 0 : newY;
				}
				shouldMoveItem = true;
			}
			if (preventCollision && !allowOverlap) {
				if (getAllCollisions(currentLayout, {
					...item,
					w,
					h,
					x: newX ?? item.x,
					y: newY ?? item.y
				}).filter((layoutItem) => layoutItem.i !== item.i).length > 0) {
					newY = item.y;
					h = item.h;
					newX = item.x;
					w = item.w;
					shouldMoveItem = false;
				}
			}
			item.w = w;
			item.h = h;
			if (handle === "n" || handle === "nw" || handle === "ne") item.y = newY ?? item.y;
			return item;
		});
		if (!l) return;
		let finalLayout = newLayout;
		if (shouldMoveItem && newX !== void 0 && newY !== void 0) finalLayout = moveElement(newLayout, l, newX, newY, true, preventCollision, compactType, cols, allowOverlap);
		const placeholder = {
			w: l.w,
			h: l.h,
			x: l.x,
			y: l.y,
			i,
			static: true
		};
		onResizeProp(finalLayout, oldResizeItem, l, placeholder, data.e, data.node);
		const compactedLayout = compactor.compact(finalLayout, cols);
		if (handle === "n" || handle === "nw" || handle === "ne") {
			const resized = compactedLayout.find((item) => item.i === i);
			if (resized) resized.y = l.y;
		}
		setLayout(compactedLayout);
		setActiveDrag(placeholder);
	}, [
		preventCollision,
		compactType,
		cols,
		allowOverlap,
		compactor,
		onResizeProp
	]);
	const onResizeStop = (0, import_react.useCallback)((i, _w, _h, data) => {
		const currentLayout = layoutRef.current;
		const oldResizeItem = oldResizeItemRef.current;
		const l = getLayoutItem(currentLayout, i);
		const finalLayout = compactor.compact(currentLayout, cols);
		onResizeStopProp(finalLayout, oldResizeItem, l ?? null, null, data.e, data.node);
		const oldLayout = oldLayoutRef.current;
		oldResizeItemRef.current = null;
		oldLayoutRef.current = null;
		setActiveDrag(null);
		setResizing(false);
		setLayout(finalLayout);
		if (oldLayout && !(0, import_fast_equals.deepEqual)(oldLayout, finalLayout)) onLayoutChange(finalLayout);
	}, [
		cols,
		compactor,
		onResizeStopProp,
		onLayoutChange
	]);
	const placeDroppingItem = (0, import_react.useCallback)((itemToPlace, newDroppingPosition, calculatedXY, hasPlaceholder) => {
		if (!hasPlaceholder) {
			setDroppingDOMNode(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {}, itemToPlace.i));
			setDroppingPosition(newDroppingPosition);
			const baseLayout = layoutRef.current.filter((l) => l.i !== itemToPlace.i);
			setLayout([...baseLayout, {
				...itemToPlace,
				x: calculatedXY.x,
				y: calculatedXY.y,
				static: false,
				isDraggable: true
			}]);
		} else if (droppingPositionRef.current) {
			if (droppingPositionRef.current.left !== newDroppingPosition.left || droppingPositionRef.current.top !== newDroppingPosition.top) {
				setDroppingPosition(newDroppingPosition);
				setLayout((currentLayout) => currentLayout.map((item) => item.i === itemToPlace.i && (item.x !== calculatedXY.x || item.y !== calculatedXY.y) ? {
					...item,
					x: calculatedXY.x,
					y: calculatedXY.y
				} : item));
			}
		}
	}, []);
	const applyTouchDropPosition = (0, import_react.useCallback)((clientX, clientY, nativeEvent) => {
		const gridEl = gridContainerRef.current;
		if (!gridEl) return;
		const { newDroppingPosition, calculatedXY } = computeDropPosition({
			clientX,
			clientY,
			gridElement: gridEl,
			droppingItem,
			event: nativeEvent,
			transformScale,
			cols,
			margin,
			maxRows,
			rowHeight,
			width,
			containerPadding: effectiveContainerPadding
		});
		placeDroppingItem(droppingItem, newDroppingPosition, calculatedXY, !!droppingDOMNodeRef.current);
	}, [
		droppingItem,
		transformScale,
		cols,
		margin,
		maxRows,
		rowHeight,
		width,
		effectiveContainerPadding,
		placeDroppingItem
	]);
	const removeDroppingPlaceholder = (0, import_react.useCallback)(() => {
		const currentLayout = layoutRef.current;
		if (!currentLayout.some((l) => l.i === droppingItem.i)) {
			setDroppingDOMNode(null);
			setActiveDrag(null);
			setDroppingPosition(void 0);
			return;
		}
		const newLayout = compactor.compact(currentLayout.filter((l) => l.i !== droppingItem.i), cols);
		setLayout(newLayout);
		setDroppingDOMNode(null);
		setActiveDrag(null);
		setDroppingPosition(void 0);
	}, [
		droppingItem.i,
		cols,
		compactor
	]);
	const handleDragOver = (0, import_react.useCallback)((e) => {
		e.preventDefault();
		e.stopPropagation();
		if (isFirefox && !e.nativeEvent.target?.classList.contains(layoutClassName)) return false;
		const rawResult = dropConfigOnDragOver ? dropConfigOnDragOver(e.nativeEvent) : onDropDragOverProp(e);
		if (rawResult === false) {
			if (droppingDOMNode) removeDroppingPlaceholder();
			return false;
		}
		const { dragOffsetX = 0, dragOffsetY = 0, ...onDragOverResult } = rawResult ?? {};
		const finalDroppingItem = {
			...droppingItem,
			...onDragOverResult
		};
		const { newDroppingPosition, calculatedXY } = computeDropPosition({
			clientX: e.clientX,
			clientY: e.clientY,
			gridElement: e.currentTarget,
			droppingItem: finalDroppingItem,
			event: e.nativeEvent,
			dragOffsetX,
			dragOffsetY,
			transformScale,
			cols,
			margin,
			maxRows,
			rowHeight,
			width,
			containerPadding: effectiveContainerPadding
		});
		placeDroppingItem(finalDroppingItem, newDroppingPosition, calculatedXY, !!droppingDOMNode);
	}, [
		droppingDOMNode,
		droppingItem,
		dropConfigOnDragOver,
		onDropDragOverProp,
		removeDroppingPlaceholder,
		placeDroppingItem,
		transformScale,
		cols,
		margin,
		maxRows,
		rowHeight,
		width,
		effectiveContainerPadding
	]);
	const handleDragLeave = (0, import_react.useCallback)((e) => {
		e.preventDefault();
		e.stopPropagation();
		dragEnterCounterRef.current--;
		if (dragEnterCounterRef.current < 0) dragEnterCounterRef.current = 0;
		if (dragEnterCounterRef.current === 0) removeDroppingPlaceholder();
	}, [removeDroppingPlaceholder]);
	const handleDragEnter = (0, import_react.useCallback)((e) => {
		e.preventDefault();
		e.stopPropagation();
		dragEnterCounterRef.current++;
	}, []);
	const commitDrop = (0, import_react.useCallback)((nativeEvent) => {
		const currentLayout = layoutRef.current;
		const item = currentLayout.find((l) => l.i === droppingItem.i);
		removeDroppingPlaceholder();
		onDropPropRef.current(currentLayout, item, nativeEvent);
	}, [droppingItem.i, removeDroppingPlaceholder]);
	const handleDrop = (0, import_react.useCallback)((e) => {
		e.preventDefault();
		e.stopPropagation();
		dragEnterCounterRef.current = 0;
		commitDrop(e.nativeEvent);
	}, [commitDrop]);
	(0, import_react.useEffect)(() => {
		if (!isDroppable || !touchEnabled) return;
		const gridEl = gridContainerRef.current;
		if (!gridEl) return;
		const isOverGrid = (clientX, clientY) => {
			const el = document.elementFromPoint(clientX, clientY);
			return el ? gridEl.contains(el) : false;
		};
		const isSourceElement = (target) => {
			if (!(target instanceof HTMLElement)) return false;
			return target.closest(touchDragSource) !== null;
		};
		const getTouch = (e) => {
			const touches = e.changedTouches;
			if (!touches || touches.length === 0) return void 0;
			const id = activeTouchIdRef.current;
			if (id === null) return touches[0];
			for (let i = 0; i < touches.length; i++) {
				const touch = touches[i];
				if (touch && touch.identifier === id) return touch;
			}
		};
		const handleTouchStart = (e) => {
			if (!isSourceElement(e.target)) return;
			if (activeTouchIdRef.current !== null) return;
			e.preventDefault();
			const touch = e.changedTouches?.[0];
			if (!touch) return;
			activeTouchIdRef.current = touch.identifier;
			touchDragActiveRef.current = true;
		};
		const handleTouchMove = (e) => {
			if (!touchDragActiveRef.current) return;
			e.preventDefault();
			const touch = getTouch(e);
			if (!touch) return;
			if (!isOverGrid(touch.clientX, touch.clientY)) {
				if (droppingDOMNodeRef.current) removeDroppingPlaceholder();
				return;
			}
			applyTouchDropPosition(touch.clientX, touch.clientY, e);
		};
		const handleTouchEnd = (e) => {
			if (!touchDragActiveRef.current) return;
			e.preventDefault();
			const touch = getTouch(e);
			touchDragActiveRef.current = false;
			activeTouchIdRef.current = null;
			if (!touch) return;
			if (!isOverGrid(touch.clientX, touch.clientY)) {
				removeDroppingPlaceholder();
				return;
			}
			commitDrop(e);
		};
		const handleTouchCancel = () => {
			if (!touchDragActiveRef.current) return;
			touchDragActiveRef.current = false;
			activeTouchIdRef.current = null;
			removeDroppingPlaceholder();
		};
		const opts = { passive: false };
		document.addEventListener("touchstart", handleTouchStart, opts);
		document.addEventListener("touchmove", handleTouchMove, opts);
		document.addEventListener("touchend", handleTouchEnd, opts);
		document.addEventListener("touchcancel", handleTouchCancel, opts);
		return () => {
			document.removeEventListener("touchstart", handleTouchStart, opts);
			document.removeEventListener("touchmove", handleTouchMove, opts);
			document.removeEventListener("touchend", handleTouchEnd, opts);
			document.removeEventListener("touchcancel", handleTouchCancel, opts);
		};
	}, [
		isDroppable,
		touchEnabled,
		touchDragSource,
		applyTouchDropPosition,
		removeDroppingPlaceholder,
		commitDrop,
		droppingItem.i
	]);
	const processGridItem = (0, import_react.useCallback)((child, isDroppingItem) => {
		if (!child || !child.key) return null;
		const l = getLayoutItem(layout, String(child.key));
		if (!l) return null;
		const draggable = typeof l.isDraggable === "boolean" ? l.isDraggable : !l.static && isDraggable;
		const resizable = typeof l.isResizable === "boolean" ? l.isResizable : !l.static && isResizable;
		const resizeHandlesOptions = l.resizeHandles || [...resizeHandles];
		const bounded = draggable && isBounded && l.isBounded !== false;
		const resizeHandleElement = resizeHandle;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GridItem, {
			containerWidth: width,
			cols,
			margin,
			containerPadding: effectiveContainerPadding,
			maxRows,
			rowHeight,
			cancel: draggableCancel,
			handle: draggableHandle,
			onDragStart,
			onDrag,
			onDragStop,
			onResizeStart,
			onResize,
			onResizeStop,
			isDraggable: draggable,
			isResizable: resizable,
			isBounded: bounded,
			allowMobileScroll: dragAllowMobileScroll,
			useCSSTransforms: useCSSTransforms && mounted,
			usePercentages: !mounted,
			transformScale,
			positionStrategy,
			dragThreshold,
			w: l.w,
			h: l.h,
			x: l.x,
			y: l.y,
			i: l.i,
			minH: l.minH,
			minW: l.minW,
			maxH: l.maxH,
			maxW: l.maxW,
			static: l.static,
			droppingPosition: isDroppingItem ? droppingPosition : void 0,
			resizeHandles: resizeHandlesOptions,
			resizeHandle: resizeHandleElement,
			constraints,
			layoutItem: l,
			layout,
			children: child
		}, l.i);
	}, [
		layout,
		width,
		cols,
		margin,
		effectiveContainerPadding,
		maxRows,
		rowHeight,
		draggableCancel,
		draggableHandle,
		onDragStart,
		onDrag,
		onDragStop,
		onResizeStart,
		onResize,
		onResizeStop,
		isDraggable,
		isResizable,
		isBounded,
		useCSSTransforms,
		mounted,
		transformScale,
		positionStrategy,
		dragThreshold,
		droppingPosition,
		resizeHandles,
		resizeHandle,
		constraints
	]);
	const renderPlaceholder = () => {
		if (!activeDrag) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GridItem, {
			w: activeDrag.w,
			h: activeDrag.h,
			x: activeDrag.x,
			y: activeDrag.y,
			i: activeDrag.i,
			className: `react-grid-placeholder ${resizing ? "placeholder-resizing" : ""}`,
			containerWidth: width,
			cols,
			margin,
			containerPadding: effectiveContainerPadding,
			maxRows,
			rowHeight,
			isDraggable: false,
			isResizable: false,
			isBounded: false,
			useCSSTransforms,
			transformScale,
			constraints,
			layout,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {})
		});
	};
	const setGridRef = (0, import_react.useCallback)((node) => {
		gridContainerRef.current = node;
		if (typeof innerRef === "function") innerRef(node);
		else if (innerRef && "current" in innerRef) innerRef.current = node;
	}, [innerRef]);
	const mergedClassName = clsx(layoutClassName, className);
	const mergedStyle = {
		height: containerHeight,
		...style
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: setGridRef,
		className: mergedClassName,
		style: mergedStyle,
		onDrop: isDroppable ? handleDrop : void 0,
		onDragLeave: isDroppable ? handleDragLeave : void 0,
		onDragEnter: isDroppable ? handleDragEnter : void 0,
		onDragOver: isDroppable ? handleDragOver : void 0,
		children: [
			import_react.Children.map(children, (child) => {
				if (!import_react.isValidElement(child)) return null;
				return processGridItem(child);
			}),
			isDroppable && droppingDOMNode && processGridItem(droppingDOMNode, true),
			renderPlaceholder()
		]
	});
}
var DEFAULT_BREAKPOINTS = {
	lg: 1200,
	md: 996,
	sm: 768,
	xs: 480,
	xxs: 0
};
var DEFAULT_COLS = {
	lg: 12,
	md: 10,
	sm: 6,
	xs: 4,
	xxs: 2
};
var noop2 = () => {};
function synchronizeLayoutWithChildren2(initialLayout, children, cols, compactor, reSeedFromDataGrid = false) {
	const layout = [];
	import_react.Children.forEach(children, (child) => {
		if (!import_react.isValidElement(child) || child.key === null) return;
		const key = String(child.key);
		const dataGrid = child.props["data-grid"];
		const existingItem = initialLayout.find((l) => l.i === key);
		if (existingItem) {
			if (reSeedFromDataGrid && dataGrid) layout.push({
				...existingItem,
				i: key,
				w: dataGrid.w ?? existingItem.w,
				h: dataGrid.h ?? existingItem.h,
				minW: dataGrid.minW ?? existingItem.minW,
				maxW: dataGrid.maxW ?? existingItem.maxW,
				minH: dataGrid.minH ?? existingItem.minH,
				maxH: dataGrid.maxH ?? existingItem.maxH
			});
			else layout.push({
				...existingItem,
				i: key
			});
		} else if (dataGrid) layout.push({
			i: key,
			x: dataGrid.x ?? 0,
			y: dataGrid.y ?? 0,
			w: dataGrid.w ?? 1,
			h: dataGrid.h ?? 1,
			minW: dataGrid.minW,
			maxW: dataGrid.maxW,
			minH: dataGrid.minH,
			maxH: dataGrid.maxH,
			static: dataGrid.static,
			isDraggable: dataGrid.isDraggable,
			isResizable: dataGrid.isResizable,
			resizeHandles: dataGrid.resizeHandles,
			isBounded: dataGrid.isBounded
		});
		else layout.push({
			i: key,
			x: 0,
			y: bottom(layout),
			w: 1,
			h: 1
		});
	});
	const corrected = correctBounds(layout, { cols });
	return compactor.compact(corrected, cols);
}
function ResponsiveGridLayoutInner(props) {
	const { children, width, breakpoint: propBreakpoint, breakpoints = DEFAULT_BREAKPOINTS, cols: colsConfig = DEFAULT_COLS, layouts: propsLayouts = {}, rowHeight = 150, maxRows = Infinity, margin: propMargin = [10, 10], containerPadding: propContainerPadding = null, compactor: compactorProp, onBreakpointChange = noop2, onLayoutChange = noop2, onWidthChange = noop2, ...restProps } = props;
	const compactor = compactorProp ?? getCompactor("vertical");
	const compactType = compactor.type;
	const allowOverlap = compactor.allowOverlap;
	const initialBreakpoint = (0, import_react.useMemo)(() => {
		return propBreakpoint ?? getBreakpointFromWidth(breakpoints, width);
	}, []);
	const initialCols = (0, import_react.useMemo)(() => {
		return getColsFromBreakpoint(initialBreakpoint, colsConfig);
	}, [initialBreakpoint, colsConfig]);
	const initialLayout = (0, import_react.useMemo)(() => {
		return findOrGenerateResponsiveLayout(propsLayouts, breakpoints, initialBreakpoint, initialBreakpoint, initialCols, compactType);
	}, []);
	const [breakpoint, setBreakpoint] = (0, import_react.useState)(initialBreakpoint);
	const [cols, setCols] = (0, import_react.useState)(initialCols);
	const [layout, setLayout] = (0, import_react.useState)(initialLayout);
	const [layouts, setLayouts] = (0, import_react.useState)(propsLayouts);
	const prevWidthRef = (0, import_react.useRef)(width);
	const prevBreakpointRef = (0, import_react.useRef)(propBreakpoint);
	const prevBreakpointsRef = (0, import_react.useRef)(breakpoints);
	const prevColsRef = (0, import_react.useRef)(colsConfig);
	const prevLayoutsRef = (0, import_react.useRef)(propsLayouts);
	const prevCompactTypeRef = (0, import_react.useRef)(compactType);
	const layoutsRef = (0, import_react.useRef)(layouts);
	(0, import_react.useEffect)(() => {
		layoutsRef.current = layouts;
	}, [layouts]);
	const derivedLayout = (0, import_react.useMemo)(() => {
		if (!(0, import_fast_equals.deepEqual)(propsLayouts, prevLayoutsRef.current)) return findOrGenerateResponsiveLayout(propsLayouts, breakpoints, breakpoint, breakpoint, cols, compactor);
		return null;
	}, [
		propsLayouts,
		breakpoints,
		breakpoint,
		cols,
		compactor
	]);
	const effectiveLayout = derivedLayout ?? layout;
	(0, import_react.useEffect)(() => {
		if (derivedLayout !== null) {
			setLayout(derivedLayout);
			setLayouts(propsLayouts);
			layoutsRef.current = propsLayouts;
			prevLayoutsRef.current = propsLayouts;
		}
	}, [derivedLayout, propsLayouts]);
	(0, import_react.useEffect)(() => {
		if (compactType !== prevCompactTypeRef.current) {
			const newLayout = compactor.compact(cloneLayout(effectiveLayout), cols);
			const newLayouts = {
				...layoutsRef.current,
				[breakpoint]: newLayout
			};
			setLayout(newLayout);
			setLayouts(newLayouts);
			layoutsRef.current = newLayouts;
			onLayoutChange(newLayout, newLayouts);
			prevCompactTypeRef.current = compactType;
		}
	}, [
		compactType,
		compactor,
		effectiveLayout,
		cols,
		allowOverlap,
		breakpoint,
		onLayoutChange
	]);
	(0, import_react.useEffect)(() => {
		const widthChanged = width !== prevWidthRef.current;
		const breakpointPropChanged = propBreakpoint !== prevBreakpointRef.current;
		const breakpointsChanged = !(0, import_fast_equals.deepEqual)(breakpoints, prevBreakpointsRef.current);
		const colsChanged = !(0, import_fast_equals.deepEqual)(colsConfig, prevColsRef.current);
		if (widthChanged || breakpointPropChanged || breakpointsChanged || colsChanged) {
			const newBreakpoint = propBreakpoint ?? getBreakpointFromWidth(breakpoints, width);
			const newCols = getColsFromBreakpoint(newBreakpoint, colsConfig);
			const lastBreakpoint = breakpoint;
			if (lastBreakpoint !== newBreakpoint || breakpointsChanged || colsChanged) {
				const newLayouts = { ...layoutsRef.current };
				if (!newLayouts[lastBreakpoint]) newLayouts[lastBreakpoint] = cloneLayout(layout);
				let newLayout = findOrGenerateResponsiveLayout(newLayouts, breakpoints, newBreakpoint, lastBreakpoint, newCols, compactor);
				const layoutWasGenerated = !newLayouts[newBreakpoint];
				newLayout = synchronizeLayoutWithChildren2(newLayout, children, newCols, compactor, layoutWasGenerated);
				newLayouts[newBreakpoint] = newLayout;
				setBreakpoint(newBreakpoint);
				setCols(newCols);
				setLayout(newLayout);
				setLayouts(newLayouts);
				layoutsRef.current = newLayouts;
				onBreakpointChange(newBreakpoint, newCols);
				onLayoutChange(newLayout, newLayouts);
			}
			const currentMargin2 = getIndentationValue(propMargin, newBreakpoint);
			const currentPadding = propContainerPadding ? getIndentationValue(propContainerPadding, newBreakpoint) : null;
			onWidthChange(width, currentMargin2, newCols, currentPadding);
			prevWidthRef.current = width;
			prevBreakpointRef.current = propBreakpoint;
			prevBreakpointsRef.current = breakpoints;
			prevColsRef.current = colsConfig;
		}
	}, [
		width,
		propBreakpoint,
		breakpoints,
		colsConfig,
		breakpoint,
		cols,
		layout,
		children,
		compactor,
		compactType,
		allowOverlap,
		propMargin,
		propContainerPadding,
		onBreakpointChange,
		onLayoutChange,
		onWidthChange
	]);
	const handleLayoutChange = (0, import_react.useCallback)((newLayout) => {
		const newLayouts = {
			...layoutsRef.current,
			[breakpoint]: newLayout
		};
		setLayout(newLayout);
		setLayouts(newLayouts);
		layoutsRef.current = newLayouts;
		onLayoutChange(newLayout, newLayouts);
	}, [breakpoint, onLayoutChange]);
	const currentMargin = (0, import_react.useMemo)(() => {
		return getIndentationValue(propMargin, breakpoint);
	}, [propMargin, breakpoint]);
	const currentContainerPadding = (0, import_react.useMemo)(() => {
		if (propContainerPadding === null) return null;
		return getIndentationValue(propContainerPadding, breakpoint);
	}, [propContainerPadding, breakpoint]);
	const gridConfig = (0, import_react.useMemo)(() => ({
		cols,
		rowHeight,
		maxRows,
		margin: currentMargin,
		containerPadding: currentContainerPadding
	}), [
		cols,
		rowHeight,
		maxRows,
		currentMargin,
		currentContainerPadding
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GridLayout, {
		...restProps,
		width,
		gridConfig,
		compactor,
		onLayoutChange: handleLayoutChange,
		layout: effectiveLayout,
		children
	});
}
var ResponsiveGridLayoutWithRef = import_react.forwardRef(function ResponsiveGridLayoutForwardRef(props, ref) {
	const { innerRef, ...rest } = props;
	const effectiveInnerRef = innerRef ?? ref;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveGridLayoutInner, {
		...rest,
		innerRef: effectiveInnerRef
	});
});
ResponsiveGridLayoutWithRef.displayName = "ResponsiveGridLayout";
//#endregion
