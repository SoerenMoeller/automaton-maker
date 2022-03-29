document.addEventListener("DOMContentLoaded", main);

let selectedElement = false;
let CONSTANTS = {
    path: "path"
}
const NODE_RADIUS = 4;
const START_SHIFT = 7;

let graph = {
    0: {
        desc: "q0",
        attribute: "start",
        coords: {
            x: 30,
            y: 50
        },
        to: [
            {
                node: 1,
                desc: ""
            }
        ]
    },
    1: {
        desc: "q1",
        attribute: "end",
        coords: {
            x: 70,
            y: 50
        },
        to: [
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

function buildSVG(svg) {
    // removes content of svg
    svg.innerHTML = "";

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
    if (node.attribute == "start") {
        let dValue = `M${node.coords.x - NODE_RADIUS - START_SHIFT} ${node.coords.y} L${node.coords.x} ${node.coords.y}`;
        svg.appendChild(getNode('path', { 
            id: `start_${id}`,
            d: dValue, 
            stroke: "black", 
            stroke_width: 0.1
        }));
    }

    // create the text
    let textNode = getNode("text", {
        class: "draggable",
        x: node.coords.x,
        y: node.coords.y,
        text_anchor: "middle",
        alignment_baseline: "central"
    });

    textNode.innerHTML = node.desc;
    container.appendChild(textNode);

    svg.appendChild(container);
}

function buildLines(svg, id) {
    let node = graph[id];
    let coords = node.coords;

    for (let otherNode in node.to) {
        let nodeId = node.to[otherNode].node;
        let otherCoords = graph[nodeId].coords;

        // make a path (straight only for now)
        dv = `M${coords.x} ${coords.y} L${otherCoords.x} ${otherCoords.y}`;
        svg.appendChild(getNode('path', { 
            id: `path_${id}-${nodeId}`,
            d: dv, 
            stroke: "black", 
            stroke_width: 0.1
        }));
    }
}

function getNode(n, v) {
    n = document.createElementNS("http://www.w3.org/2000/svg", n);
    for (var p in v) {
      n.setAttributeNS(null, p.replace("_", "-"), v[p]);
    }
    return n
}

function makeDraggable(evt) {
    var svg = evt.target;
    svg.addEventListener('mousedown', startDrag);
    svg.addEventListener('mousemove', drag);
    svg.addEventListener('mouseup', endDrag);
    svg.addEventListener('mouseleave', endDrag);

    function startDrag(evt) {
        if (evt.target.classList.contains('draggable')) {
            selectedElement = evt.target.parentNode;
        }
    }

    function drag(evt) {
        if (selectedElement) {
            evt.preventDefault();
            const coord = getMousePosition(evt);

            // get the id of the node
            const id = selectedElement.id.split("_")[1];

            // prevent going over the edge
            let freezeX = coord.x > 96 || coord.x < 4;
            let freezeY = coord.y > 96 || coord.y < 4;

            // prevent overlapping nodes
            let distance;
            for (let nodeId in graph) {
                if (nodeId == id) continue;
                
                distance = Math.sqrt(Math.pow(coord.x - graph[nodeId].coords.x, 2) + Math.pow(coord.y - graph[nodeId].coords.y, 2));
            }
            if (freezeX || distance < 8) {
                coord.x = graph[id].coords.x;
            }

            if (freezeY || distance < 8) {
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
                const path = document.getElementById(selector);

                const dValue = `M${graph[id].coords.x - NODE_RADIUS - START_SHIFT} ${graph[id].coords.y} L${graph[id].coords.x} ${graph[id].coords.y}`;
                path.setAttributeNS(null, "d", dValue);
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

            // correct the paths
            for (let nodeId of pathTo) {
                // get the svg path
                const selector = `path_${id}-${nodeId}`;
                const path = document.getElementById(selector);

                // redraw the path
                const startNode = graph[id];
                const endNode = graph[nodeId];
                const dValue = `M${startNode.coords.x} ${startNode.coords.y} L${endNode.coords.x} ${endNode.coords.y}`;
                path.setAttributeNS(null, "d", dValue);
            }

            for (let nodeId of pathFrom) {
                // get the svg path
                const selector = `path_${nodeId}-${id}`;
                const path = document.getElementById(selector);

                // redraw the path
                const startNode = graph[nodeId];
                const endNode = graph[id];
                const dValue = `M${startNode.coords.x} ${startNode.coords.y} L${endNode.coords.x} ${endNode.coords.y}`;
                path.setAttributeNS(null, "d", dValue);
            }
        }
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