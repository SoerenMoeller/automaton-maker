import { convertToLaTeX } from './converter.js';
import * as model from './model.js';
import * as view from './view.js'
import * as vector from './vectors.js';

document.addEventListener("DOMContentLoaded", main);

export const COLOR = {
    black: "black",
    grid: "rgba(224, 128, 31, 0.3)",
    marked: "#34ebeb",
    transparent: "transparent"
}

export const THRESHOLDS = {
    straightEdge: 2,
    angle: 15
};

export const DISTANCE = {
    selfEdgeText: 13,
    startEdge: 7
};

export const SIZE = {
    text: 2.5,
    subText: 1.5,
    nodeRadius: 4,
    grid: 4
};

const KEYS = {
    control: false
}

export const ACTION = {
    draw: false,
    selectedDragElement: null,
    selectedElement: null,
    drawStartNodeId: -1,
    typing: false,
    showGrid: false
}

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
    central: "central"
}

let graph = {
    0: {
        desc: "q_0",
        attributes: ["start"],
        startAngle: 270,
        to: [
            {
                node: 1,
                desc: "a",
                offset: 0,
                textOffset: -2
            }
        ],
        coords: {
            x: 10,
            y: 50
        }
    },
    1: {
        desc: "q_1^1",
        attributes: [],
        to: [
            {
                node: 2,
                desc: "a",
                offset: 0,
                textOffset: -2
            }, {
                node: 5,
                desc: "a",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 20,
            y: 20
        }
    },
    2: {
        desc: "q_2^1",
        attributes: [],
        to: [
            {
                node: 3,
                desc: "a",
                offset: 0,
                textOffset: -2
            }, {
                node: 6,
                desc: "b",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 40,
            y: 20
        }
    },
    3: {
        desc: "q_3^1",
        attributes: [],
        to: [
            {
                node: 7,
                desc: "a",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 60,
            y: 20
        }
    },
    4: {
        desc: "q_e",
        attributes: ["end"],
        to: [],
        coords: {
            x: 70,
            y: 50
        }
    },
    5: {
        desc: "q_1^2",
        attributes: [],
        to: [
            {
                node: 6,
                desc: "b",
                offset: 0,
                textOffset: -2
            }, {
                node: 1,
                desc: "a",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 20,
            y: 80
        }
    },
    6: {
        desc: "q_2^2",
        attributes: [],
        to: [
            {
                node: 7,
                desc: "b",
                offset: 0,
                textOffset: -2
            }, {
                node: 2,
                desc: "b",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 40,
            y: 80
        }
    },
    7: {
        desc: "q_3^2",
        attributes: [],
        to: [
            {
                node: 4,
                desc: "b",
                offset: 0,
                textOffset: 2
            }, {
                node: 3,
                desc: "a",
                offset: 4,
                textOffset: 2
            }
        ],
        coords: {
            x: 60,
            y: 80
        }
    },
};
let svg;
// for debugging
model.setGraph(graph);

function main() {
    // find the svg to draw in
    svg = view.init(model.getGraph());
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

    await navigator.clipboard.writeText(textContainer.textContent).then(() => {}, (err) => console.error('Async: Could not copy text: ', err));
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

    const tex = convertToLaTeX(graph);
    textContainer.textContent = tex;
}

function resetAll() {
    ACTION.showGrid = false;

    unselectAll();
    model.reset();
    view.reset();
}

function handleKeyUpEvent(event) {
    KEYS.control = false;
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
            toggleStartNode(true);
            break;
        case "KeyE":
            toggleEndNode(true);
            break;
        default:
            // debug only
            //console.log(event.code);
    }
}

function showEdgeConfiguration(ids) {
    const path = model.getEdge(...ids);
    const data = path.desc;

    const elements = view.showEdgeConfiguration();
    elements.textDescription.value = data;

    // add events for change 
    elements.removeButton.addEventListener("click", evt => removeElement());
    elements.textDescription.addEventListener("focusin", evt => ACTION.typing = true);
    elements.textDescription.addEventListener("focusout", evt => ACTION.typing = false);
    elements.textDescription.addEventListener("input", evt => {
        evt.preventDefault();
        model.setEdgeDescription(...ids, textDescription.value);

        view.build();
    });
}

function showNodeConfiguration(nodeId) {
    const elements = view.showNodeConfiguration();

    // fill with existing data
    elements.checkBoxEnd.checked = model.isNodeEnd(nodeId);
    elements.checkBoxStart.checked = model.isNodeStart(nodeId);
    elements.textDescription.value = model.getNodeDescription(nodeId);

    // add events for change 
    elements.removeButton.addEventListener("click", evt => removeElement());
    elements.checkBoxEnd.addEventListener("click", evt => toggleEndNode(false));
    elements.checkBoxStart.addEventListener("click", evt => toggleStartNode(false));
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
    if (!ACTION.selectedElement || view.getIdPrefix(ACTION.selectedElement) != CONSTANTS.node) return;

    const nodeId = view.getIdOfNode(ACTION.selectedElement);
    model.toggleNodeAttribute(nodeId, attribute);

    if (changeView) {
        const checkBox = (attribute === CONSTANTS.start) ? "startCheckBox" : "endCheckBox";
        view.toggleCheckBox(checkBox);
    }
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
    const ids = getIdsOfPath(elem);
    view.setPathColor(ids.from, ids.to, COLOR.marked);

    showEdgeConfiguration(ids);
}

function selectNode(elem) {
    unselectAll();

    // select the node
    ACTION.selectedElement = elem;

    // mark selected node
    const nodeId = getIdOfNode(elem);
    view.setNodeColor(nodeId, COLOR.marked);

    if (KEYS.control) {
        startDrawing(nodeId);
    }

    // show view elements
    showNodeConfiguration(nodeId);
}

function startDrawing(nodeId) {
    unselectAll();

    ACTION.draw = true;
    ACTION.drawStartNodeId = nodeId;
}

function endDrawing(event) {
    // mount the path if on another node (or else throw it away)
    const coord = getMousePosition(event);

    for (let nodeId in graph) {
        // check if distance is low enough
        if (vector.getDistance(coord, model.getCoords(nodeId)) > SIZE.nodeRadius) continue;

        // try adding edge (fails if already exists)
        const succ = model.addEdge(ACTION.drawStartNodeId, nodeId);
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
    // check if node is selected
    const target = evt.target;
    const prefix = view.getIdPrefix(target.parentNode);

    // cancel selection if the background is clicked
    if (target === svg) {
        unselectAll();
        return;
    }

    if (target.classList.contains(CONSTANTS.draggable)) {
        switch (prefix) {
            case CONSTANTS.node:
                selectNode(target.parentNode);
                break;
            case CONSTANTS.path:
                selectEdge(target.parentNode);
                break;
            case CONSTANTS.start:
                // select the node the starting arrow is attached to
                selectNode(target.parentNode.parentNode);
                break;
            default:
                console.error("Unknown type selected");
        }
    }
}

function startDrag(evt) {
    let elem = evt.target.tagName !== CONSTANTS.tspan ? evt.target : evt.target.parentNode;

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

    view.setPathAttribute(CONSTANTS.defaultPath, dValue);
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
    const edge = model.getEdge(...ids);
    const startNode = model.getNode(ids.from);
    const endNode = model.getNode(ids.to);

    // handle self edge text
    if (ids.from === ids.to) {
        const angleVector = vector.getVectorFromAngle(path.angle);
        const basePosition = {x: startNode.coords.x + angleVector.x * DISTANCE.selfEdgeText, y: startNode.coords.y + angleVector.y * DISTANCE.selfEdgeText };
        const normalAngle = vector.getNormalVector(startNode.coords, basePosition);
        
        let dist = vector.getDistanceToLine(mouse, normalAngle, basePosition);
        egde.textOffset = dist;
        
        ACTION.selectedDragElement.setAttributeNS(null, "x", startNode.coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist));
        ACTION.selectedDragElement.setAttributeNS(null, "y", startNode.coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist));
        
        return;
    } 
    
    // handle normal edge
    const middle = vector.getMiddleOfVector(startNode.coords, endNode.coords);
    const directionVector = vector.getDirectionVector(startNode.coords, endNode.coords);
    let dist = vector.getDistanceToLine(mouse, directionVector, startNoce.coords) - edge.offset;

    edge.textOffset = dist;
    ACTION.selectedDragElement.setAttributeNS(null, "x", middle.x + normalVector.x * (dist + edgeOffset));
    ACTION.selectedDragElement.setAttributeNS(null, "y", middle.y + normalVector.y * (dist + edgeOffset));
}

function dragSelfEdge(coord) {
    const { nodeId } = view.getIdsOfPath(ACTION.selectedDragElement);
    const node = getNode(nodeId);

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
    const startNode = getNode(ids.from);
    const endNode = getNode(ids.to);
    const middle = vector.getMiddleOfVector(startNode.coords, endNode.coords);
    const normalVector = vector.getNormalVector(startNode.coords, endNode.coords);

    // determine distance to mouse 
    const directionVector = vector.getDirectionVector(startNode.coords, endNode.coords);
    let dist = vector.getDistanceToLine(mouse, directionVector, startNode.coords);

    if (2*dist < THRESHOLDS.straightEdge && 2*dist > -THRESHOLDS.straightEdge) {
        dist = 0;
    }
    if (ACTION.showGrid) {
        dist = getClosestStep(dist, SIZE.grid);
    }

    // update the offset in the data
    const edge = model.getEdge(...ids);
    edge.offset = dist;
    const textOffset = edge.textOffset;

    const dValue = `M${startNode.coords.x} ${startNode.coords.y} Q${middle.x + normalVector.x * dist} ${middle.y + normalVector.y * dist} ${endNode.coords.x} ${endNode.coords.y}`;
    for (let child of ACTION.selectedDragElement.childNodes) {
        if (child.tagName == CONSTANTS.path) {
            child.setAttributeNS(null, "d", dValue);
        }

        if (child.tagName == CONSTANTS.text) {
            child.setAttributeNS(null, "x", middle.x + normalVector.x * (dist / 2 + textOffset));
            child.setAttributeNS(null, "y", middle.y + normalVector.y * (dist / 2 + textOffset));
        }
    }
}

function dragStartEdge(coord) {
    // get the id of the node
    const id = parseInt(ACTION.selectedDragElement.id.split("_")[1]);
    const node = graph[id];

    let angle = vector.getAngle360Degree(node.coords, coord);
    if (ACTION.showGrid) {
        angle = getClosestStep(angle, 360, THRESHOLDS.angle);
    }
    node.startAngle = angle;

    // adapt the line
    const startAngle = vector.getVectorFromAngle(angle);
    const length = SIZE.nodeRadius + DISTANCE.startEdge;
    const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

    ACTION.selectedDragElement.childNodes[0].setAttributeNS(null, "d", dValue);
    ACTION.selectedDragElement.childNodes[1].setAttributeNS(null, "d", dValue);
}

function dragNode(coord) {
    // get the id of the node
    const id = parseInt(ACTION.selectedDragElement.id.split("_")[1]);
    const node = graph[id];

    if (ACTION.showGrid) {
        coord.x = getClosestStep(coord.x, 100, SIZE.grid);
        coord.y = getClosestStep(coord.y, 100, SIZE.grid);
    }

    // prevent going over the edge
    let freezeX = coord.x > 100 - SIZE.nodeRadius || coord.x < SIZE.nodeRadius;
    let freezeY = coord.y > 100 - SIZE.nodeRadius || coord.y < SIZE.nodeRadius;

    // prevent overlapping nodes
    let distance = Number.MAX_VALUE;
    for (let nodeId in graph) {
        if (nodeId == id) continue;

        const tmpDistance = Math.sqrt(Math.pow(coord.x - graph[nodeId].coords.x, 2) + Math.pow(coord.y - graph[nodeId].coords.y, 2));
        distance = Math.min(distance, tmpDistance);
    }
    if (freezeX || distance < 2 * SIZE.nodeRadius) {
        coord.x = graph[id].coords.x;
    }

    if (freezeY || distance < 2 * SIZE.nodeRadius) {
        coord.y = graph[id].coords.y;
    }

    // move the text and the circle
    for (let child of ACTION.selectedDragElement.childNodes) {
        child.setAttributeNS(null, child.tagName == CONSTANTS.circle ? "cx" : "x", coord.x);
        child.setAttributeNS(null, child.tagName == CONSTANTS.circle ? "cy" : "y", coord.y);
    }

    // change the path of start
    if (graph[id].attributes.includes(CONSTANTS.start)) {
        const selector = `${CONSTANTS.start}_${id}`;
        const pathContainer = document.getElementById(selector);

        const startAngle = vector.getVectorFromAngle(node.startAngle);
        const length = SIZE.nodeRadius + DISTANCE.startEdge;
        const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

        pathContainer.childNodes[0].setAttributeNS(null, "d", dValue);
        pathContainer.childNodes[1].setAttributeNS(null, "d", dValue);
    }

    graph[id].coords = coord;
    // get all paths from current node
    const pathTo = [];
    let paths = graph[id].to;
    for (let elem in paths) {
        pathTo.push(parseInt(paths[elem].node));
    }

    // collect all paths into the current node
    const pathFrom = [];
    for (let nodeId in graph) {
        let to = graph[nodeId].to;
        for (let otherNode in to) {
            let otherId = to[otherNode].node;
            if (otherId == id) {
                pathFrom.push(parseInt(nodeId));
            }
        }
    }

    // remove the self edge
    if (pathTo.includes(id)) {
        const indexTo = pathTo.indexOf(id);
        const indexFrom = pathFrom.indexOf(id);
        pathTo.splice(indexTo, 1);
        pathFrom.splice(indexFrom, 1);

        const dValue = `M${node.coords.x} ${node.coords.y - SIZE.nodeRadius + 1} A2 4 0 1 1 ${node.coords.x + 0.01} ${node.coords.y - SIZE.nodeRadius + 1}`;
        const selfPath = node.to.find(e => e.node == id);

        // get the svg path
        const selector = `${CONSTANTS.path}_${id}-${id}`;
        const path = document.getElementById(selector);

        // correct the self edge 
        for (let child of path.childNodes) {
            switch (child.tagName) {
                case CONSTANTS.path:
                    child.setAttributeNS(null, "d", dValue);
                    child.setAttributeNS(null, "transform", `rotate(${selfPath.angle}, ${node.coords.x}, ${node.coords.y})`);
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
    correctEdges(pathTo, id, true);
    correctEdges(pathFrom, id, false);
}

function endDrag(evt) {
    if (ACTION.draw) {
        endDrawing(evt)
    }

    ACTION.selectedDragElement = null;
}

function getMousePosition(evt) {
    var CTM = svg.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
    };
}

function correctEdges(pathList, id, to) {
    for (let nodeId of pathList) {
        // get the svg path
        const selector = `${CONSTANTS.path}_${to ? id : nodeId}-${to ? nodeId : id}`;
        const path = document.getElementById(selector);

        // redraw the path
        const startNode = graph[to ? id : nodeId];
        const endNode = graph[to ? nodeId : id];

        const middle = vector.getMiddleOfVector(startNode.coords, endNode.coords);
        const normalVector = vector.getNormalVector(startNode.coords, endNode.coords);
        const otherNode = startNode.to.find(e => e.node == (to ? nodeId : id));
        const dist = otherNode.offset;

        const dValue = `M${startNode.coords.x} ${startNode.coords.y} Q${middle.x + normalVector.x * dist} ${middle.y + normalVector.y * dist} ${endNode.coords.x} ${endNode.coords.y}`;
        const textOffset = otherNode.textOffset;

        for (const child of path.childNodes) {
            if (child.tagName == CONSTANTS.path) {
                child.setAttributeNS(null, "d", dValue);
            }

            // redraw the label
            if (child.tagName == CONSTANTS.text) {
                const normalVector = vector.getNormalVector(startNode.coords, endNode.coords);
                child.setAttributeNS(null, "x", middle.x + normalVector.x * (dist / 2 + textOffset));
                child.setAttributeNS(null, "y", middle.y + normalVector.y * (dist / 2 + textOffset));
            }
        }
    }
}

function correctSelfEdgeText(elem, id) {
    const node = graph[id];
    const path = node.to.find(e => e.node == id);
    const angleVector = vector.getVectorFromAngle(path.angle);
    const dist = path.textOffset;

    elem.setAttributeNS(null, "x", node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist));
    elem.setAttributeNS(null, "y", node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist));
}

function downloadSVG(downloadLink) {
    unselectAll();
    toggleGridView();

    var svgData = document.getElementsByTagName("svg")[0].outerHTML;
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);

    downloadLink.href = svgUrl;
    downloadLink.download = "automaton.svg";
}

function snap(val, step) {
    return Math.round(val / step) * step;
}