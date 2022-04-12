export class Graph {
    constructor(graph) {
        this.graph = graph;
        this.count = 0;
    }

    getNode(id) {
        return graph[id];
    }

    getCoords(id) {
        return this.getNode(id).coords;
    }

    addNode() {
        let node = {
            desc: "",
            attributes: [],
            coords: {
                x: 10,
                y: 10
            },
            to: []
        }

        this.graph[this.count++] = node;

        return this.count - 1;
    }

    addEdge(fromId, toId) {
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

    removeNode(id) {
        this._removeEdges(id);
        delete graph[id];
    }

    _removeEdges(id) {
        for (let nodeId in this.graph) {
            this.graph[nodeId].to = this.graph[nodeId].to.filter(e => e.node != id);
        }
    }

    removeEdge(fromId, toId) {
        graph[fromId].to = graph[fromId].to.filter(e => e.node != toId);
    }

    getEdgesInvolvingNode(id) {
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
}