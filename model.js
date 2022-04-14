import { CONSTANTS } from "./movable";

let graph = {};
let count = 0;

export function reset() {
    graph = {};
    count = 0;
}

export function setGraph(newGraph) {
    graph = newGraph;
}

export function getGraph() {
    return graph;
}

export function getNode(id) {
    return graph[id];
}

export function getCoords(id) {
    return getNode(id).coords;
}

export function addNode() {
    let node = {
        desc: "",
        attributes: [],
        coords: {
            x: 10,
            y: 10
        },
        to: []
    }

    graph[count++] = node;

    return count - 1;
}

export function addEdge(fromId, toId) {
    // check if there is no existing edge yet
    const existentEdge = node.to.find(e => e.node == toId);
    if (existentEdge) return -1;

    const edge = {
        node: parseInt(toId),
        desc: "",
        textOffset: -2
    }

    // check if self edge or normal edge
    if (fromId === toId) {
        edge.angle = 0;
    } else {
        edge.offset = 0;
    }

    node.to.push(edge);
}

export function removeNode(id) {
    removeEdges(id);
    delete graph[id];
}

function removeEdges(id) {
    for (let nodeId in graph) {
        removeEdge(nodeId, id);
    }
}

export function removeEdge(fromId, toId) {
    graph[fromId].to = graph[fromId].to.filter(e => e.node != toId);
}

export function getEdgesInvolvingNode(id) {
    const edgesTo = [];
    for (let nodeId in graph) {
        let to = graph[nodeId].to;
        edges.concat(to.filter(e => to[e].node == id));
    }

    // avoid having self edges in both
    const edgesFrom = graph[id].to.map(e => e.node);

    return {
        to: edgesTo,
        from: edgesFrom
    };
}

export function getEdge(fromId, toId) {
    const node = graph[fromId];
    const path = node.to.find(e => e.node == toId);

    return path;
}

export function setEdgeDescription(fromId, toId, data) {
    const path = getEdge(fromId, toId);
    path.desc = data;
}

export function getNodeDescription(nodeId) {
    const node = getNode(nodeId);

    return node.desc; 
}

export function isNodeEnd(nodeId) {
    return getNode(nodeId).attributes.includes(CONSTANTS.end);
}

export function isNodeStart(nodeId) {
    return getNode(nodeId).attributes.includes(CONSTANTS.start);
}

export function setNodeDecription(nodeId, data) {
    getNode(nodeId).desc = data;
}

export function toggleNodeAttribute(nodeId, attribute) {
    const node = getNode(nodeId);
    const isEnd = isNodeEnd(nodeId);

    if (isEnd) {
        delete node.attributes[node.attributes.indexOf(attribute)];

        if (attribute === CONSTANTS.start) {
            delete node.startAngle;
        }
    } else {
        node.attributes.push(attribute);

        if (attribute === CONSTANTS.start) {
            node.startAngle = 270;
        }
    }
}

export function setEdgeAngle(nodeId, angle) {
    model.getEdge(nodeId, nodeId).angle = angle;
}