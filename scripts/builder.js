import { SIZE, CONSTANTS, COLOR, DISTANCE } from '../main.js';
import { parseText } from './converter.js';

"use strict";

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

export function createPath(parent, id, dValue, stroke_width, marker, color, draggable = false) {
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
        alignment_baseline: "central",
        dominant_baseline: "middle"
    };
    if (draggable) {
        configuration.class = CONSTANTS.draggable;
    }

    // check starting position of the text 
    const lines = parsedText.length;
    const distance = SIZE.text + SIZE.subText - 1;
    let offset = position.y - Math.floor(lines / 2) * distance;
    if (lines % 2 === 0) {
        offset += distance / 2;
    }

    const textNode = createSVGElement(CONSTANTS.text, configuration);
    for (let parsedLine of parsedText) {
        
        const textLine = createSVGElement(CONSTANTS.tspan, {
            x: position.x,
            y: offset
        });
        offset += distance;
        textLine.textContent = parsedLine.text;

        if (parsedLine.sub != "") {
            const subTextNode = createSVGElement(CONSTANTS.tspan, {
                baseline_shift: CONSTANTS.sub,
                dy: 0.1
            });
            subTextNode.textContent = parsedLine.sub;
            textLine.appendChild(subTextNode);
        }

        if (parsedLine.super != "") {
            // shift back the super text on top of the sub text
            let shift = -parsedLine.sub.length;
            if (shift % 2 === 0) {
                shift += 0.5;
            } else {
                shift -= 0.25;
            }
            const backShift = shift * (SIZE.subText / 2);
            const superTextNode = createSVGElement(CONSTANTS.tspan, {
                baseline_shift: CONSTANTS.super,
                dx: backShift,
                dy: 0.3
            });
            superTextNode.textContent = parsedLine.super;
            textLine.appendChild(superTextNode);
        }

        textNode.appendChild(textLine);
    }

    parent.appendChild(textNode);
    return textNode;
}

export function createRemoveButton(parent, text) {
    const button = createDOMElement(parent, "button", { id: "remove-button" });
    button.textContent = text;

    return button;
}

export function createDescriptionContainer(parent) {
    const container = createContainerWithText(parent, "Description", "full-width");

    createInputForm(container, CONSTANTS.text, "description-text-input");

    return container;
}

export function createCheckBoxContainer(parent, text) {
    const upperCaseText = text[0].toUpperCase() + text.substring(1)
    const container = createContainerWithText(parent, upperCaseText);

    createInputForm(container, "checkbox", text + "CheckBox");

    return container;
}

function createContainerWithText(parent, text, ...additionalClasses) {
    const container = createDOMElement(parent, "div", { class: `flex-container ${additionalClasses.join(" ")}` });

    const textElement = createDOMElement(container, "p");
    textElement.innerText = text;

    return container;
}

function createInputForm(parent, type, id) {
    const settings = {
        type: type,
        id: id,
        name: id
    };

    if (type === CONSTANTS.text) {
        settings.autocomplete = "off";
    }

    return createDOMElement(parent, "input", settings);
}

function createSVGElement(n, v = {}) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace("_", "-"), v[p]);
    }
    return n
}

function createDOMElement(parent, name, attributes = {}) {
    const element = document.createElement(name);

    for (let attr in attributes) {
        element.setAttribute(attr, attributes[attr]);
    }

    parent.appendChild(element);
    return element
}