import * as builder from './builder.js';
import * as vector from './vectors.js';
import { SIZE, CONSTANTS, COLOR, DISTANCE, THRESHOLDS, ACTION } from './movable.js';

let svg;

export function init(graph) {
    svg = document.getElementsByTagName("svg")[0];

    build(graph);
    return svg;
}

function build(graph) {
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

function reset() {
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
            createTextNode(pathContainer, textCoords, node.to[otherNode].desc, true);
        } else {
            const path = node.to.find(e => e.node == id);
            const angleVector = vector.getVectorFromAngle(path.angle);

            const textCoords = {
                x: node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - path.textOffset),
                y: node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - path.textOffset)
            }
            createTextNode(pathContainer, textCoords, path.desc, true);
        }
    }
}

function createTextNode(parent, position, text, draggable) {
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