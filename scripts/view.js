import * as builder from './builder.js';
import * as vector from './vectors.js';
import * as model from './model.js';
import { parseText } from './converter.js';
import { SIZE, CONSTANTS, COLOR, DISTANCE, ACTION } from '../main.js';

"use strict";

let svg;

export function init() {
    svg = document.getElementsByTagName("svg")[0];

    build();
    return svg;
}

export function build() {
    const graph = model.getGraph();
    reset();

    // render the lines first
    for (let node in graph) {
        buildEdges(parseInt(node));
    }

    // now render the nodes
    for (let node in graph) {
        buildNode(parseInt(node));
    }

    reselect();
}

function buildNode(id) {
    const container = builder.createContainer(svg, `${CONSTANTS.node}_${id}`);
    const node = model.getNode(id);

    // create starting arrow
    if (model.isNodeStart(id)) {
        const startAngle = vector.getVectorFromAngle(node.startAngle);
        const length = SIZE.nodeRadius + DISTANCE.startEdge;
        const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

        // make a thick invis line, to be able to click it nicely
        const startContainer = builder.createContainer(container, `${CONSTANTS.start}_${id}`);
        builder.createPath(startContainer, "", dValue, 1, "", COLOR.transparent, true);
        builder.createPath(startContainer, "", dValue, 0.1, CONSTANTS.arrow, COLOR.black, true);
    }

    // create the circle
    builder.createCircle(container, node.coords, SIZE.nodeRadius);

    if (model.isNodeEnd(id)) {
        builder.createCircle(container, node.coords, SIZE.nodeRadius - 0.3);
    }

    // create the text
    builder.createTextNode(container, node.coords, node.desc, true);
}

export function reset() {
    svg.innerHTML = "";

    // make the arrowheads
    const defs = builder.createDefs(svg);
    const selfPolygon = "0 13, 11 0, 10 16";
    const polygon = "0 0, 16 5, 0 10";
    builder.createMarker(defs, CONSTANTS.arrow, 16, 10, 16 + 10 * SIZE.nodeRadius - 1, 5, COLOR.black, polygon);
    builder.createMarker(defs, CONSTANTS.arrowSelected, 16, 10, 16 + 10 * SIZE.nodeRadius - 1, 5, COLOR.marked, polygon);
    builder.createMarker(defs, CONSTANTS.selfarrow, 16, 16, 23, -7.5, COLOR.black, selfPolygon);
    builder.createMarker(defs, CONSTANTS.selfarrowSelected, 16, 16, 23, -7.5, COLOR.marked, selfPolygon);
    builder.createMarker(defs, CONSTANTS.defaultMarker, 16, 10, 16, 5, COLOR.marked, polygon);

    // style
    const style = `text, text > tspan {font: italic ${SIZE.text}px sans-serif; user-select: none;} text > tspan > tspan {font: italic ${SIZE.subText}px sans-serif; user-select: none;}`;
    builder.createStyle(svg, style);

    // add default path for later usage
    builder.createPath(svg, CONSTANTS.defaultPath, "", 0.1, CONSTANTS.defaultMarker, COLOR.marked);

    // make a grid for visible layout
    initGrid()
}

function initGrid() {
    const container = builder.createContainer(svg, "grid-container");
    const color = ACTION.showGrid ? COLOR.grid : COLOR.transparent;

    for (let i = 0; i <= 100; i += SIZE.grid) {
        const dValueRow = `M0 ${i} L100 ${i}`;
        builder.createPath(container, "", dValueRow, 0.1, "", color);

        const dValueCol = `M${i} 0 L${i} 100`;
        builder.createPath(container, "", dValueCol, 0.1, "", color);
    }
}

