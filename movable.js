import { convertToLaTeX } from './converter.js';

document.addEventListener("DOMContentLoaded", main);

const COLOR = {
    black: "black",
    grid: "rgba(224, 128, 31, 0.3)",
    marked: "#34ebeb",
    transparent: "transparent"
}

const THRESHOLDS = {
    straightEdge: 2,
    angle: 15
};

const DISTANCE = {
    selfEdgeText: 13,
    startEdge: 7
};

const SIZE = {
    text: 2.5,
    subText: 1.5,
    nodeRadius: 4,
    grid: 4
};

const KEYS = {
    control: false
}

const ACTION = {
    draw: false,
    selectedDragElement: null,
    selectedElement: null,
    drawStartNodeId: -1,
    typing: false,
    showGrid: false
}

const CONSTANTS = {
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

// used to give every element an unique id
let highestId = 0;
let graph = {
    0: {
        desc: "q_0",
        attributes: ["start"],
        startAngle: 300,
        to: [
            {
                node: 0,
                desc: "a",
                textOffset: -2,
                angle: 45
            },
            {
                node: 1, 
                desc: "b",
                textOffset: -2,
                offset: 5
            }
        ],
        coords: {
            x: 20,
            y: 20
        }
    },
    1: {
        desc: "q^1",
        attributes: ["end"],
        to: [],
        coords: {
            x: 40,
            y: 25
        }
    }
};
let svg;

function main() {
    // find the svg to draw in
    svg = document.getElementsByTagName("svg")[0];
    svg.addEventListener("load", makeDraggable);

    // init the svg
    buildSVG();

    // fix reset width
    const resetImg = document.getElementsByTagName("img")[0];
    resetImg.style.width = resetImg.height + "px";

    document.addEventListener("keydown", handleKeyEvent);
    document.addEventListener("keyup", handleKeyUpEvent);

    const resetButton = document.getElementById("resetContainer");
    const downloadButton = document.getElementsByTagName("a")[0];
    const addButton = document.getElementById("addButton");
    const convertButton = document.getElementById("convertButton");
    resetButton.addEventListener("click", e => resetAll());
    downloadButton.addEventListener("click", e => downloadSVG(downloadButton));
    addButton.addEventListener("click", e => addNode());
    convertButton.addEventListener("click", e => convertToLaTeX(graph));
}

function resetAll() {
    ACTION.showGrid = false;
    unselectAll();
    graph = {};
    resetSVG();
}

function handleKeyUpEvent(event) {
    KEYS.control = false;
}

function handleKeyEvent(event) {
    if (!event.code) return;

    if (ACTION.typing && event.code != "Escape") return;

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

function toggleGridView() {
    ACTION.showGrid = !ACTION.showGrid;
    const gridContainer = document.getElementById("gridContainer");
    const color = ACTION.showGrid ? COLOR.grid : COLOR.transparent;
    
    for (let child of gridContainer.childNodes) {
        child.setAttributeNS(null, CONSTANTS.stroke, color);
    }
}

function showEdgeConfiguration(ids) {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = createRemoveButton(container, "remove");
    const textDescriptionContainer = createDescriptionContainer(container);
    const textDescription = textDescriptionContainer.childNodes[1];
    
    // fill with existing data
    const node = graph[ids.from];
    const path = node.to.find(e => e.node == ids.to);
    textDescription.value = path.desc;

    // add events for change 
    removeButton.addEventListener("click", evt => removeElement());
    textDescription.addEventListener("focusin", evt => ACTION.typing = true);
    textDescription.addEventListener("focusout", evt => ACTION.typing = false);
    textDescription.addEventListener("input", evt => {
        evt.preventDefault();
        path.desc = textDescription.value;

        buildSVG();
    });
}

function showNodeConfiguration(nodeId) {
    const container = resetConfigurationView();

    // create the elements
    const removeButton = createRemoveButton(container, "remove");
    const checkBoxEndContainer = createCheckBoxContainer(container, CONSTANTS.end);
    const checkBoxStartContainer = createCheckBoxContainer(container, CONSTANTS.start);
    const textDescriptionContainer = createDescriptionContainer(container);

    const checkBoxEnd = checkBoxEndContainer.childNodes[1];
    const checkBoxStart = checkBoxStartContainer.childNodes[1];
    const textDescription = textDescriptionContainer.childNodes[1];

    // fill with existing data
    const node = graph[nodeId];
    checkBoxEnd.checked = node.attributes.includes(CONSTANTS.end);
    checkBoxStart.checked = node.attributes.includes(CONSTANTS.start);
    textDescription.value = node.desc;

    // add events for change 
    removeButton.addEventListener("click", evt => removeElement());
    checkBoxEnd.addEventListener("click", evt => toggleEndNode(false));
    checkBoxStart.addEventListener("click", evt => toggleStartNode(false));
    textDescription.addEventListener("focusin", evt => ACTION.typing = true);
    textDescription.addEventListener("focusout", evt => ACTION.typing = false);
    textDescription.addEventListener("input", evt => {
        evt.preventDefault();
        const nodeId = getIdOfNode(ACTION.selectedElement);
        const node = graph[nodeId];

        node.desc = textDescription.value;
        buildSVG();
    });
}

function createRemoveButton(parent, text) {
    const button = createDOMElement(parent, "button", { id: "removeButton" });
    button.innerText = text;

    return button;
}

function resetConfigurationView() {
    const container = document.getElementsByClassName("flow-right")[0];
    container.innerHTML = "";

    return container;
}

function createDOMElement(parent, name, attributes = {}) {
    const element = document.createElement(name);

    for (let attr in attributes) {
        element.setAttribute(attr, attributes[attr]);
    }

    parent.appendChild(element);
    return element
}

function createInputForm(parent, type, id) {
    return createDOMElement(parent, "input", {
        type: type,
        id: id,
        name: id
    });
}

function createDescriptionContainer(parent) {
    const container = createContainerWithText(parent, "Description");

    createInputForm(container, CONSTANTS.text, "descriptionTextInput");

    return container;
}

function createCheckBoxContainer(parent, text) {
    const upperCaseText = text[0].toUpperCase() + text.substring(1)
    const container = createContainerWithText(parent, upperCaseText);

    createInputForm(container, "checkbox", text + "CheckBox");

    return container;
}

function createContainerWithText(parent, text) {
    const container = createDOMElement(parent, "div", { class: "flex-container" });

    const textElement = createDOMElement(container, "p");
    textElement.innerText = text;

    return container;
}

function toggleEndNode(changeView) {
    if (!ACTION.selectedElement || ACTION.selectedElement.id.split("_")[0] != CONSTANTS.node) return;

    const nodeId = ACTION.selectedElement.id.split("_")[1];
    const node = graph[nodeId];
    const removeEnd = node.attributes.includes(CONSTANTS.end);

    if (changeView) {
        const checkBox = document.getElementById("endCheckBox");
        checkBox.checked = !removeEnd;
    }

    if (removeEnd) {
        delete node.attributes[node.attributes.indexOf(CONSTANTS.end)];
    } else {
        node.attributes.push(CONSTANTS.end);
    }

    buildSVG();
}

function toggleStartNode(changeView) {
    if (!ACTION.selectedElement || ACTION.selectedElement.id.split("_")[0] != CONSTANTS.node) return;

    const nodeId = ACTION.selectedElement.id.split("_")[1];
    const node = graph[nodeId];
    const removeStart = node.attributes.includes(CONSTANTS.start);

    if (changeView) {
        const checkBox = document.getElementById("startCheckBox");
        checkBox.checked = !removeStart;
    }

    if (removeStart) {
        delete node.attributes[node.attributes.indexOf(CONSTANTS.start)];
        delete node.startAngle;
    } else {
        node.attributes.push(CONSTANTS.start);
        node.startAngle = 270;
    }

    buildSVG();
}

function addNode() {
    let node = {
        desc: "",
        attributes: [],
        coords: {
            x: 10,
            y: 10
        },
        to: []
    }

    graph[highestId++] = node;

    buildSVG();

    // highlight the node after builing it
    selectNodeById(highestId - 1);
}

function selectNodeById(nodeId) {
    const nodeElem = getNodeElemById(nodeId);

    selectNode(nodeElem);
}

function getNodeElemById(nodeId) {
    const selector = `${CONSTANTS.node}_${nodeId}`;
    const nodeElem = document.getElementById(selector);

    console.assert(nodeElem, "Couldn't find node");

    return nodeElem;
}

function getPathElemByIds(fromId, toId) {
    const selector = `${CONSTANTS.path}_${fromId}-${toId}`;
    const nodeElem = document.getElementById(selector);

    console.assert(nodeElem, "Couldn't find path");

    return nodeElem;
}

function removeElement() {
    if (!ACTION.selectedElement) return;

    const name = getIdPrefix(ACTION.selectedElement);
    switch (name) {
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
    let to = graph[ids.from].to;
    graph[ids.from].to = to.filter(e => e.node != ids.to);

    // remove from view
    ACTION.selectedElement.parentNode.removeChild(ACTION.selectedElement);
    unselectAll();
}

function removeNode() {
    const nodeId = getIdOfNode(ACTION.selectedElement);

    // fetch edges related to the node
    let edgeFrom = getEdgesFromNode(nodeId);
    const edgeTo = getEdgesToNode(nodeId);

    // remove self path from one of the to avoid double deleting it
    edgeFrom = edgeFrom.filter(e => e != nodeId);

    removePathFromView(edgeFrom, nodeId, true);
    removePathFromView(edgeTo, nodeId, false);

    // remove edges from logic
    removeEdgesToNode(nodeId);

    // remove node from logic
    delete graph[nodeId];

    // remove from view
    ACTION.selectedElement.parentNode.removeChild(ACTION.selectedElement);
}

function removePathFromView(edges, id, to) {
    for (let nodeId of edges) {
        const fromId = to ? id : nodeId;
        const toId = to ? nodeId : id;

        const selector = `${CONSTANTS.path}_${fromId}-${toId}`;
        const path = document.getElementById(selector);

        path.parentNode.removeChild(path);
    }
}

function unselectAll() {
    ACTION.selectedElement = null;
    ACTION.typing = false;

    resetConfigurationView();

    // unmark all nodes
    for (let nodeId in graph) {
        setNodeColor(nodeId);
    }

    for (let fromId in graph) {
        for (let toId in graph) {
            setPathColor(fromId, toId);
        }
    }
}

function resetSVG() {
    const svg = document.getElementsByTagName("svg")[0];
    svg.innerHTML = "";

    // make the arrowheads
    const defs = createSVGElement(CONSTANTS.defs);
    const selfPolygon = "0 13, 11 0, 10 16";
    const polygon = "0 0, 16 5, 0 10";
    createMarker(defs, CONSTANTS.arrow, 16, 10, 16 + 10 * SIZE.nodeRadius - 1, 5, COLOR.black, polygon);
    createMarker(defs, CONSTANTS.arrowSelected, 16, 10, 16 + 10 * SIZE.nodeRadius - 1, 5, COLOR.marked, polygon);
    createMarker(defs, CONSTANTS.selfarrow, 16, 16, 23, -7.5, COLOR.black, selfPolygon);
    createMarker(defs, CONSTANTS.selfarrowSelected, 16, 16, 23, -7.5, COLOR.marked, selfPolygon);
    createMarker(defs, CONSTANTS.defaultMarker, 16, 10, 16, 5, COLOR.marked, polygon);
    svg.appendChild(defs);

    // style
    const style = createSVGElement(CONSTANTS.style);
    style.innerHTML = `text {font: italic ${SIZE.text}px sans-serif; user-select: none;} tspan {font: italic ${SIZE.subText}px sans-serif; user-select: none;}`
    svg.appendChild(style);

    // add default path for later usage
    createPath(svg, CONSTANTS.defaultPath, "", 0.1, CONSTANTS.defaultMarker, COLOR.marked);

    // make a grid for visible layout
    initGrid()
}

function initGrid() {
    const container = createContainer(svg, "gridContainer");
    const color = ACTION.showGrid ? COLOR.grid : COLOR.transparent;

    for (let i = 0; i <= 100; i += SIZE.grid) {
        const dValueRow = `M0 ${i} L100 ${i}`;
        createPath(container, "", dValueRow, 0.1, "", color);

        const dValueCol = `M${i} 0 L${i} 100`;
        createPath(container, "", dValueCol, 0.1, "", color);
    }
}

function createMarker(parent, id, width, height, refX, refY, color, polygonPoints) {
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

function createPath(parent, id, dValue, stroke_width, marker, color, draggable=false) {
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

function createCircle(parent, coords, radius) {
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

function createContainer(parent, id) {
    const container = createSVGElement(CONSTANTS.g, {
        id: id
    });

    parent.appendChild(container);
    return container;
}

/* ========================================== Building svg methods ========================================== */
function buildSVG() {
    resetSVG();

    // render the lines first
    for (let node in graph) {
        buildLines(node);
    }

    // now render the nodes
    for (let node in graph) {
        buildNode(node);
    }

    reselect();
}

function buildNode(id) {
    const node = graph[id];
    const container = createContainer(svg, `${CONSTANTS.node}_${id}`)

    // create starting arrow
    if (node.attributes.includes(CONSTANTS.start)) {
        const startAngle = getVectorFromAngle(node.startAngle);
        const length = SIZE.nodeRadius + DISTANCE.startEdge;
        const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

        // make a thick invis line, to be able to click it nicely
        const startContainer = createContainer(container, `${CONSTANTS.start}_${id}`);
        createPath(startContainer, "", dValue, 1, "", COLOR.transparent, true);
        createPath(startContainer, "", dValue, 0.1, CONSTANTS.arrow, COLOR.black, true);
    }

    // create the circle
    createCircle(container, node.coords, SIZE.nodeRadius);

    if (node.attributes.includes(CONSTANTS.end)) {
        createCircle(container, node.coords, SIZE.nodeRadius - 0.3);
    }

    // create the text
    createTextNode(container, node.coords, node.desc, true);
}

function buildLines(id) {
    let node = graph[id];
    let coords = node.coords;

    for (let otherNode in node.to) {
        let nodeId = node.to[otherNode].node;
        let otherCoords = graph[nodeId].coords;

        const pathContainer = createContainer(svg, `${CONSTANTS.path}_${id}-${nodeId}`);

        // create line
        const middle = getMiddleOfVector(coords, otherCoords);
        const normalVector = getUnitVector(getNormalVector(coords, otherCoords));
        const dist = node.to[otherNode].offset;
        let dValue = `M${coords.x} ${coords.y} Q${middle.x + normalVector.x * dist} ${middle.y + normalVector.y * dist} ${otherCoords.x} ${otherCoords.y}`;

        // self-edge
        if (id == nodeId) {
            dValue = `M${coords.x} ${coords.y - SIZE.nodeRadius + 1} A2 4 0 1 1 ${coords.x + 0.01} ${coords.y - SIZE.nodeRadius + 1}`;
        }

        const markerEnd = id != nodeId ? CONSTANTS.arrow : CONSTANTS.selfarrow;
        const outerPath = createPath(pathContainer, "", dValue, 1, "", COLOR.transparent, true);
        const innerPath = createPath(pathContainer, "", dValue, 0.1, markerEnd, COLOR.black, true);

        if (id == nodeId) {
            const path = node.to.find(e => e.node == id);
            outerPath.setAttributeNS(null, "transform", `rotate(${path.angle}, ${node.coords.x}, ${node.coords.y})`);
            innerPath.setAttributeNS(null, "transform", `rotate(${path.angle}, ${node.coords.x}, ${node.coords.y})`);
        }

        // append the text in the middle of the node
        if (id != nodeId) {
            const normalVector = getUnitVector(getNormalVector(node.coords, otherCoords));
            const middle = getMiddleOfVector(node.coords, otherCoords);
            const offset = node.to.find(e => e.node == nodeId).textOffset;
            const textCoords = {
                x: middle.x + normalVector.x * (dist / 2 + offset),
                y: middle.y + normalVector.y * (dist / 2 + offset)
            }
            createTextNode(pathContainer, textCoords, node.to[otherNode].desc, true);
        } else {
            const path = node.to.find(e => e.node == id);
            const angleVector = getVectorFromAngle(path.angle);

            const textCoords = {
                x: node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - path.textOffset),
                y: node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - path.textOffset)
            }
            createTextNode(pathContainer, textCoords, path.desc, true);
        }
    }
}

function createSVGElement(n, v = {}) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace("_", "-"), v[p]);
    }
    return n
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

function parseText(input) {
    let result = {
        text: "",
        sub: "",
        super: ""
    };

    const subSplit = input.split("_");
    const superSplit = input.split("^");

    if (subSplit.length === 1 && superSplit.length === 1) {
        result.text = subSplit[0];
    } else if (subSplit.length !== 1 && superSplit.length === 1) {
        result.text = subSplit[0];
        result.sub = subSplit[1];
    } else if (subSplit.length === 1 && superSplit.length !== 1) {
        result.text = superSplit[0];
        result.super = superSplit[1];
    } else {
        result.text = subSplit[0];
        result.sub = subSplit[1].split("^")[0];
        result.super = superSplit[1];
    }

    return result;
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

function selectEdge(elem) {
    unselectAll();

    // select the node
    ACTION.selectedElement = elem;

    // mark selected node
    const ids = getIdsOfPath(elem);
    setPathColor(ids.from, ids.to, COLOR.marked);

    showEdgeConfiguration(ids);
}

function selectNode(elem) {
    unselectAll();

    // select the node
    ACTION.selectedElement = elem;

    // mark selected node
    const nodeId = getIdOfNode(elem);
    setNodeColor(nodeId, COLOR.marked);

    if (KEYS.control) {
        startDrawing(nodeId);
    }

    // show view elements
    showNodeConfiguration(nodeId);
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

function startDrawing(nodeId) {
    unselectAll();

    ACTION.draw = true;
    ACTION.drawStartNodeId = nodeId;
}

function endDrawing(event) {
    // mount the path if on another node (or else throw it away)
    const coord = getMousePosition(event);
    const node = graph[ACTION.drawStartNodeId];

    for (let nodeId in graph) {
        // check if distance is low enough
        if (getDistance(coord, graph[nodeId].coords) > SIZE.nodeRadius) continue;

        // check if there is no existing edge yet
        const existentEdge = node.to.find(e => e.node == nodeId);
        if (existentEdge) continue;

        const newEdge = {
            node: parseInt(nodeId),
            desc: "",
            textOffset: -2
        }

        // check if self edge or normal edge
        if (ACTION.drawStartNodeId === nodeId) {
            newEdge.angle = 0;
        } else {
            newEdge.offset = 0;
        }

        // add the edge to the logic
        node.to.push(newEdge);
        buildSVG();

        // highlight the edge
        const selector = `${CONSTANTS.path}_${ACTION.drawStartNodeId}-${nodeId}`;
        const path = document.getElementById(selector);
        selectEdge(path);
        break;
    }

    const defaultPath = document.getElementById(CONSTANTS.defaultPath);
    defaultPath.setAttributeNS(null, "d", "")

    ACTION.draw = false;
    ACTION.drawStartNodeId = -1;
}

function getIdPrefix(elem) {
    return elem.id.split("_")[0];
}

function getIdOfNode(node) {
    return node.id.split("_")[1];
}

function getIdsOfPath(path) {
    const ids = path.id.split("_")[1].split("-");
    return { from: ids[0], to: ids[1] };
}

/* ========================================== Dragging logic ========================================== */
function makeDraggable(evt) {
    var svg = evt.target;
    svg.addEventListener('mousedown', mouseDown);
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mousemove', draw);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    function mouseDown(evt) {
        // check if node is selected
        const target = evt.target;
        const id = target.parentNode.id;
        const prefix = id.split("_")[0];
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

            if (elem.tagName == CONSTANTS.text && parent.id.includes(CONSTANTS.path)) {
                ACTION.selectedDragElement = elem;
            } else if (parent && parent.tagName == CONSTANTS.g) {
                ACTION.selectedDragElement = parent;
            } else {
                console.error("Wrong element clickable");
            }
        }
    }

    function draw(evt) {
        if (!ACTION.draw) return;

        evt.preventDefault();
        const coord = getMousePosition(evt);
        const node = graph[ACTION.drawStartNodeId];
        const startCoords = node.coords;

        const defaultPath = document.getElementById(CONSTANTS.defaultPath);
        const dValue = `M${startCoords.x} ${startCoords.y} L${coord.x} ${coord.y}`;

        defaultPath.setAttributeNS(null, "d", dValue);
    }

    function drag(evt) {
        if (!ACTION.selectedDragElement || ACTION.draw) return;

        evt.preventDefault();
        const coord = getMousePosition(evt);
        let prefix = ACTION.selectedDragElement.id.split("_")[0];
        const suffix = ACTION.selectedDragElement.id.split("_")[1];

        // if a text is selected, we want to change the offset
        if (ACTION.selectedDragElement.tagName === CONSTANTS.text) {
            prefix = CONSTANTS.text;
        }

        switch (prefix) {
            case CONSTANTS.node:
                dragNode(coord);
                break;
            case CONSTANTS.start:
                dragStartEdge(coord);
                break;
            case CONSTANTS.path:
                const nodes = suffix.split("-");
                if (nodes[0] == nodes[1]) {
                    dragSelfEdge(coord);
                } else {
                    dragEdge(coord);
                }
                break;
            case CONSTANTS.text:
                dragText(coord);
                break;
            default:
                console.error("unknown dragging type");
        }
    }

    function dragText(coord) {
        // get the id of the node
        const pathContainer = ACTION.selectedDragElement.parentNode;
        const ids = getIdsOfPath(pathContainer);
        const startId = ids.from;
        const endId = ids.to;
        const startNode = graph[startId];
        const endNode = graph[endId];

        const middle = getMiddleOfVector(startNode.coords, endNode.coords);
        const directionVector = { x: endNode.coords.x - startNode.coords.x, y: endNode.coords.y - startNode.coords.y };
        let dot = getDotProduct({ x: coord.x - startNode.coords.x, y: coord.y - startNode.coords.y }, directionVector);
        let length = getLength(directionVector);
        let dist = -dot / length;

        const normalVector = getUnitVector(getNormalVector(startNode.coords, endNode.coords));
        const path = graph[startId].to.find(e => e.node == endId);
        const edgeOffset = path.offset / 2;
        dist -= edgeOffset;

        // handle self edge text
        if (startId === endId) {
            const angleVector = getVectorFromAngle(path.angle);
            const basePosition = {x: startNode.coords.x + angleVector.x * DISTANCE.selfEdgeText, y: startNode.coords.y + angleVector.y * DISTANCE.selfEdgeText };
            const normalAngle = getNormalVector(startNode.coords, basePosition);

            dot = getDotProduct({ x: coord.x - basePosition.x, y: coord.y - basePosition.y }, normalAngle);
            length = getLength(normalAngle);
            dist = -dot / length;
            path.textOffset = dist;

            ACTION.selectedDragElement.setAttributeNS(null, "x", startNode.coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist));
            ACTION.selectedDragElement.setAttributeNS(null, "y", startNode.coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist));

            return;
        } 

        path.textOffset = dist;
        ACTION.selectedDragElement.setAttributeNS(null, "x", middle.x + normalVector.x * (dist + edgeOffset));
        ACTION.selectedDragElement.setAttributeNS(null, "y", middle.y + normalVector.y * (dist + edgeOffset));
    }

    function dragSelfEdge(coord) {
        // get the id of the node
        const ids = ACTION.selectedDragElement.id.split("_")[1];
        const nodeId = ids.split("-")[0];
        const node = graph[nodeId];

        let angle = getAngle360Degree(node.coords, coord);
        if (ACTION.showGrid) {
            angle = getClosestStep(angle, 360, THRESHOLDS.angle);
        }
        const selfPath = node.to.find(e => e.node == nodeId);
        selfPath.angle = angle;

        for (let child of ACTION.selectedDragElement.childNodes) {
            switch (child.tagName) {
                case CONSTANTS.path:
                    child.setAttributeNS(null, "transform", `rotate(${angle}, ${node.coords.x}, ${node.coords.y})`);
                    break;
                case CONSTANTS.text:
                    correctSelfEdgeText(child, nodeId);
                    break;
                default:
                    console.error("Unhandled tag found");
            }
        }
    }

    function dragEdge(coord) {
        // get the id of the node
        const ids = ACTION.selectedDragElement.id.split("_")[1];
        const startId = ids.split("-")[0];
        const endId = ids.split("-")[1];

        // get the coords of the nodes
        const startNode = graph[startId];
        const endNode = graph[endId];
        const middle = getMiddleOfVector(startNode.coords, endNode.coords);

        const normalVector = getUnitVector(getNormalVector(startNode.coords, endNode.coords));

        // determine distance to mouse 
        const directionVector = { x: endNode.coords.x - startNode.coords.x, y: endNode.coords.y - startNode.coords.y };
        const dot = getDotProduct({ x: coord.x - startNode.coords.x, y: coord.y - startNode.coords.y }, directionVector);
        const length = getLength(directionVector);
        let dist = -2 * dot / length;
        if (dist < THRESHOLDS.straightEdge && dist > -THRESHOLDS.straightEdge) {
            dist = 0;
        }
        if (ACTION.showGrid) {
            dist = getClosestStep(dist, 100, SIZE.grid);
        }

        // update the offset in the data
        const entry = startNode.to.find(e => e.node == endId);
        entry.offset = dist;
        const textOffset = startNode.to.find(e => e.node == endId).textOffset;

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

        let angle = getAngle360Degree(node.coords, coord);
        if (ACTION.showGrid) {
            angle = getClosestStep(angle, 360, THRESHOLDS.angle);
        }
        node.startAngle = angle;

        // adapt the line
        const startAngle = getVectorFromAngle(angle);
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

            const startAngle = getVectorFromAngle(node.startAngle);
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

        const middle = getMiddleOfVector(startNode.coords, endNode.coords);
        const normalVector = getUnitVector(getNormalVector(startNode.coords, endNode.coords));
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
                const normalVector = getUnitVector(getNormalVector(startNode.coords, endNode.coords));
                child.setAttributeNS(null, "x", middle.x + normalVector.x * (dist / 2 + textOffset));
                child.setAttributeNS(null, "y", middle.y + normalVector.y * (dist / 2 + textOffset));
            }
        }
    }
}

