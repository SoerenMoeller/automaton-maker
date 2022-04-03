document.addEventListener("DOMContentLoaded", main);

let selectedElement = false;
const NODE_RADIUS = 4;
const START_SHIFT = 7;
const THRESHOLD = 2;
const SELF_EDGE_TEXT_DISTANCE = 13;
const TEXT_THRESHOLD = 3;
let textSize = 2.5;
let subTextSize = 1.5;

let graph = {
    0: {
        desc: "q_1",
        attribute: "start",
        startAngle: 270,
        coords: {
            x: 20,
            y: 20
        },
        to: [
            {
                node: 4,
                desc: "b",
                offset: 0,
                textOffset: -2
            }, 
            {
                node: 1,
                desc: "a",
                offset: 0,
                textOffset: -2
            }
        ]
    },
    1: {
        desc: "q_2",
        attribute: "",
        coords: {
            x: 40,
            y: 20
        },
        to: [
            {
                node: 1,
                desc: "b",
                angle: 0
            },
            {
                node: 2,
                desc: "b",
                offset: 0,
                textOffset: -2
            }
        ]
    },
    2: {
        desc: "q_3",
        attribute: "",
        coords: {
            x: 60,
            y: 20
        },
        to: [
            {
                node: 1,
                desc: "a",
                offset: 0,
                textOffset: -2
            },
            {
                node: 3,
                desc: "a",
                offset: 0,
                textOffset: -2
            }
        ]
    },
    3: {
        desc: "q_4",
        attribute: "end",
        coords: {
            x: 80,
            y: 20
        },
        to: [
            {
                node: 3,
                desc: "a, b",
                angle: 0
            }
        ]
    },
    4: {
        desc: "q_5",
        attribute: "",
        coords: {
            x: 20,
            y: 40
        },
        to: [
            {
                node: 3,
                desc: "a",
                offset: 0,
                textOffset: -2
            }
        ]
    }
}

function main() {
    // find the svg to draw in
    elements = document.getElementsByTagName("svg");
    console.assert(elements.length > 0, "svg not found");
    svg = elements[0]

    buildSVG(svg);
}

/* ========================================== Building svg methods ========================================== */
function buildSVG(svg) {
    // removes content of svg
    svg.innerHTML = "";

    // make the arrowhead
    const defs = getNode("defs", {});
    const marker = getNode("marker", {
        id: "arrow",
        markerWidth: 16,
        markerHeight: 10,
        refX: 16 + 10 * NODE_RADIUS - 1,
        refY: 5,
        orient: "auto"
    });
    const polygon = getNode("polygon", {
        points: "0 0, 16 5, 0 10"
    });
    const markerSelf = getNode("marker", {
        id: "selfarrow",
        markerWidth: 16,
        markerHeight: 16,
        refX: 23,
        refY: -7.5,
        orient: "auto"
    });
    const polygonSelf = getNode("polygon", {
        points: "0 13, 11 0, 10 16"
    });
    marker.appendChild(polygon);
    markerSelf.appendChild(polygonSelf);
    defs.appendChild(marker);
    defs.appendChild(markerSelf);
    svg.appendChild(defs);
    
    // style
    const style = getNode("style", {});
    style.innerHTML = `text {font: italic ${textSize}px sans-serif; user-select: none;} tspan {font: italic ${subTextSize}px sans-serif; user-select: none;}`
    svg.appendChild(style);

    // render the lines first
    for (let node in graph) {
        buildLines(svg, node);
    }
    
    // now render the nodes
    for (let node in graph) {
        buildNode(svg, node);
    }
}

function buildNode(svg, id) {
    let node = graph[id];
    let container = getNode("g", {
        id: `node_${id}`
    });

    // create starting arrow
    if (node.attribute == "start") {
        const startAngle = getVectorFromAngle(node.startAngle);
        const length = NODE_RADIUS + START_SHIFT;
        const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

        // make a thick invis line, to be able to click it nicely
        const startContainer = getNode("g", {
            id: `start_${id}`
        })
        startContainer.appendChild(getNode('path', {
            class: "draggable",
            d: dValue,
            stroke: "transparent",
            stroke_width: 1
        }));
        startContainer.appendChild(getNode('path', {
            class: "draggable",
            d: dValue,
            stroke: "black",
            stroke_width: 0.1,
            marker_end: "url(#arrow)"
        }));

        container.appendChild(startContainer);
    }

    // create the circle
    container.appendChild(getNode("circle", {
        class: "draggable",
        cx: node.coords.x,
        cy: node.coords.y,
        r: NODE_RADIUS,
        stroke: "black",
        stroke_width: 0.1,
        fill: "white"
    }));
    if (node.attribute == "end") {
        container.appendChild(getNode("circle", {
            class: "draggable",
            cx: node.coords.x,
            cy: node.coords.y,
            r: NODE_RADIUS - 0.3,
            stroke: "black",
            stroke_width: 0.1,
            fill: "white"
        }));
    }

    // create the text
    const textNode = getTextNode(node.coords, node.desc, true);
    container.appendChild(textNode);

    svg.appendChild(container);
}

