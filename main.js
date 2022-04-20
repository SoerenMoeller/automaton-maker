import { convertToLaTeX } from './scripts/converter.js';
import * as model from './scripts/model.js';
import * as view from './scripts/view.js'
import * as vector from './scripts/vectors.js';

"use strict";

document.addEventListener("DOMContentLoaded", main);

const KEYS = {
    control: false
}

const THRESHOLDS = {
    straightEdge: 2,
    angle: 15,
    text: 1
};

export const ACTION = {
    draw: false,
    selectedDragElement: null,
    selectedElement: null,
    drawStartNodeId: -1,
    typing: false,
    showGrid: false
}

export const COLOR = {
    black: "black",
    grid: "rgba(224, 128, 31, 0.3)",
    marked: "#34ebeb",
    transparent: "transparent",
    green: "green",
    red: "red"
}

export const DISTANCE = {
    selfEdgeText: 13,
    startEdge: 7,
    multiText: 3
};

export const SIZE = {
    text: 2.5,
    subText: 1.5,
    nodeRadius: 4,
    grid: 4
};

export const CONSTANTS = {
    path: "path",
    circle: "circle",
    text: "text",
    node: "node",
    polygon: "polygon",
    defs: "defs",
    style: "style",
    start: "start",
    end: "end",
    marker: "marker",
    defaultMarker: "defaultMarker",
    defaultPath: "defaultPath",
    arrow: "arrow",
    selfarrow: "selfarrow",
    arrowSelected: "arrowSelected",
    selfarrowSelected: "selfarrowSelected",
    draggable: "draggable",
    g: "g",
    tspan: "tspan",
    sub: "sub",
    super: "super",
    none: "none",
    white: "white",
    transparent: "transparent",
    markerEnd: "marker-end",
    id: "id",
    class: "class",
    stroke: "stroke",
    middle: "middle",
    central: "central",
    select: "select",
    option: "option"
}

model.setGraph({
    0: {
        desc: ["q_end^hallo", "q_hi^htart"],
        to: [],
        attributes: [],
        coords: {
            x: 10,
            y: 10
        }
    }
});

function main() {
    // find the svg to draw in
    const svg = view.init(model.getGraph());
    svg.addEventListener("load", makeDraggable);

    document.addEventListener("keydown", handleKeyEvent);
    document.addEventListener("keyup", handleKeyUpEvent);

    const resetButton = document.getElementById("resetContainer");
    const downloadButton = document.getElementsByTagName("a")[0];
    const addButton = document.getElementById("addButton");
    const convertButton = document.getElementById("convertButton");
    const copyButton = document.getElementById("copyButton");
    const overlay = document.getElementById("overlay");
    const sizeSelection = document.getElementById("selectedSize");

    resetButton.addEventListener("click", e => resetAll());
    downloadButton.addEventListener("click", e => downloadSVG(downloadButton));
    addButton.addEventListener("click", e => addNode());
    convertButton.addEventListener("click", convert);
    copyButton.addEventListener("click", e => copyText());
    overlay.addEventListener("click", resetCopyView);
    sizeSelection.addEventListener("change", changeSize);
}

function handleKeyEvent(event) {
    if (!event.code) return;

    if (ACTION.typing && (event.code != "Escape" || event.code != "ShiftRight" || event.code != "ShiftLeft")) return;

    switch (event.code) {
        case "KeyA":
            addNode();
            break;
        case "ShiftRight":
        case "ShiftLeft":
            toggleGridView();
            break;
        case "ControlLeft":
        case "ControlRight":
            KEYS.control = true;
            break;
        case "Escape":
            unselectAll();
            break;
        case "Delete":
        case "Backspace":
            removeElement();
            break;
        case "KeyS":
            toggleNodeAttribute(true, CONSTANTS.start);
            break;
        case "KeyE":
            toggleNodeAttribute(true, CONSTANTS.end);
            break;
        case "KeyD":
            focusDescription(event);
            break;
        case "KeyT":
            // toggle showing multi line option -- only toggle off when 0/1 line
            switchMultiLine();
            break;
        default:
        // debug only
        //console.log(event.code);
    }
}

function handleKeyUpEvent(event) {
    KEYS.control = false;
}

