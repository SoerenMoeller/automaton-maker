export function getLength(vector) {
    return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
}

export function getDistance(vectorA, vectorB) {
    return Math.sqrt(Math.pow(vectorB.x - vectorA.x, 2) + Math.pow(vectorB.y - vectorA.y, 2));
}

export function getDotProduct(vectorA, vectorB) {
    return vectorA.x * vectorB.y - vectorB.x * vectorA.y;
}

export function getNormalVector(vectorA, vectorB) {
    const normal = {
        x: -(vectorB.y - vectorA.y),
        y: vectorB.x - vectorA.x
    };
    return getUnitVector(normal);
}

export function getUnitVector(vector) {
    const length = getLength(vector);
    return {
        x: vector.x / length,
        y: vector.y / length,
    }
}

export function getMiddleOfVector(vectorA, vectorB) {
    return {
        x: (vectorA.x + vectorB.x) / 2,
        y: (vectorA.y + vectorB.y) / 2
    }
}

export function getVectorAngle(vectorA, vectorB) {
    const dot = getDotProduct(vectorA, vectorB);
    const lengthA = getLength(vectorA);
    const lengthB = getLength(vectorB);

    return Math.acos(dot / (lengthA * lengthB));
}

export function getAngle360Degree(baseVector, position) {
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

export function getVectorFromAngle(angle) {
    const angleBase = { x: 0, y: -1 };

    const radiantAngle = (360 - angle) * (Math.PI / 180);
    const vector = {
        x: angleBase.x * Math.cos(radiantAngle) + angleBase.y * Math.sin(radiantAngle),
        y: angleBase.y * Math.cos(radiantAngle) - angleBase.x * Math.sin(radiantAngle)
    }

    return getUnitVector(vector);
}

export function getDirectionVector(vectorA, vectorB) {
    return {
        x: vectorB.x - vectorA.x,
        y: vectorB.y - vectorA.y
    };
}

export function getDistanceToLine(point, direction, pointOnLine) {
    const dot = getDotProduct({ x: point.x - pointOnLine.x, y: point.y - pointOnLine.y }, direction);
    const length = getLength(direction);
    
    return -dot / length;
}