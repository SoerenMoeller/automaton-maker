import * as builder from './builder.js';
import * as vector from './vectors.js';
import { SIZE, CONSTANTS, COLOR, DISTANCE, THRESHOLDS, ACTION } from './movable.js';
import { setEdgeAngle } from './model.js';

let svg;

export function init(graph) {
    svg = document.getElementsByTagName("svg")[0];

    build(graph);
    return svg;
}

export function build(graph) {
    reset();

    // render the lines first
    for (let node in graph) {
        buildEdges(graph, node);
    }

    // now render the nodes
    for (let node in graph) {
        buildNode(graph, node);
    }

    reselect();
}

function buildNode(graph, id) {
    const node = graph[id];
    const container = builder.createContainer(svg, `${CONSTANTS.node}_${id}`)

    // create starting arrow
    if (node.attributes.includes(CONSTANTS.start)) {
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

    if (node.attributes.includes(CONSTANTS.end)) {
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
    const style = `text {font: italic ${SIZE.text}px sans-serif; user-select: none;} tspan {font: italic ${SIZE.subText}px sans-serif; user-select: none;}`;
    builder.createStyle(svg, style);

    // add default path for later usage
    builder.createPath(svg, CONSTANTS.defaultPath, "", 0.1, CONSTANTS.defaultMarker, COLOR.marked);

    // make a grid for visible layout
    initGrid()
}

function initGrid() {
    const container = builder.createContainer(svg, "gridContainer");
    const color = ACTION.showGrid ? COLOR.grid : COLOR.transparent;

    for (let i = 0; i <= 100; i += SIZE.grid) {
        const dValueRow = `M0 ${i} L100 ${i}`;
        builder.createPath(container, "", dValueRow, 0.1, "", color);

        const dValueCol = `M${i} 0 L${i} 100`;
        builder.createPath(container, "", dValueCol, 0.1, "", color);
    }
}

function buildEdges(graph, id) {
    let node = graph[id];
    let coords = node.coords;

    for (let otherNode in node.to) {
        let nodeId = node.to[otherNode].node;
        let otherCoords = graph[nodeId].coords;

        const pathContainer = builder.createContainer(svg, `${CONSTANTS.path}_${id}-${nodeId}`);

        // create line
        const middle = vector.getMiddleOfVector(coords, otherCoords);
        const normalVector = vector.getNormalVector(coords, otherCoords);
        const dist = node.to[otherNode].offset;
        let dValue = `M${coords.x} ${coords.y} Q${middle.x + normalVector.x * dist} ${middle.y + normalVector.y * dist} ${otherCoords.x} ${otherCoords.y}`;

        // self-edge
        if (id == nodeId) {
            dValue = `M${coords.x} ${coords.y - SIZE.nodeRadius + 1} A2 4 0 1 1 ${coords.x + 0.01} ${coords.y - SIZE.nodeRadius + 1}`;
        }

        const markerEnd = id != nodeId ? CONSTANTS.arrow : CONSTANTS.selfarrow;
        const outerPath = builder.createPath(pathContainer, "", dValue, 1, "", COLOR.transparent, true);
        const innerPath = builder.createPath(pathContainer, "", dValue, 0.1, markerEnd, COLOR.black, true);

        if (id == nodeId) {
            const path = node.to.find(e => e.node == id);
            outerPath.setAttributeNS(null, "transform", `rotate(${path.angle}, ${node.coords.x}, ${node.coords.y})`);
            innerPath.setAttributeNS(null, "transform", `rotate(${path.angle}, ${node.coords.x}, ${node.coords.y})`);
        }

        // append the text in the middle of the node
        if (id != nodeId) {
            const normalVector = vector.getNormalVector(node.coords, otherCoords);
            const middle = vector.getMiddleOfVector(node.coords, otherCoords);
            const offset = node.to.find(e => e.node == nodeId).textOffset;
            const textCoords = {
                x: middle.x + normalVector.x * (dist / 2 + offset),
                y: middle.y + normalVector.y * (dist / 2 + offset)
            }
            builder.createTextNode(pathContainer, textCoords, node.to[otherNode].desc, true);
        } else {
            const path = node.to.find(e => e.node == id);
            const angleVector = vector.getVectorFromAngle(path.angle);

            const textCoords = {
                x: node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - path.textOffset),
                y: node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - path.textOffset)
            }
            builder.createTextNode(pathContainer, textCoords, path.desc, true);
        }
    }
}

function setNodeColor(nodeId, color = COLOR.black) {
    const selector = `${CONSTANTS.node}_${nodeId}`;
    const node = document.getElementById(selector);

    for (let child of node.childNodes) {
        if (child.tagName == CONSTANTS.circle) {
            child.setAttributeNS(null, "stroke", color);
        }
    }
}

function setPathColor(fromId, toId, color=COLOR.black) {
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
    const container = document.getElementsByClassName("flow-right")[0];
    container.innerHTML = "";

    return container;
}

export function toggleGridView() {
    ACTION.showGrid = !ACTION.showGrid;
    const gridContainer = document.getElementById("gridContainer");
    const color = ACTION.showGrid ? COLOR.grid : COLOR.transparent;
    
    for (let child of gridContainer.childNodes) {
        child.setAttributeNS(null, CONSTANTS.stroke, color);
    }
}

export function getIdPrefix(elem) {
    return elem.id.split("_")[0];
}

export function getIdOfNode(node) {
    return node.id.split("_")[1];
}

export function getIdsOfPath(path) {
    const ids = path.id.split("_")[1].split("-");
    return { from: ids[0], to: ids[1] };
}

export function showEdgeConfiguration() {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = createRemoveButton(container, "remove");
    const textDescriptionContainer = createDescriptionContainer(container);
    const textDescription = textDescriptionContainer.childNodes[1];

    return {
        removeButton: removeButton,
        textDescription: textDescription
    }
}

export function showNodeConfiguration() {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = createRemoveButton(container, "remove");
    const checkBoxEndContainer = createCheckBoxContainer(container, CONSTANTS.end);
    const checkBoxStartContainer = createCheckBoxContainer(container, CONSTANTS.start);
    const textDescriptionContainer = createDescriptionContainer(container);

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

    // rebuild since the checkboxes change the view
    build();
}

function getPathElemByIds(fromId, toId) {
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

export function setPathAttribute(name, attribute) {
    const path = document.getElementById(name);

    path.setAttributeNS(null, "d", attribute);
}

export function setPathAngle(elem, angle, coords) {
    elem.setAttributeNS(null, "transform", `rotate(${angle}, ${coords.x}, ${coords.y})`);
}