function switchMultiLine() {
    if (!ACTION.selectedElement) return;

    const isNode = view.getIdPrefix(ACTION.selectedElement) === CONSTANTS.node;
    let desc;
    if (isNode) {
        const nodeId = view.getIdOfNode(ACTION.selectedElement);
        desc = model.getNodeDescription(nodeId);
    } else {
        const ids = view.getIdsOfPath(ACTION.selectedElement);
        desc = model.getEdgeDescription(ids.from, ids.to);
    }

    if (!view.isShowingMultiLine()) {
        // show
        view.injectMultipleLineView();
    } else if (desc.length < 2) {
        // unshow
        view.removeMultipleLineView();
    }
}

function focusDescription(event) {
    const descriptionTextInput = document.getElementById("descriptionTextInput");
    if (!descriptionTextInput) return;

    // prevent letter from getting pasted into the field
    event.preventDefault();
    descriptionTextInput.focus();
}

function changeSize(event) {
    const sizeSelection = event.target;
    const value = sizeSelection.value;

    switch (value) {
        case "small":
            SIZE.grid = 3;
            SIZE.nodeRadius = 3;
            SIZE.text = 1.5;
            SIZE.subText = 1;
            DISTANCE.selfEdgeText = 11;
            DISTANCE.startEdge = 5;
            break;
        case "medium":
            SIZE.grid = 4;
            SIZE.nodeRadius = 4;
            SIZE.text = 2.5;
            SIZE.subText = 1.5;
            DISTANCE.selfEdgeText = 13;
            DISTANCE.startEdge = 7;
            break;
        case "big":
            SIZE.grid = 6;
            SIZE.nodeRadius = 6;
            SIZE.text = 3.5;
            SIZE.subText = 2;
            DISTANCE.selfEdgeText = 16;
            DISTANCE.startEdge = 10;
            break;
        default:
            console.error("Unkown size selected");
    }

    view.build();
}

async function copyText() {
    const textContainer = document.getElementById("copy-container");

    await navigator.clipboard.writeText(textContainer.textContent).then(() => { }, (err) => console.error('Async: Could not copy text: ', err));
}

function resetCopyView(event) {
    if (!event.target.id || event.target.id !== "overlay") return;

    view.resetCopyView();
}

function convert(event) {
    const textContainer = document.getElementById("copy-container");
    const overlay = document.getElementById("overlay");

    // make overlay visible
    overlay.style.display = "flex";

    const tex = convertToLaTeX(model.getGraph());
    textContainer.textContent = tex;
}

function resetAll() {
    ACTION.showGrid = false;

    unselectAll();
    model.reset();
    view.reset();
}

function initEdgeConfiguration(ids) {
    const path = model.getEdge(ids.from, ids.to);
    const data = path.desc;

    const elements = view.showEdgeConfiguration();
    elements.textDescription.value = data.join(" || ");

    // add events for change 
    elements.removeButton.addEventListener("click", evt => removeElement());
    elements.textDescription.addEventListener("focusin", evt => ACTION.typing = true);
    elements.textDescription.addEventListener("focusout", evt => ACTION.typing = false);
    elements.textDescription.addEventListener("input", evt => {
        evt.preventDefault();
        model.setEdgeDescription(ids.from, ids.to, elements.textDescription.value);

        view.build();
    });
}

function initNodeConfiguration(nodeId) {
    const elements = view.showNodeConfiguration();
    const data = model.getNodeDescription(nodeId);

    // fill with existing data
    elements.checkBoxEnd.checked = model.isNodeEnd(nodeId);
    elements.checkBoxStart.checked = model.isNodeStart(nodeId);
    elements.textDescription.value = data.join(" || ");

    // add events for change 
    elements.removeButton.addEventListener("click", evt => removeElement());
    elements.checkBoxEnd.addEventListener("click", evt => toggleNodeAttribute(false, CONSTANTS.end));
    elements.checkBoxStart.addEventListener("click", evt => toggleNodeAttribute(false, CONSTANTS.start));
    elements.textDescription.addEventListener("focusin", evt => ACTION.typing = true);
    elements.textDescription.addEventListener("focusout", evt => ACTION.typing = false);
    elements.textDescription.addEventListener("input", evt => {
        evt.preventDefault();

        const nodeId = view.getIdOfNode(ACTION.selectedElement);
        model.setNodeDescription(nodeId, elements.textDescription.value);
        view.build();
    });
}

