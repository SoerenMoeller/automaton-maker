let graph = {};
let count = 0;

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
    return this.getNode(id).coords;
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
    this._removeEdges(id);
    delete graph[id];
}

function removeEdges(id) {
    for (let nodeId in graph) {
        graph[nodeId].to = graph[nodeId].to.filter(e => e.node != id);
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

    const edgesFrom = graph[id].to.map(e => e.node);

    return {
        to: edgesTo,
        from: edgesFrom
    };
}