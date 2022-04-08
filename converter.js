export function convertToLaTeX(graph) {
    let output = getTikzHeader();

    // add all nodes
    for (let nodeId in graph) {
        output += convertNode(nodeId, graph);
    }
    output += "\n";

    output += convertEdges(graph);

    output += "\\end{tikzpicture}";
    console.log(output);
}

function getTikzHeader() {
    return "\\begin{tikzpicture}[->, >=stealth, semithick]\n\n";
}

function convertNode(nodeId, graph) {
    const node = graph[nodeId];

    // add node data
    let nodeTex = "\\node [state";
    for (let attr in node.attributes) {
        switch (node.attributes[attr]) {
            case "start":
                const position = getPositionFromAngle(node.startAngle);
                nodeTex += `, initial, initial text="", initial ${position}`;
                break;
            case "end":
                nodeTex += ", accepting";
                break;
            default:
                console.error(`Unkown state: ${node.attributes[attr]}`);
        }
    }
    nodeTex += "] ";

    // add node id
    nodeTex += `(${nodeId}) `;

    // position all nodes relative to the first one
    const firstNodeId = getFirstNodeId(graph);
    if (nodeId !== firstNodeId) {
        nodeTex += createRelativeCoords(nodeId, firstNodeId, graph);
    }

    // add node description
    nodeTex += `{$${node.desc}$};\n`;

    return nodeTex;
}

function getFirstNodeId(graph) {
    const keys = Object.keys(graph);

    console.assert(keys.length != 0, "No node found");

    return keys[0];
}

function createRelativeCoords(nodeId, firstNodeId, graph) {
    const node = graph[nodeId];
    const firstNode = graph[firstNodeId];

    let positionTex = "[";

    const difference = {
        x: node.coords.x - firstNode.coords.x,
        y: node.coords.y - firstNode.coords.y
    };

    // check the relative position
    if (difference.y !== 0) {
        positionTex += (difference.y < 0) ? "above " : "below ";
    }
    if (difference.x !== 0) {
        positionTex += (difference.x < 0) ? "left=" : "right=";
    }

    // add the distance
    if (difference.y !== 0 && difference.y !== 0) {
        positionTex += `${mapDistance(difference.y)}cm and ${mapDistance(difference.x)}cm of ${firstNodeId}] `;
    } else if (difference.y !== 0) {
        positionTex += `${mapDistance(difference.y)}cm of ${firstNodeId}] `;
    } else {
        positionTex += `${mapDistance(difference.x)}cm of ${firstNodeId}] `;
    }

    return positionTex;
}

function mapDistance(dist) {
    // max width of 10cm
    const width = 10;

    return roundTo2Digits(dist / width);
}

function roundTo2Digits(num) {
    return (Math.round(num * 100) / 100).toFixed(2);
}

function convertEdges(graph) {
    let edgesTex = "";

    for (let nodeId in graph) {
        edgesTex += convertEdge(nodeId, graph);
    }

    if (edgesTex !== "") {
        edgesTex = "\\path " + edgesTex;
        edgesTex += ";\n"
    }

    return edgesTex;
}

function convertEdge(nodeId, graph) {
    const node = graph[nodeId];
    if (node.to.length === 0) return "";

    let edgeTex = `(${nodeId}) `;
    for (let e in node.to) {
        const edge = node.to[e];
        const otherId = edge.node;

        edgeTex += "edge ";

        // handle self nodes
        if (nodeId == otherId) {
            const correctAngle = convertAngle(edge.angle);
            const dist = 15;

            // TODO: figure out distance / position of text
            edgeTex += `[out=${mod(correctAngle - dist)}, in=${mod(correctAngle + dist)}, loop]`;
        } else {
            const offset = edge.offset;
            
            // TODO: figure out text position
            edgeTex += "[";

            if (offset !== 0) {
                edgeTex += `bend ${offset < 0 ? "left" : "right"}=${offset}`;
            }
            edgeTex += "]";
        }
        
        edgeTex += ` node {${edge.desc}} (${otherId})\n`;

        // for formatting only
        edgeTex += " ".repeat(9 + nodeId.toString().length);
    }

    return edgeTex;
}

function convertAngle(angle) {
    // map angle from 0 deg being on the top to being on the right, also direction is inverted

    angle = mod(360 - angle);
    angle = mod(angle + 90);

    return angle;
}

function getPositionFromAngle(angle) {
    const eighthDegree = 45;
    const position = {
        top: 0,
        right: 90,
        bottom: 180,
        left: 270
    }

    let direction;
    // TODO: buggy
    console.log(angle, mod(position.top - eighthDegree), mod(position.top + eighthDegree))
    if (angle > mod(position.top - eighthDegree) && (angle < mod(position.top + eighthDegree))) {
        direction = "above";
    } else if (angle > mod(position.right - eighthDegree) && (angle < mod(position.right + eighthDegree))) {
        direction = "right";
    } else if (angle > mod(position.bottom - eighthDegree) && (angle < mod(position.bottom + eighthDegree))) {
        direction = "below";
    } else {
        direction = "left";
    } 

    return direction;
}

// needed because js is bad at math
function mod(n) {
    const m = 360;
    return ((n % m) + m) % m;
  }