let selectedElement = false;

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
            var coord = getMousePosition(evt);
            
            // move the text and the circle
            selectedElement.childNodes[1].setAttributeNS(null, "cx", coord.x);
            selectedElement.childNodes[1].setAttributeNS(null, "cy", coord.y);
            selectedElement.childNodes[3].setAttributeNS(null, "x", coord.x);
            selectedElement.childNodes[3].setAttributeNS(null, "y", coord.y);

            // TODO: redraw the connection line to this node
            // query for all paths that are to connected to the dot
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