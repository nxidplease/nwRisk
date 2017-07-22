var defineAdjacentAreas = {
    mouseMoved: function () {
        if (mouseX < colorMap.width && mouseY < colorMap.height) {
            currClr = this.myGui.getCurrColor();
            if (((this.selected && highlightedAreaName.localeCompare(this.selected.name) != 0) || (this.selected === undefined)) && (highlightedAreaName in areas)) {
                this.myGui.resetHighlight();
            }
            if (currClr in colorAreaNameMap) {
                var currAreaName = colorAreaNameMap[currClr];
                if ((this.selected === undefined) || (this.selected.name.localeCompare(currAreaName) != 0)) {
                    this.myGui.highlightArea(areas[currAreaName]);
                }
            }
        }
    }
    , mousePressed: function () {
        if (this.myGui.mouseWithinCanvas()) {
            if (highlightedAreaName in areas) {
                if (!('selected' in this)) {
                    this.selected = areas[highlightedAreaName];
                    highlightedAreaName = '';
                    defineAdjacentAreas.updateGui();
                }
                else {
                    if (this.selected.adjacentAreaNames === undefined) {
                        this.selected.adjacentAreaNames = [];
                    }
                    var index = this.selected.adjacentAreaNames.indexOf(highlightedAreaName);
                    if (index != -1) {
                        this.selected.adjacentAreaNames.splice(index, 1);
                        defineAdjacentAreas.removeListItem(highlightedAreaName);
                    }
                    else {
                        this.selected.adjacentAreaNames.push(highlightedAreaName);
                        defineAdjacentAreas.addListItem(highlightedAreaName);
                    }
                }
            }
        }
    }
    , updateGui: function () {
        if (defineAdjacentAreas.selectedAreaDiv) {
            defineAdjacentAreas.selectedAreaDiv.html('Selected area: ' + this.selected.name);
        }
        else {
            defineAdjacentAreas.selectedAreaDiv = createDiv('Selected area: ' + this.selected.name)
        }
        if (defineAdjacentAreas.adjacentList === undefined) {
            defineAdjacentAreas.adjacentList = createElement('ul');
        }
        else {
            var listElt = defineAdjacentAreas.adjacentList.elt;
            while (listElt.firstChild) {
                listElt.removeChild(listElt.firstChild);
            }
        }
        if (this.selected.adjacentAreaNames) {
            for (i = 0; i < this.selected.adjacentAreaNames.length; i++) {
                var listItem = createElement('li', this.selected.adjacentAreaNames[i]);
                listItem.parent(defineAdjacentAreas.adjacentList);
            }
        }
    }
    , addListItem: function (areaName) {
        defineAdjacentAreas.adjacentList.child(createElement('li', areaName));
    }
    , removeListItem: function (areaName) {
        for (i = 0; i < defineAdjacentAreas.adjacentList.elt.children.length; i++) {
            var currItem = defineAdjacentAreas.adjacentList.elt.children[i];
            if (currItem.innerHTML.localeCompare(areaName) == 0) {
                defineAdjacentAreas.adjacentList.elt.removeChild(currItem);
            }
        }
    }
    , keyPressed: function () {
        if (keyCode == KEY_MAP.c) {
            this.myGui.resetHighlight(this.selected.name);
            delete this.selected;
            defineAdjacentAreas.selectedAreaDiv.html('');
            var listElt = defineAdjacentAreas.adjacentList.elt;
            while (listElt.firstChild) {
                listElt.removeChild(listElt.firstChild);
            }
        }
    }
}