function toggleNodeAttribute(changeView, attribute) {
    if (!ACTION.selectedElement || view.getIdPrefix(ACTION.selectedElement) !== CONSTANTS.node) return;

    const nodeId = view.getIdOfNode(ACTION.selectedElement);
    model.toggleNodeAttribute(nodeId, attribute);

    if (changeView) {
        const checkBox = (attribute === CONSTANTS.start) ? "startCheckBox" : "endCheckBox";
        view.toggleCheckBox(checkBox);
    }
    view.build();
}

function addNode() {
    const id = model.addNode();

    view.build();

    // highlight the node after builing it
    selectNodeById(id);
}

function selectNodeById(nodeId) {
    const nodeElem = view.getNodeElemById(nodeId);

    selectNode(nodeElem);
}

function removeElement() {
    if (!ACTION.selectedElement) return;

    const prefix = view.getIdPrefix(ACTION.selectedElement);
    switch (prefix) {
        case CONSTANTS.node:
            removeNode();
            break;
        case CONSTANTS.path:
            removePath();
            break;
        default:
            console.error("Trying to delete unknown type");
    }

    unselectAll();
}

function removePath() {
    const ids = getIdsOfPath(ACTION.selectedElement);

    // remove edge from logic
    model.removeEdge(ids.from, ids.to);

    // remove from view
    view.removeElementFromView(ACTION.selectedElement);
    unselectAll();
}

function removeNode() {
    const nodeId = getIdOfNode(ACTION.selectedElement);

    // fetch edges related to the node
    const edges = model.getEdgesInvolvingNode(nodeId);

    model.removeNode(nodeId);

    view.removePathFromView(edges.from, nodeId, true);
    view.removePathFromView(edges.to, nodeId, false);

    // remove from view
    view.removeElementFromView(ACTION.selectedElement);
}

function unselectAll() {
    ACTION.selectedElement = null;
    ACTION.typing = false;

    view.resetConfigurationView();
    view.unmarkAll(model.getGraph());
}

function selectEdge(elem) {
    unselectAll();

    // select the node
    ACTION.selectedElement = elem;

    // mark selected node
    const ids = view.getIdsOfPath(elem);
    view.setPathColor(ids.from, ids.to, COLOR.marked);

    initEdgeConfiguration(ids);
}

function selectNode(elem) {
    unselectAll();

    // select the node
    ACTION.selectedElement = elem;

    // mark selected node
    const nodeId = view.getIdOfNode(elem);
    view.setNodeColor(nodeId, COLOR.marked);

    if (KEYS.control) {
        startDrawing(nodeId);
    }

    // show view elements
    initNodeConfiguration(nodeId);
}

function startDrawing(nodeId) {
    unselectAll();

    ACTION.draw = true;
    ACTION.drawStartNodeId = nodeId;
}

function endDrawing(event) {
    // mount the path if on another node (or else throw it away)
    const mouse = getMousePosition(event);

    for (let nodeId in model.getGraph()) {
        // check if distance is low enough
        if (vector.getDistance(mouse, model.getCoords(nodeId)) > SIZE.nodeRadius) continue;

        // try adding edge (fails if already exists)
        const succ = model.addEdge(ACTION.drawStartNodeId, parseInt(nodeId));
        if (succ === -1) continue;

        view.build();

        // highlight the edge
        const path = view.getPathElemByIds(ACTION.drawStartNodeId, nodeId);
        selectEdge(path);
        break;
    }

    // reset drawing path
    view.resetDrawingPath();

    ACTION.draw = false;
    ACTION.drawStartNodeId = -1;
}

function makeDraggable(evt) {
    var svg = evt.target;
    svg.addEventListener('mousedown', mouseDown);
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mousemove', draw);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);
}

function mouseDown(evt) {
    let elem = evt.target;

    while (elem.tagName === CONSTANTS.tspan) {
        elem = elem.parentNode;
    }
    
    const prefix = view.getIdPrefix(elem.parentNode);

    // cancel selection if the background is clicked
    if (elem === view.getSVG()) {
        unselectAll();
        return;
    }

    if (elem.classList.contains(CONSTANTS.draggable)) {
        switch (prefix) {
            case CONSTANTS.node:
                selectNode(elem.parentNode);
                break;
            case CONSTANTS.path:
                selectEdge(elem.parentNode);
                break;
            case CONSTANTS.start:
                // select the node the starting arrow is attached to
                selectNode(elem.parentNode.parentNode);
                break;
            default:
                console.error("Unknown type selected");
        }
    }
}