function buildEdges(id) {
    let node = model.getNode(id);
    let coords = node.coords;

    for (let otherNode in node.to) {
        let nodeId = node.to[otherNode].node;
        let otherCoords = model.getNode(nodeId).coords;

        const pathContainer = builder.createContainer(svg, `${CONSTANTS.path}_${id}-${nodeId}`);
        const markerEnd = id !== nodeId ? CONSTANTS.arrow : CONSTANTS.selfarrow;

        const edge = model.getEdge(id, nodeId);

        // self-edge
        if (id === nodeId) {
            const dValue = `M${coords.x} ${coords.y - SIZE.nodeRadius + 1} A2 4 0 1 1 ${coords.x + 0.01} ${coords.y - SIZE.nodeRadius + 1}`;
            const outerPath = builder.createPath(pathContainer, "", dValue, 1, "", COLOR.transparent, true);
            const innerPath = builder.createPath(pathContainer, "", dValue, 0.1, markerEnd, COLOR.black, true);
            outerPath.setAttributeNS(null, "transform", `rotate(${edge.angle}, ${node.coords.x}, ${node.coords.y})`);
            innerPath.setAttributeNS(null, "transform", `rotate(${edge.angle}, ${node.coords.x}, ${node.coords.y})`);

            const angleVector = vector.getVectorFromAngle(edge.angle);
            const textCoords = {
                x: node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - edge.textOffset),
                y: node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - edge.textOffset)
            }
            builder.createTextNode(pathContainer, textCoords, edge.desc, true);
        } else {
            const middle = vector.getMiddleOfVector(coords, otherCoords);
            const normalVector = vector.getNormalVector(coords, otherCoords);
            const dist = node.to[otherNode].offset;
            const dValue = `M${coords.x} ${coords.y} Q${middle.x + normalVector.x * 2 * dist} ${middle.y + normalVector.y * 2 * dist} ${otherCoords.x} ${otherCoords.y}`;
            builder.createPath(pathContainer, "", dValue, 1, "", COLOR.transparent, true);
            builder.createPath(pathContainer, "", dValue, 0.1, markerEnd, COLOR.black, true);

            const offset = edge.textOffset;
            const textCoords = {
                x: middle.x + normalVector.x * (dist + offset),
                y: middle.y + normalVector.y * (dist + offset)
            }
            builder.createTextNode(pathContainer, textCoords, node.to[otherNode].desc, true);
        }
    }
}

export function setNodeColor(nodeId, color = COLOR.black) {
    const selector = `${CONSTANTS.node}_${nodeId}`;
    const node = document.getElementById(selector);

    for (let child of node.childNodes) {
        if (child.tagName == CONSTANTS.circle) {
            child.setAttributeNS(null, "stroke", color);
        }
    }
}

export function setPathColor(fromId, toId, color=COLOR.black) {
    const selector = `${CONSTANTS.path}_${fromId}-${toId}`;
    const node = document.getElementById(selector);

    if (!node) return;
    
    let marker = (color == COLOR.black) ? CONSTANTS.arrow : CONSTANTS.arrowSelected;
    if (fromId === toId) {
        marker = (color == COLOR.black) ? CONSTANTS.selfarrow : CONSTANTS.selfarrowSelected;
    }

    // the first child is transparent
    node.childNodes[1].setAttributeNS(null, CONSTANTS.stroke, color);
    node.childNodes[1].setAttributeNS(null, CONSTANTS.markerEnd, `url(#${marker}`);
}

function reselect() {
    // this is needed because currently, everything gets redrawn
    if (!ACTION.selectedElement) return;

    switch (getIdPrefix(ACTION.selectedElement)) {
        case CONSTANTS.node:
            const nodeId = getIdOfNode(ACTION.selectedElement);
            ACTION.selectedElement = getNodeElemById(nodeId);
            setNodeColor(nodeId, COLOR.marked);
            break;
        case CONSTANTS.path:
            const ids = getIdsOfPath(ACTION.selectedElement);
            ACTION.selectedElement = getPathElemByIds(ids.from, ids.to);
            setPathColor(ids.from, ids.to, COLOR.marked);
            break;
        default:
            console.error("Trying to reconstruct unknown element");
    }
}

export function resetCopyView(event) {
    const textContainer = document.getElementById("copy-container");
    const overlay = document.getElementById("overlay");

    textContainer.textContent = "";
    overlay.style.display = "none";
}

export function unmarkAll(graph) {
    for (let nodeId in graph) {
        setNodeColor(nodeId);
    }

    for (let fromId in graph) {
        for (let toId in graph) {
            setPathColor(fromId, toId);
        }
    }
}