function buildLines(svg, id) {
    let node = graph[id];
    let coords = node.coords;

    for (let otherNode in node.to) {
        let nodeId = node.to[otherNode].node;
        let otherCoords = graph[nodeId].coords;

        const pathContainer = getNode("g", {
            id: `path_${id}-${nodeId}`
        })

        // initially the lines are straight
        let dValue = `M${coords.x} ${coords.y} L${otherCoords.x} ${otherCoords.y}`;

        // self-edge
        if (id == nodeId) {
            dValue = `M${coords.x} ${coords.y - NODE_RADIUS + 1} A2 4 0 1 1 ${coords.x + 0.01} ${coords.y - NODE_RADIUS + 1}`;
        }

        pathContainer.appendChild(getNode('path', {
            d: dValue,
            stroke: "transparent",
            stroke_width: 1,
            fill: "none",
            class: "draggable"
        }));
        pathContainer.appendChild(getNode('path', {
            d: dValue,
            stroke: "black",
            stroke_width: 0.1,
            marker_end: id != nodeId ? "url(#arrow)" : "url(#selfarrow)",
            fill: "none",
            class: "draggable"
        }));

        // append the text in the middle of the node
        if (id != nodeId) {
            const normalVector = getUnitVector(getNormalVector(node.coords, otherCoords));
            const middle = getMiddleOfVector(node.coords, otherCoords);
            const offset = node.to.find(e => e.node == nodeId).textOffset;
            const textCoords = {
                x: middle.x + normalVector.x * offset,
                y: middle.y + normalVector.y * offset
            }

            const textNode = getTextNode(textCoords, node.to[otherNode].desc, true);
            pathContainer.appendChild(textNode);
        } else {
            const path = node.to.find(e => e.node == id);
            const angleVector = getVectorFromAngle(path.angle);
            const textCoords = {
                x: node.coords.x + angleVector.x * SELF_EDGE_TEXT_DISTANCE,
                y: node.coords.y + angleVector.y * SELF_EDGE_TEXT_DISTANCE
            }
            const textNode = getTextNode(textCoords, path.desc, false);

            pathContainer.appendChild(textNode);
        }
        svg.appendChild(pathContainer);
    }
}

function getNode(n, v) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
        n.setAttributeNS(null, p.replace("_", "-"), v[p]);
    }
    return n
}