function correctSelfEdgeText(elem, id) {
    const node = graph[id];
    const path = node.to.find(e => e.node == id);
    const angleVector = getVectorFromAngle(path.angle);
    const dist = path.textOffset;

    elem.setAttributeNS(null, "x", node.coords.x + angleVector.x * (DISTANCE.selfEdgeText - dist));
    elem.setAttributeNS(null, "y", node.coords.y + angleVector.y * (DISTANCE.selfEdgeText - dist));
}

/* ========================================== Vector methods ========================================== */

function getLength(vector) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

function getDistance(vectorA, vectorB) {
    return Math.sqrt(Math.pow(vectorB.x - vectorA.x, 2) + Math.pow(vectorB.y - vectorA.y, 2));
}

function getDotProduct(vectorA, vectorB) {
    return vectorA.x * vectorB.y - vectorB.x * vectorA.y;
}
function getNormalVector(vectorA, vectorB) {
    return {
        x: -(vectorB.y - vectorA.y),
        y: vectorB.x - vectorA.x
    }
}

function getUnitVector(vector) {
    const length = getLength(vector);
    return {
        x: vector.x / length,
        y: vector.y / length,
    }
}

function getMiddleOfVector(vectorA, vectorB) {
    return {
        x: (vectorA.x + vectorB.x) / 2,
        y: (vectorA.y + vectorB.y) / 2
    }
}