export function resetConfigurationView() {
    const container =  document.getElementsByClassName("flow-right")[0];
    container.innerHTML = "";

    return container;
}

export function toggleGridView(show) {
    const gridContainer = document.getElementById("grid-container");
    const color = show ? COLOR.grid : COLOR.transparent;
    
    for (let child of gridContainer.childNodes) {
        child.setAttributeNS(null, CONSTANTS.stroke, color);
    }
}

export function getIdPrefix(elem) {
    return elem.id.split("_")[0];
}

export function getIdOfNode(node) {
    return parseInt(node.id.split("_")[1]);
}

export function getIdsOfPath(path) {
    const ids = path.id.split("_")[1].split("-");
    return { from: parseInt(ids[0]), to: parseInt(ids[1]) };
}

export function showEdgeConfiguration() {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = builder.createRemoveButton(container, "remove");
    const textDescriptionContainer = builder.createDescriptionContainer(container);
    const textDescription = textDescriptionContainer.childNodes[1];

    return {
        removeButton: removeButton,
        textDescription: textDescription
    }
}

export function showNodeConfiguration() {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = builder.createRemoveButton(container, "remove");
    const checkBoxEndContainer = builder.createCheckBoxContainer(container, CONSTANTS.end);
    const checkBoxStartContainer = builder.createCheckBoxContainer(container, CONSTANTS.start);
    const textDescriptionContainer = builder.createDescriptionContainer(container);

    const checkBoxEnd = checkBoxEndContainer.childNodes[1];
    const checkBoxStart = checkBoxStartContainer.childNodes[1];
    const textDescription = textDescriptionContainer.childNodes[1];

    return {
        removeButton: removeButton,
        checkBoxEnd: checkBoxEnd,
        checkBoxStart: checkBoxStart,
        textDescription: textDescription
    }
}

export function getNodeElemById(nodeId) {
    const selector = `${CONSTANTS.node}_${nodeId}`;
    const nodeElem = document.getElementById(selector);

    console.assert(nodeElem, "Couldn't find node");

    return nodeElem;
}

export function toggleCheckBox(name) {
    const checkBox = document.getElementById(name);
    checkBox.checked = !checkBox.checked;
}

export function getPathElemByIds(fromId, toId) {
    const selector = `${CONSTANTS.path}_${fromId}-${toId}`;
    const nodeElem = document.getElementById(selector);

    console.assert(nodeElem, "Couldn't find path");

    return nodeElem;
}

export function removeElementFromView(element) {
    element.parentNode.removeChild(element);
}

export function removePathFromView(edges, id, to) {
    for (let nodeId of edges) {
        const fromId = to ? id : nodeId;
        const toId = to ? nodeId : id;

        const selector = `${CONSTANTS.path}_${fromId}-${toId}`;
        const path = document.getElementById(selector);

        path.parentNode.removeChild(path);
    }
}

export function resetDrawingPath() {
    document.getElementById(CONSTANTS.defaultPath).setAttributeNS(null, "d", "");
}

export function setPathAngle(elem, angle, coords) {
    elem.setAttributeNS(null, "transform", `rotate(${angle}, ${coords.x}, ${coords.y})`);
}

export function updateAttributes(element, attributes) {
    for (let attr in attributes) {
        element.setAttributeNS(null, attr, attributes[attr]);
    }
}

export function getStartEdge(nodeId) {
    const selector = `${CONSTANTS.start}_${nodeId}`;

    return document.getElementById(selector);
}

export function getSVG() {
    return svg;
}

export function correctSubTexts(desc, coords, textNode) {
    const parsedText = parseText(desc);

    const lines = parsedText.length;
    const distance = SIZE.text + 0.5;
    let offset = coords.y - Math.floor(lines / 2) * distance;
    if (lines % 2 === 0) {
        offset += distance / 2;
    }
    
    for (let child of textNode.childNodes) {
        updateAttributes(child, { x: coords.x, y: offset });
        offset += distance;
    }
}

export function updateModeText(text) {
    const modeText = `${text}-mode`;
    document.getElementById("mode-overlay").textContent = modeText;
}

export function isDescriptionFocus() {
    const elem = document.getElementById("description-text-input");
    if (!elem) return false;

    return elem === document.activeElement;
}