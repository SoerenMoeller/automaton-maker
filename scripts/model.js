import { CONSTANTS } from './constants.js';
import { parseInputToArray } from "./converter.js";

"use strict";

let graph = {};
let count = 0;

export function reset() {
    graph = {};
    count = 0;
}

// for debugging (injecting graph)
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
        desc: [],
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
    const existentEdge = getEdge(fromId, toId);
    if (existentEdge) return -1;

    const edge = {
        node: parseInt(toId),
        desc: [],
        textOffset: -2
    }

    // check if self edge or normal edge
    if (fromId === toId) {
        edge.angle = 0;
    } else {
        edge.offset = 0;
    }

    getNode(fromId).to.push(edge);
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
    const edgesTo = Object.keys(graph).filter(nodeId => getEdge(nodeId, id)).map(e => parseInt(e));
    const edgesFrom = getNode(id).to.map(e => e.node).filter(e => e !== id);

    return {
        to: edgesTo,
        from: edgesFrom
    };
}

export function getEdge(fromId, toId) {
    const path = getNode(fromId).to.find(e => e.node === toId);

    return path;
}

export function setEdgeDescription(fromId, toId, data) {
    const path = getEdge(fromId, toId);
    path.desc = parseInputToArray(data);
}

export function setNodeDescription(nodeId, data) {
    getNode(nodeId).desc = parseInputToArray(data);
}

export function getNodeDescription(nodeId) {
    const node = getNode(nodeId);

    return node.desc; 
}

export function getEdgeDescription(fromId, toId) {
    const edge = getEdge(fromId, toId);

    return edge.desc; 
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

export function getStartAngle(nodeId) {
    return getNode(nodeId).startAngle;
}

export function toggleNodeAttribute(nodeId, attribute) {
    const node = getNode(nodeId);
    const add = (attribute === CONSTANTS.start) ? isNodeStart(nodeId) : isNodeEnd(nodeId);

    if (add) {
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
    getEdge(nodeId, nodeId).angle = angle;
}

export function setStartAngle(nodeId, angle) {
    getNode(nodeId).startAngle = angle;
}

export function setCoords(nodeId, coords) {
    getNode(nodeId).coords = coords;
}

export function hasSelfEdge(nodeId) {
    return getEdgesInvolvingNode(nodeId).to.includes(nodeId);
}