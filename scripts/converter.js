import { getDirectionVector } from './vectors.js';

"use strict";

export function convertToLaTeX(graph) {
    let output = getTikzHeader();

    // add all nodes
    for (let nodeId in graph) {
        output += convertNode(nodeId, graph);
    }
    output += "\n";

    output += convertEdges(graph);

    output += "\n\\end{tikzpicture}";

    return output;
}

function getTikzHeader() {
    return "\\begin{tikzpicture}[->, >=stealth, semithick]\n\\tikzset{every state}=[minimum size = 0.4cm]\n\n";
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
    nodeTex += `{${parseTextToLaTeX(node.desc)}};\n`;

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
        positionTex += `${mapDistanceY(difference.y)}cm and ${mapDistanceX(difference.x)}cm of ${firstNodeId}] `;
    } else if (difference.y !== 0) {
        positionTex += `${mapDistanceY(difference.y)}cm of ${firstNodeId}] `;
    } else {
        positionTex += `${mapDistanceX(difference.x)}cm of ${firstNodeId}] `;
    }

    return positionTex;
}

function mapBending(bend) {
    return 3 * bend;
}

function mapDistanceX(dist) {
    dist = Math.abs(dist);

    // max width of 10cm
    const width = 10;
    const ratio = dist / width;

    return roundTo2Digits(ratio);
}

function mapDistanceY(dist) {
    dist = Math.abs(dist);

    // max width of 10cm
    const width = 10;
    const ratio = dist / width;
    const radius = 0.4;

    return roundTo2Digits(ratio - 1.5 * radius);
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
        edgesTex = "\\path " + edgesTex + ";\n";
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

            edgeTex += `[out=${mod(correctAngle + dist)}, in=${mod(correctAngle - dist)}, loop]`;
        } else {
            const offset = edge.offset;

            if (offset !== 0) {
                edgeTex += `[bend ${offset < 0 ? "left" : "right"}=${mapBending(offset)}]`;
            }
        }
        
        edgeTex += " node [align=center";
        if (edge.desc.length !== 0) {
            edgeTex += `, ${getEdgeTextPosition(nodeId, otherId, graph)}`;
        }
        edgeTex += "] "

        edgeTex += `{${parseTextToLaTeX(edge.desc)}} (${otherId})\n`;

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
    if (angle > mod(position.left - eighthDegree) && (angle < mod(position.left + eighthDegree))) {
        direction = "left";
    } else if (angle > mod(position.right - eighthDegree) && (angle < mod(position.right + eighthDegree))) {
        direction = "right";
    } else if (angle > mod(position.bottom - eighthDegree) && (angle < mod(position.bottom + eighthDegree))) {
        direction = "below";
    } else {
        direction = "above";
    } 

    return direction;
}

// needed because js is bad at math
function mod(n) {
    const m = 360;
    return ((n % m) + m) % m;
}

function getEdgeTextPosition(nodeId, otherId, graph) {
    if (nodeId == otherId) return getSelfEdgeTextPosition(nodeId, graph);

    const node = graph[nodeId];
    const otherNode = graph[otherId];
    const edge = node.to.find(e => e.node == otherId);
    const offset = edge.textOffset;

    const direction = getDirectionVector(node.coords, otherNode.coords);

    const threshold = 5;
    const dominantX = Math.abs(direction.x) > Math.abs(direction.y) * threshold;
    const dominantY = Math.abs(direction.y) > Math.abs(direction.x) * threshold;

    let position = "";
    if (!dominantX && !dominantY) {
        if (direction.x < 0 && direction.y < 0 && offset < 0) {
            position = "below left";
        } else if (direction.x < 0 && direction.y < 0 && offset > 0) {
            position = "above right";
        } else if (direction.x < 0 && direction.y > 0 && offset < 0) {
            position = "below right";
        } else if (direction.x < 0 && direction.y > 0 && offset > 0) {
            position = "above left";
        } else if (direction.x > 0 && direction.y < 0 && offset < 0) {
            position = "above left";
        } else if (direction.x > 0 && direction.y < 0 && offset > 0) {
            position = "below right";
        } else if (direction.x > 0 && direction.y > 0 && offset < 0) {
            position = "above right";
        } else {
            position = "below left";
        }
    } else if (dominantX) {
        if ((offset > 0 && direction.x > 0) || (offset < 0 && direction.x < 0)) {
            position = "below";
        } else {
            position = "above";
        }
    } else {
        if ((offset > 0 && direction.y > 0) || (offset < 0 && direction.y < 0)) {
            position = "left";
        } else {
            position = "right";
        }
    }

    return position;
}

function getSelfEdgeTextPosition(nodeId, graph) {
    const node = graph[nodeId];
    const edge = node.to.find(e => e.node == nodeId);
    const angle = edge.angle;
    const eighthDegree = 45;
    const sixteenthDegree = eighthDegree / 2;

    let position;
    if (angle > sixteenthDegree && angle < sixteenthDegree + eighthDegree) {
        position = "above right";
    } else if (angle > sixteenthDegree * 3 && angle < sixteenthDegree * 3 + eighthDegree) {
        position = "right";
    } else if (angle > sixteenthDegree * 5 && angle < sixteenthDegree * 5 + eighthDegree) {
        position = "below right";
    } else if (angle > sixteenthDegree * 7 && angle < sixteenthDegree * 7 + eighthDegree) {
        position = "below";
    } else if (angle > sixteenthDegree * 9 && angle < sixteenthDegree * 9 + eighthDegree) {
        position = "below left";
    } else if (angle > sixteenthDegree * 11 && angle < sixteenthDegree * 11 + eighthDegree) {
        position = "left";
    } else if (angle > sixteenthDegree * 13 && angle < sixteenthDegree * 13 + eighthDegree) {
        position = "above left";
    } else {
        position = "above";
    }

    return position;
}

export function parseText(input) {
    const results = [];
    for (let line of input) {
        let result = {
            text: "",
            sub: "",
            super: ""
        };

        const subSplit = line.split("_");
        const superSplit = line.split("^");

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

        results.push(result);
    }

    return results;
}

function parseTextToLaTeX(input) {
    if (input.length === 0) return "";

    const parsed = parseText(input);

    let output = "";
    for (let parsedLine of parsed) {
        output += `$${parsedLine.text}`;
        if (parsedLine.sub && parsedLine.sub.length !== 0) {
            output += `_{${parsedLine.sub}}`;
        }
        if (parsedLine.super && parsedLine.super.length !== 0) {
            output += `^{${parsedLine.super}}`;
        }
        output += "$\\\\"
    }

    // remove last line break
    if (parsed.length !== 0) {
        output = output.slice(0, -2);
    }

    return output;
}

export function parseInputToArray(input) {
    return input.split("||").map(e => e.trim());
}