function getTextNode(position, text, draggable) {
    const parsedText = parseText(text);
    
    let configuration = {
        x: position.x,
        y: position.y,
        text_anchor: "middle",
        alignment_baseline: "central"
    };
    if (draggable) {
        configuration.class = "draggable";
    }

    const textNode = getNode("text", configuration);
    textNode.innerHTML = parsedText.text;

    if (parsedText.sub != "") {
        const subTextNode = getNode("tspan", {
            baseline_shift: "sub",
            dy: "0.5"
        });
        subTextNode.innerHTML = parsedText.sub;
        textNode.appendChild(subTextNode);
    }

    if (parsedText.super != "") {
        // shift back the super text on top of the sub text
        const backShift = -parsedText.sub.length * (subTextSize / 2);
        const superTextNode = getNode("tspan", {
            baseline_shift: "super",
            dx: backShift,
            dy: "0"
        });
        superTextNode.innerHTML = parsedText.super;
        textNode.appendChild(superTextNode);
    }

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

/* ========================================== Dragging logic ========================================== */
function makeDraggable(evt) {
    var svg = evt.target;
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    function startDrag(evt) {
        let elem = evt.target.tagName !== "tspan" ? evt.target : evt.target.parentNode;

        if (elem.classList.contains('draggable')) {
            let parent = elem.parentNode;

            if (elem.tagName == "text" && parent.id.includes("path")) {
                selectedElement = elem;
            } else if (parent && parent.tagName == "g") {
                selectedElement = parent;
            } else {
                console.error("Wrong element clickable");
            }
        }
    }

    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            const coord = getMousePosition(evt);
            let prefix = selectedElement.id.split("_")[0];
            const suffix = selectedElement.id.split("_")[1];

            // if a text is selected, we want to change the offset
            if (selectedElement.tagName === "text") {
                prefix = "text";
            }

            switch (prefix) {
                case "node":
                    dragNode(coord);
                    break;
                case "start":
                    dragStartEdge(coord);
                    break;
                case "path":
                    const nodes = suffix.split("-");
                    if (nodes[0] == nodes[1]) {
                        dragSelfEdge(coord);
                    } else {
                        dragEdge(coord);
                    }
                    break;
                case "text":
                    dragText(coord);
                    break;
                default:
                    console.error("unknown dragging type");
            }
        }
    }

    function dragText(coord) {
        // get the id of the node
        const pathContainer = selectedElement.parentNode;
        const ids = pathContainer.id.split("_")[1];
        const startId = ids.split("-")[0];
        const endId = ids.split("-")[1]; 
        const startNode = graph[startId];
        const endNode = graph[endId];

        const middle = getMiddleOfVector(startNode.coords, endNode.coords);
        const directionVector = { x: endNode.coords.x - startNode.coords.x, y: endNode.coords.y - startNode.coords.y };
        const dot = getDotProduct({ x: coord.x - startNode.coords.x, y: coord.y - startNode.coords.y }, directionVector);
        const length = getLength(directionVector);
        let dist = -dot / length;

        const normalVector = getUnitVector(getNormalVector(startNode.coords, endNode.coords));
        const path = graph[startId].to.find(e => e.node == endId);
        const edgeOffset = path.offset / 2;
        dist -= edgeOffset;
        
        if (dist < TEXT_THRESHOLD && dist > -TEXT_THRESHOLD) {
            path.textOffset = dist;
            selectedElement.setAttributeNS(null, "x", middle.x + normalVector.x * (dist + edgeOffset));
            selectedElement.setAttributeNS(null, "y", middle.y + normalVector.y * (dist + edgeOffset));
        }
    }

    function dragSelfEdge(coord) {
        // get the id of the node
        const ids = selectedElement.id.split("_")[1];
        const nodeId = ids.split("-")[0];
        const node = graph[nodeId];

        const angle = getAngle360Degree(node.coords, coord);
        const selfPath = node.to.find(e => e.node == nodeId);
        selfPath.angle = angle;

        for (let child of selectedElement.childNodes) {
            switch (child.tagName) {
                case "path":
                    child.setAttributeNS(null, "transform", `rotate(${angle}, ${node.coords.x}, ${node.coords.y})`);
                    break;
                case "text":
                    correctSelfEdgeText(child, nodeId);
                    break;
                default:
                    console.error("Unhandled tag found");
            }
        }
    }

    function dragEdge(coord) {
        // get the id of the node
        const ids = selectedElement.id.split("_")[1];
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
        if (dist < THRESHOLD && dist > -THRESHOLD) {
            dist = 0;
        }

        // update the offset in the data
        const entry = startNode.to.find(e => e.node == endId);
        entry.offset = dist;
        const textOffset = startNode.to.find(e => e.node == endId).textOffset;

        const dValue = `M${startNode.coords.x} ${startNode.coords.y} Q${middle.x + normalVector.x * dist} ${middle.y + normalVector.y * dist} ${endNode.coords.x} ${endNode.coords.y}`;
        for (let child of selectedElement.childNodes) {
            if (child.tagName == "path") {
                child.setAttributeNS(null, "d", dValue);
            }

            if (child.tagName == "text") {
                child.setAttributeNS(null, "x", middle.x + normalVector.x * (dist / 2 + textOffset));
                child.setAttributeNS(null, "y", middle.y + normalVector.y * (dist / 2 + textOffset));
            }
        }
    }

    function dragStartEdge(coord) {
        // get the id of the node
        const id = parseInt(selectedElement.id.split("_")[1]);
        const node = graph[id];

        const angle = getAngle360Degree(node.coords, coord);
        node.startAngle = angle;

        // adapt the line
        const startAngle = getVectorFromAngle(angle);
        const length = NODE_RADIUS + START_SHIFT;
        const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;
    
        selectedElement.childNodes[0].setAttributeNS(null, "d", dValue);
        selectedElement.childNodes[1].setAttributeNS(null, "d", dValue);
    }

    function dragNode(coord) {
        // get the id of the node
        const id = parseInt(selectedElement.id.split("_")[1]);
        const node = graph[id];

        // prevent going over the edge
        let freezeX = coord.x > 100 - NODE_RADIUS || coord.x < NODE_RADIUS;
        let freezeY = coord.y > 100 - NODE_RADIUS || coord.y < NODE_RADIUS;

        // prevent overlapping nodes
        let distance = Number.MAX_VALUE;
        for (let nodeId in graph) {
            if (nodeId == id) continue;

            const tmpDistance = Math.sqrt(Math.pow(coord.x - graph[nodeId].coords.x, 2) + Math.pow(coord.y - graph[nodeId].coords.y, 2));
            distance = Math.min(distance, tmpDistance);
        }
        if (freezeX || distance < 2 * NODE_RADIUS) {
            coord.x = graph[id].coords.x;
        }

        if (freezeY || distance < 2 * NODE_RADIUS) {
            coord.y = graph[id].coords.y;
        }

        // move the text and the circle
        for (let child of selectedElement.childNodes) {
            child.setAttributeNS(null, child.tagName == "circle" ? "cx" : "x", coord.x);
            child.setAttributeNS(null, child.tagName == "circle" ? "cy" : "y", coord.y);
        }

        // change the path of start
        if (graph[id].attribute == "start") {
            const selector = `start_${id}`;
            const pathContainer = document.getElementById(selector);

            const startAngle = getVectorFromAngle(node.startAngle);
            const length = NODE_RADIUS + START_SHIFT;
            const dValue = `M${node.coords.x + startAngle.x * length} ${node.coords.y + startAngle.y * length} L${node.coords.x} ${node.coords.y}`;

            pathContainer.childNodes[0].setAttributeNS(null, "d", dValue);
            pathContainer.childNodes[1].setAttributeNS(null, "d", dValue);
        }

        graph[id].coords = coord;
        // get all paths from current node
        const pathTo = [];
        let paths = graph[id].to;
        for (let elem in paths) {
            pathTo.push(paths[elem].node);
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

        console.log(pathTo);
        // remove the self edge
        if (pathTo.includes(id)) {
            const indexTo = pathTo.indexOf(id);
            const indexFrom = pathFrom.indexOf(id);
            pathTo.splice(indexTo, 1);
            pathFrom.splice(indexFrom, 1);

            const dValue = `M${node.coords.x} ${node.coords.y - NODE_RADIUS + 1} A2 4 0 1 1 ${node.coords.x + 0.01} ${node.coords.y - NODE_RADIUS + 1}`;
            const selfPath = node.to.find(e => e.node == id);

            // get the svg path
            const selector = `path_${id}-${id}`;
            const path = document.getElementById(selector);

            // correct the self edge 
            for (let child of path.childNodes) {
                switch (child.tagName) {
                    case "path":
                        child.setAttributeNS(null, "d", dValue);
                        child.setAttributeNS(null, "transform", `rotate(${selfPath.angle}, ${node.coords.x}, ${node.coords.y})`);  
                        break;
                    case "text":
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
        selectedElement = null;
    }

    function getMousePosition(evt) {
        var CTM = svg.getScreenCTM();
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }
}

function correctEdges(pathList, id, to) {
    for (let nodeId of pathList) {
        // get the svg path
        const selector = `path_${to ? id : nodeId}-${to ? nodeId : id}`;
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
            if (child.tagName == "path") {
                child.setAttributeNS(null, "d", dValue);
            }
            
            // redraw the label
            if (child.tagName == "text") {
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

    elem.setAttributeNS(null, "x", node.coords.x + angleVector.x * SELF_EDGE_TEXT_DISTANCE);
    elem.setAttributeNS(null, "y", node.coords.y + angleVector.y * SELF_EDGE_TEXT_DISTANCE);
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
    const vector = {x: position.x - baseVector.x, y: position.y - baseVector.y};
    const angle = getVectorAngle(vector, {x: 1, y: 0});
    let angleDegree = angle * (180 / Math.PI);
    const dot = getDotProduct(vector, {x: 0, y: 1});
    
    // correct the left side of the circle
    if (dot < 0) {
        angleDegree = (360 - angleDegree);
    }

    return angleDegree;
}

function getVectorFromAngle(angle) {
    const angleBase = {x: 0, y: -1};

    const radiantAngle = (360 - angle) * (Math.PI / 180);
    const vector = {
        x: angleBase.x * Math.cos(radiantAngle) + angleBase.y * Math.sin(radiantAngle),
        y: angleBase.y * Math.cos(radiantAngle) - angleBase.x * Math.sin(radiantAngle)
    }
    
    return getUnitVector(vector);
}

function downloadSVG() {
    var svgData = document.getElementsByTagName("svg")[0].outerHTML;
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.getElementsByTagName("a")[0];
    downloadLink.href = svgUrl;
    downloadLink.download = "test.svg";
}