function startDrag(evt) {
    let elem = evt.target;

    while (elem.tagName === CONSTANTS.tspan) {
        elem = elem.parentNode;
    }

    if (elem.classList.contains(CONSTANTS.draggable)) {
        let parent = elem.parentNode;

        if (elem.tagName === CONSTANTS.text && view.getIdPrefix(parent) === CONSTANTS.path) {
            ACTION.selectedDragElement = elem;
        } else if (parent && parent.tagName === CONSTANTS.g) {
            ACTION.selectedDragElement = parent;
        } else {
            console.error("Wrong element clickable");
        }
    }
}

function draw(evt) {
    if (!ACTION.draw) return;

    evt.preventDefault();
    const mouse = getMousePosition(evt);

    const startCoords = model.getCoords(ACTION.drawStartNodeId);
    const dValue = `M${startCoords.x} ${startCoords.y} L${mouse.x} ${mouse.y}`;
    const path = document.getElementById(CONSTANTS.defaultPath);

    view.updateAttributes(path, { d: dValue });
}

function drag(evt) {
    if (!ACTION.selectedDragElement || ACTION.draw) return;

    evt.preventDefault();
    const mouse = getMousePosition(evt);
    let prefix = view.getIdPrefix(ACTION.selectedDragElement);

    // if a text is selected, we want to change the offset
    if (ACTION.selectedDragElement.tagName === CONSTANTS.text) {
        prefix = CONSTANTS.text;
    }

    switch (prefix) {
        case CONSTANTS.node:
            dragNode(mouse);
            break;
        case CONSTANTS.start:
            dragStartEdge(mouse);
            break;
        case CONSTANTS.path:
            const ids = view.getIdsOfPath(ACTION.selectedDragElement);
            if (ids.from === ids.to) {
                dragSelfEdge(mouse);
            } else {
                dragEdge(mouse);
            }
            break;
        case CONSTANTS.text:
            dragText(mouse);
            break;
        default:
            console.error("unknown dragging type");
    }
}

function dragText(mouse) {
    // get the id of the node
    const ids = view.getIdsOfPath(ACTION.selectedDragElement.parentNode);
    const edge = model.getEdge(ids.from, ids.to);
    const startNode = model.getNode(ids.from);
    const endNode = model.getNode(ids.to);

    let update;

    // handle self edge text
    if (ids.from === ids.to) {
        const angleVector = vector.getVectorFromAngle(edge.angle);
        const basePosition = { x: startNode.coords.x + angleVector.x * DISTANCE.selfEdgeText, y: startNode.coords.y + angleVector.y * DISTANCE.selfEdgeText };
        const normalAngle = vector.getNormalVector(startNode.coords, basePosition);

        let dist = vector.getDistanceToLine(mouse, normalAngle, basePosition);
        dist = snap(dist, THRESHOLDS.text);
        edge.textOffset = dist;

        update = {
            x: startNode.coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist),
            y: startNode.coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist)
        };
    } else {
        // handle normal edge
        const middle = vector.getMiddleOfVector(startNode.coords, endNode.coords);
        const normalVector = vector.getNormalVector(startNode.coords, endNode.coords);
        const directionVector = vector.getDirectionVector(startNode.coords, endNode.coords);
        let dist = vector.getDistanceToLine(mouse, directionVector, startNode.coords) - edge.offset;
        dist = snap(dist, THRESHOLDS.text);
        edge.textOffset = dist;

        update = {
            x: middle.x + normalVector.x * (dist + edge.offset),
            y: middle.y + normalVector.y * (dist + edge.offset)
        };
    }

    view.updateAttributes(ACTION.selectedDragElement, update);
    view.correctSubTexts(edge.desc, update, ACTION.selectedDragElement);
}

function dragSelfEdge(coord) {
    const ids = view.getIdsOfPath(ACTION.selectedDragElement);
    const nodeId = ids.from;
    const node = model.getNode(nodeId);

    let angle = vector.getAngle360Degree(node.coords, coord);
    if (ACTION.showGrid) {
        angle = getClosestStep(angle, THRESHOLDS.angle);
    }
    model.setEdgeAngle(nodeId, angle);

    for (let child of ACTION.selectedDragElement.childNodes) {
        switch (child.tagName) {
            case CONSTANTS.path:
                view.setPathAngle(child, angle, node.coords);
                break;
            case CONSTANTS.text:
                correctSelfEdgeText(child, nodeId);
                break;
            default:
                console.error("Unhandled tag found");
        }
    }
}

