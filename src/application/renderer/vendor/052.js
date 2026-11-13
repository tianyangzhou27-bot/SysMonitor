//#region node_modules/react-grid-layout/dist/chunk-ZYNFVPDS.mjs
function calcGridColWidth(positionParams) {
	const { margin, containerPadding, containerWidth, cols } = positionParams;
	return (containerWidth - margin[0] * (cols - 1) - containerPadding[0] * 2) / cols;
}
function calcGridItemWHPx(gridUnits, colOrRowSize, marginPx) {
	if (!Number.isFinite(gridUnits)) return gridUnits;
	return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
}
function calcGridItemPosition(positionParams, x, y, w, h, dragPosition, resizePosition) {
	const { margin, containerPadding, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);
	let width;
	let height;
	let top;
	let left;
	if (resizePosition) {
		width = Math.round(resizePosition.width);
		height = Math.round(resizePosition.height);
	} else {
		width = calcGridItemWHPx(w, colWidth, margin[0]);
		height = calcGridItemWHPx(h, rowHeight, margin[1]);
	}
	if (dragPosition) {
		top = Math.round(dragPosition.top);
		left = Math.round(dragPosition.left);
	} else if (resizePosition) {
		top = Math.round(resizePosition.top);
		left = Math.round(resizePosition.left);
	} else {
		top = Math.round((rowHeight + margin[1]) * y + containerPadding[1]);
		left = Math.round((colWidth + margin[0]) * x + containerPadding[0]);
	}
	if (!dragPosition && !resizePosition) {
		if (Number.isFinite(w)) {
			const actualMarginRight = Math.round((colWidth + margin[0]) * (x + w) + containerPadding[0]) - left - width;
			if (actualMarginRight !== margin[0]) width += actualMarginRight - margin[0];
		}
		if (Number.isFinite(h)) {
			const actualMarginBottom = Math.round((rowHeight + margin[1]) * (y + h) + containerPadding[1]) - top - height;
			if (actualMarginBottom !== margin[1]) height += actualMarginBottom - margin[1];
		}
	}
	return {
		top,
		left,
		width,
		height
	};
}
function calcXY(positionParams, top, left, w, h) {
	const { margin, containerPadding, cols, rowHeight, maxRows } = positionParams;
	const colWidth = calcGridColWidth(positionParams);
	let x = Math.round((left - containerPadding[0]) / (colWidth + margin[0]));
	let y = Math.round((top - containerPadding[1]) / (rowHeight + margin[1]));
	x = clamp$2(x, 0, cols - w);
	y = clamp$2(y, 0, maxRows - h);
	return {
		x,
		y
	};
}
function calcXYRaw(positionParams, top, left) {
	const { margin, containerPadding, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);
	return {
		x: Math.round((left - containerPadding[0]) / (colWidth + margin[0])),
		y: Math.round((top - containerPadding[1]) / (rowHeight + margin[1]))
	};
}
function calcWHRaw(positionParams, width, height) {
	const { margin, rowHeight } = positionParams;
	const colWidth = calcGridColWidth(positionParams);
	return {
		w: Math.max(1, Math.round((width + margin[0]) / (colWidth + margin[0]))),
		h: Math.max(1, Math.round((height + margin[1]) / (rowHeight + margin[1])))
	};
}
function clamp$2(num, lowerBound, upperBound) {
	return Math.max(Math.min(num, upperBound), lowerBound);
}
function collides(l1, l2) {
	if (l1.i === l2.i) return false;
	if (l1.x + l1.w <= l2.x) return false;
	if (l1.x >= l2.x + l2.w) return false;
	if (l1.y + l1.h <= l2.y) return false;
	if (l1.y >= l2.y + l2.h) return false;
	return true;
}
function getFirstCollision(layout, layoutItem) {
	for (let i = 0; i < layout.length; i++) {
		const item = layout[i];
		if (item !== void 0 && collides(item, layoutItem)) return item;
	}
}
function getAllCollisions(layout, layoutItem) {
	return layout.filter((l) => collides(l, layoutItem));
}
function sortLayoutItems(layout, compactType) {
	if (compactType === "horizontal") return sortLayoutItemsByColRow(layout);
	if (compactType === "vertical") return sortLayoutItemsByRowCol(layout);
	if (compactType === "wrap") return sortLayoutItemsByRowCol(layout);
	return [...layout];
}
function sortLayoutItemsByRowCol(layout) {
	return [...layout].sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		return a.x - b.x;
	});
}
function sortLayoutItemsByColRow(layout) {
	return [...layout].sort((a, b) => {
		if (a.x !== b.x) return a.x - b.x;
		return a.y - b.y;
	});
}
function bottom(layout) {
	let max = 0;
	for (let i = 0; i < layout.length; i++) {
		const item = layout[i];
		if (item !== void 0) {
			const bottomY = item.y + item.h;
			if (bottomY > max) max = bottomY;
		}
	}
	return max;
}
function getLayoutItem(layout, id) {
	for (let i = 0; i < layout.length; i++) {
		const item = layout[i];
		if (item !== void 0 && item.i === id) return item;
	}
}
function getStatics(layout) {
	return layout.filter((l) => l.static === true);
}
function cloneLayoutItem(layoutItem) {
	return {
		i: layoutItem.i,
		x: layoutItem.x,
		y: layoutItem.y,
		w: layoutItem.w,
		h: layoutItem.h,
		minW: layoutItem.minW,
		maxW: layoutItem.maxW,
		minH: layoutItem.minH,
		maxH: layoutItem.maxH,
		moved: Boolean(layoutItem.moved),
		static: Boolean(layoutItem.static),
		isDraggable: layoutItem.isDraggable,
		isResizable: layoutItem.isResizable,
		resizeHandles: layoutItem.resizeHandles,
		constraints: layoutItem.constraints,
		isBounded: layoutItem.isBounded
	};
}
function cloneLayout(layout) {
	const newLayout = new Array(layout.length);
	for (let i = 0; i < layout.length; i++) {
		const item = layout[i];
		if (item !== void 0) newLayout[i] = cloneLayoutItem(item);
	}
	return newLayout;
}
function modifyLayout(layout, layoutItem) {
	const newLayout = new Array(layout.length);
	for (let i = 0; i < layout.length; i++) {
		const item = layout[i];
		if (item !== void 0) {
			if (layoutItem.i === item.i) newLayout[i] = layoutItem;
			else newLayout[i] = item;
		}
	}
	return newLayout;
}
function withLayoutItem(layout, itemKey, cb) {
	let item = getLayoutItem(layout, itemKey);
	if (!item) return [[...layout], null];
	item = cb(cloneLayoutItem(item));
	return [modifyLayout(layout, item), item];
}
function correctBounds(layout, bounds) {
	const collidesWith = getStatics(layout);
	for (let i = 0; i < layout.length; i++) {
		const l = layout[i];
		if (l === void 0) continue;
		if (l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
		if (l.x < 0) {
			l.x = 0;
			l.w = bounds.cols;
		}
		if (l.y === Infinity) l.y = bottom(collidesWith);
		if (!l.static) collidesWith.push(l);
		else while (getFirstCollision(collidesWith, l)) l.y++;
	}
	return layout;
}
function moveElement(layout, l, x, y, isUserAction, preventCollision, compactType, cols, allowOverlap) {
	if (l.static && l.isDraggable !== true) return [...layout];
	if (l.y === y && l.x === x) return [...layout];
	const oldX = l.x;
	const oldY = l.y;
	if (typeof x === "number") l.x = x;
	if (typeof y === "number") l.y = y;
	l.moved = true;
	let sorted = sortLayoutItems(layout, compactType);
	if (compactType === "vertical" && typeof y === "number" ? oldY >= y : compactType === "horizontal" && typeof x === "number" ? oldX >= x : false) sorted = sorted.reverse();
	const collisions = getAllCollisions(sorted, l);
	const hasCollisions = collisions.length > 0;
	if (hasCollisions && allowOverlap) return cloneLayout(layout);
	if (hasCollisions && preventCollision) {
		l.x = oldX;
		l.y = oldY;
		l.moved = false;
		return layout;
	}
	let resultLayout = [...layout];
	for (let i = 0; i < collisions.length; i++) {
		const collision = collisions[i];
		if (collision === void 0) continue;
		if (collision.moved) continue;
		if (collision.static) resultLayout = moveElementAwayFromCollision(resultLayout, collision, l, isUserAction, compactType);
		else resultLayout = moveElementAwayFromCollision(resultLayout, l, collision, isUserAction, compactType);
	}
	return resultLayout;
}
function moveElementAwayFromCollision(layout, collidesWith, itemToMove, isUserAction, compactType, cols) {
	const compactH = compactType === "horizontal" || compactType === "wrap";
	const compactV = compactType === "vertical";
	const preventCollision = collidesWith.static;
	if (isUserAction) {
		isUserAction = false;
		const fakeItem = {
			x: compactH ? Math.max(collidesWith.x - itemToMove.w, 0) : itemToMove.x,
			y: compactV ? Math.max(collidesWith.y - itemToMove.h, 0) : itemToMove.y,
			w: itemToMove.w,
			h: itemToMove.h,
			i: "-1"
		};
		const firstCollision = getFirstCollision(layout, fakeItem);
		const collisionNorth = firstCollision !== void 0 && firstCollision.y + firstCollision.h > collidesWith.y;
		const collisionWest = firstCollision !== void 0 && collidesWith.x + collidesWith.w > firstCollision.x;
		if (!firstCollision) return moveElement(layout, itemToMove, compactH ? fakeItem.x : void 0, compactV ? fakeItem.y : void 0, isUserAction, preventCollision, compactType);
		if (collisionNorth && compactV) return moveElement(layout, itemToMove, void 0, itemToMove.y + 1, isUserAction, preventCollision, compactType);
		if (collisionNorth && compactType === null) {
			const newCollidesY = itemToMove.y;
			collidesWith.y = newCollidesY;
			itemToMove.y = newCollidesY + collidesWith.h;
			return [...layout];
		}
		if (collisionWest && compactH) return moveElement(layout, collidesWith, itemToMove.x, void 0, isUserAction, preventCollision, compactType);
	}
	const newX = compactH ? itemToMove.x + 1 : void 0;
	const newY = compactV ? itemToMove.y + 1 : void 0;
	if (newX === void 0 && newY === void 0) return [...layout];
	return moveElement(layout, itemToMove, newX, newY, isUserAction, preventCollision, compactType);
}
//#endregion