function getVectorAngle(vectorA, vectorB) {
    const dot = getDotProduct(vectorA, vectorB);
    const lengthA = getLength(vectorA);
    const lengthB = getLength(vectorB);

    return Math.acos(dot / (lengthA * lengthB));
}

function getAngle360Degree(baseVector, position) {
    const vector = { x: position.x - baseVector.x, y: position.y - baseVector.y };
    const angle = getVectorAngle(vector, { x: 1, y: 0 });
    let angleDegree = angle * (180 / Math.PI);
    const dot = getDotProduct(vector, { x: 0, y: 1 });

    // correct the left side of the circle
    if (dot < 0) {
        angleDegree = (360 - angleDegree);
    }

    return angleDegree;
}

function getVectorFromAngle(angle) {
    const angleBase = { x: 0, y: -1 };

    const radiantAngle = (360 - angle) * (Math.PI / 180);
    const vector = {
        x: angleBase.x * Math.cos(radiantAngle) + angleBase.y * Math.sin(radiantAngle),
        y: angleBase.y * Math.cos(radiantAngle) - angleBase.x * Math.sin(radiantAngle)
    }

    return getUnitVector(vector);
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

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function getEdgesFromNode(id) {
    return graph[id].to.map(e => e.node);
}

function getEdgesToNode(id) {
    const edges = [];
    for (let nodeId in graph) {
        let to = graph[nodeId].to;
        for (let otherNode in to) {
            let otherId = to[otherNode].node;
            if (otherId == id) {
                edges.push(parseInt(nodeId));
            }
        }
    }

    return edges;
}

function removeEdgesToNode(id) {
    for (let nodeId in graph) {
        graph[nodeId].to = graph[nodeId].to.filter(e => e.node != id)
    }
}

function getClosestStep(val, end, step) {
    const negative = val < 0;
    val = Math.abs(val);
    let dist = Number.MAX_VALUE;
    let newValue;
    for (let i = 0; i <= end; i += step) {
        if (Math.abs(val - i) < dist) {
            dist = Math.abs(val - i);
            newValue = i;
        }
    }

    return negative ? -newValue : newValue;
}