function dragEdge(mouse) {
    // get the id of the node
    const ids = view.getIdsOfPath(ACTION.selectedDragElement);

    // get the coords of the nodes
    const startNode = model.getNode(ids.from);
    const endNode = model.getNode(ids.to);
    const middle = vector.getMiddleOfVector(startNode.coords, endNode.coords);
    const normalVector = vector.getNormalVector(startNode.coords, endNode.coords);

    // determine distance to mouse 
    const directionVector = vector.getDirectionVector(startNode.coords, endNode.coords);
    let dist = vector.getDistanceToLine(mouse, directionVector, startNode.coords);

    if (2 * dist < THRESHOLDS.straightEdge && 2 * dist > -THRESHOLDS.straightEdge) {
        dist = 0;
    }
    dist = snap(dist, SIZE.grid);

    // update the offset in the data
    const edge = model.getEdge(ids.from, ids.to);
    edge.offset = dist;
    const textOffset = edge.textOffset;

    const dValue = `M${startNode.coords.x} ${startNode.coords.y} Q${middle.x + normalVector.x * 2 * dist} ${middle.y + normalVector.y * 2 * dist} ${endNode.coords.x} ${endNode.coords.y}`;
    const update = {
        x: middle.x + normalVector.x * (dist + textOffset),
        y: middle.y + normalVector.y * (dist + textOffset)
    };
    for (let child of ACTION.selectedDragElement.childNodes) {
        switch (child.tagName) {
            case CONSTANTS.path:
                view.updateAttributes(child, { d: dValue });
                break;
            case CONSTANTS.text:
                view.updateAttributes(child, update);
                break;
            default:
                console.error("Unknown element found");
        }
    }
}

function dragStartEdge(mouse) {
    const id = view.getIdOfNode(ACTION.selectedDragElement);
    const coords = model.getCoords(id);

    let angle = vector.getAngle360Degree(coords, mouse);
    angle = snap(angle, THRESHOLDS.angle);

    model.setStartAngle(angle);

    // adapt the line
    const startAngle = vector.getVectorFromAngle(angle);
    const length = SIZE.nodeRadius + DISTANCE.startEdge;
    const dValue = `M${coords.x + startAngle.x * length} ${coords.y + startAngle.y * length} L${coords.x} ${coords.y}`;

    view.updateAttributes(ACTION.selectedDragElement.childNodes[0], { d: dValue });
    view.updateAttributes(ACTION.selectedDragElement.childNodes[1], { d: dValue });
}

