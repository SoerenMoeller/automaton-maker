import { SIZE, CONSTANTS, COLOR, DISTANCE, THRESHOLDS } from './movable.js';
import { parseText } from './converter.js';

// Methods for building svg/dom elements 

export function createMarker(parent, id, width, height, refX, refY, color, polygonPoints) {
    const marker = createSVGElement(CONSTANTS.marker, {
        id: id,
        markerWidth: width,
        markerHeight: height,
        refX: refX,
        refY: refY,
        fill: color,
        orient: "auto"
    });

    const polygon = createSVGElement(CONSTANTS.polygon, {
        points: polygonPoints
    });

    marker.appendChild(polygon);
    parent.appendChild(marker);
}

export function createPath(parent, id, dValue, stroke_width, marker, color, draggable=false) {
    const path = createSVGElement(CONSTANTS.path, {
        d: dValue,
        stroke: color,
        stroke_width: stroke_width,
        fill: CONSTANTS.none
    });

    if (marker !== "") {
        path.setAttributeNS(null, CONSTANTS.markerEnd, `url(#${marker})`);
    }

    if (id !== "") {
        path.setAttributeNS(null, CONSTANTS.id, id);
    }

    if (draggable) {
        path.setAttributeNS(null, CONSTANTS.class, CONSTANTS.draggable);
    }

    parent.appendChild(path);
    return path;
}

export function createCircle(parent, coords, radius) {
    const circle = createSVGElement(CONSTANTS.circle, {
        class: CONSTANTS.draggable,
        cx: coords.x,
        cy: coords.y,
        r: radius,
        stroke: COLOR.black,
        stroke_width: 0.1,
        fill: CONSTANTS.white
    });

    parent.appendChild(circle);
    return circle;
}

export function createContainer(parent, id) {
    const container = createSVGElement(CONSTANTS.g, {
        id: id
    });

    parent.appendChild(container);
    return container;
}

export function createDefs(parent) {
    const defs = createSVGElement(CONSTANTS.defs);

    parent.appendChild(defs);

    return defs;
}

export function createStyle(parent, styling) {
    const style = createSVGElement(CONSTANTS.style)

    style.textContent = styling;
    parent.appendChild(style);
    
    return style;
}

export function createTextNode(parent, position, text, draggable) {
    const parsedText = parseText(text);

    let configuration = {
        x: position.x,
        y: position.y,
        text_anchor: "middle",
        alignment_baseline: "central"
    };
    if (draggable) {
        configuration.class = CONSTANTS.draggable;
    }

    const textNode = createSVGElement(CONSTANTS.text, configuration);
    textNode.innerHTML = parsedText.text;

    if (parsedText.sub != "") {
        const subTextNode = createSVGElement(CONSTANTS.tspan, {
            baseline_shift: CONSTANTS.sub,
            dy: "0.5"
        });
        subTextNode.innerHTML = parsedText.sub;
        textNode.appendChild(subTextNode);
    }

    if (parsedText.super != "") {
        // shift back the super text on top of the sub text
        const backShift = -parsedText.sub.length * (SIZE.subText / 2);
        const superTextNode = createSVGElement(CONSTANTS.tspan, {
            baseline_shift: CONSTANTS.super,
            dx: backShift,
            dy: "0"
        });
        superTextNode.innerHTML = parsedText.super;
        textNode.appendChild(superTextNode);
    }

    parent.appendChild(textNode);
    return textNode;
}

function createSVGElement(n, v = {}) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace("_", "-"), v[p]);
    }
    return n
}