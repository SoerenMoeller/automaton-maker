# AutomatonMaker 

This tool can be used to plot an automaton.
In general, NFAs, DFAs and TMs should be supported. 

## Usage
There are to modes to edit and build the graph.  
The **edit**-mode to create elements and the **write**-mode to change the labels of the elements. The key-settings in theses modes are described in the following.

### General
```
Click       Select an element
Drag        Drag node | Change edge curve | 
            Change angle of self- and start-edges
Del         Remove selected element
Esc         Unselect element
```

### Edit mode
```
a           Create a node
s           Make selected node a starting node
e           Make selected node an ending node
Ctrl+Drag   Draw edge
Back        Remove selected element
Shift       Toggle grid view
```

### Write mode
```
Typing will focus the text input of the selected element.
```

## Possible additions
- Labels on nodes
- Multi select elements (for shifting whole graph)

## Bugs
- Arrow offset
- Convertion between coordinates from SVG to LaTeX slightly off