function dragNode(mouse) {
    const id = view.getIdOfNode(ACTION.selectedDragElement);
    const coords = model.getCoords(id);

    mouse.x = snap(mouse.x, SIZE.grid);
    mouse.y = snap(mouse.y, SIZE.grid);

    // prevent overlapping nodes and going over the edge
    let distance = Number.MAX_VALUE;
    for (let nodeId in model.getGraph()) {
        if (nodeId == id) continue;

        const tmpDistance = vector.getDistance(mouse, model.getCoords(nodeId));
        distance = Math.min(distance, tmpDistance);
    }

    if (mouse.x > 100 - SIZE.nodeRadius || mouse.x < SIZE.nodeRadius || distance < 2 * SIZE.nodeRadius) {
        mouse.x = coords.x;
    }
    if (mouse.y > 100 - SIZE.nodeRadius || mouse.y < SIZE.nodeRadius || distance < 2 * SIZE.nodeRadius) {
        mouse.y = coords.y;
    }

    // move the text and the circle
    for (let child of ACTION.selectedDragElement.childNodes) {
        switch (child.tagName) {
            case CONSTANTS.circle:
                view.updateAttributes(child, { cx: mouse.x, cy: mouse.y });
                break;
            case CONSTANTS.text:
                view.updateAttributes(child, { x: mouse.x, y: mouse.y });
                view.correctSubTexts(model.getNodeDescription(id), mouse, child);
                break;
            case CONSTANTS.g:
                // handled later
                break;
            default:
                console.error("Unknown element found: ", child);
        }
    }

    // change the path of start
    if (model.isNodeStart(id)) {
        const pathContainer = view.getStartEdge(id);

        const startAngle = vector.getVectorFromAngle(model.getStartAngle(id));
        const length = SIZE.nodeRadius + DISTANCE.startEdge;
        const dValue = `M${coords.x + startAngle.x * length} ${coords.y + startAngle.y * length} L${coords.x} ${coords.y}`;

        view.updateAttributes(pathContainer.childNodes[0], { d: dValue });
        view.updateAttributes(pathContainer.childNodes[1], { d: dValue });
    }

    // update the model
    model.setCoords(id, mouse);

    // remove the self edge
    const edges = model.getEdgesInvolvingNode(id);
    if (model.hasSelfEdge(id)) {
        // remove from list
        const index = edges.to.indexOf(id);
        edges.to.splice(index, 1);

        const dValue = `M${coords.x} ${coords.y - SIZE.nodeRadius + 1} A2 4 0 1 1 ${coords.x + 0.01} ${coords.y - SIZE.nodeRadius + 1}`;
        const selfPath = model.getEdge(id, id);

        // get the svg path
        const path = view.getPathElemByIds(id, id);

        // correct the self edge 
        const update = {
            d: dValue,
            transform: `rotate(${selfPath.angle}, ${coords.x}, ${coords.y})`
        };
        for (let child of path.childNodes) {
            switch (child.tagName) {
                case CONSTANTS.path:
                    view.updateAttributes(child, update);
                    break;
                case CONSTANTS.text:
                    correctSelfEdgeText(child, id);
                    break;
                default:
                    console.error("Unhandeled tag found");
            }
        }
    }

    // correct the paths
    correctEdges(edges.to, id, true);
    correctEdges(edges.from, id, false);
}

function endDrag(evt) {
    if (ACTION.draw) {
        endDrawing(evt)
    }

    ACTION.selectedDragElement = null;
}

function getMousePosition(evt) {
    var CTM = view.getSVG().getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

function correctEdges(pathList, id, to) {
    for (let nodeId of pathList) {
        const fromId = to ? nodeId : id;
        const toId = to ? id : nodeId;

        // get the svg path
        const path = view.getPathElemByIds(fromId, toId);

        // redraw the path
        const startCoords = model.getCoords(fromId);
        const endCoords = model.getCoords(toId);

        const middle = vector.getMiddleOfVector(startCoords, endCoords);
        const normalVector = vector.getNormalVector(startCoords, endCoords);
        const otherNode = model.getEdge(fromId, toId);
        const dist = otherNode.offset;

        const dValue = `M${startCoords.x} ${startCoords.y} Q${middle.x + normalVector.x * 2 * dist} ${middle.y + normalVector.y * 2 * dist} ${endCoords.x} ${endCoords.y}`;
        const textOffset = otherNode.textOffset;

        const update = {
            x: middle.x + normalVector.x * (dist + textOffset),
            y: middle.y + normalVector.y * (dist + textOffset)
        };

        for (const child of path.childNodes) {
            switch (child.tagName) {
                case CONSTANTS.path:
                    view.updateAttributes(child, { d: dValue });
                    break;
                case CONSTANTS.text:
                    view.updateAttributes(child, update);
                    view.correctSubTexts(model.getEdgeDescription(fromId, toId), update, child);
                    break;
                default:
                    console.error("Unknown element found");
            }
        }
    }
}

function correctSelfEdgeText(elem, id) {
    const edge = model.getEdge(id, id);
    const coords = model.getCoords(id);
    const angleVector = vector.getVectorFromAngle(edge.angle);
    const dist = edge.textOffset;

    const update = {
        x: coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist),
        y: coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist)
    };
    view.updateAttributes(elem, update);
    view.correctSubTexts(model.getEdgeDescription(id, id), update, elem);
}

function toggleGridView() {
    ACTION.showGrid = !ACTION.showGrid;

    view.toggleGridView(ACTION.showGrid);
}

function downloadSVG(downloadLink) {
    unselectAll();
    if (ACTION.showGrid) {
        toggleGridView();
    }

    var svgData = view.getSVG().outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);

    downloadLink.href = svgUrl;
    downloadLink.download = "automaton.svg";
}

function snap(val, step) {
    if (!ACTION.showGrid) return val;

    return Math.round(val / step) * step;
}