const GAME_MAP_PATH = 'assets/risk-colored-small.jpg';
const COLOR_MAP_PATH = 'assets/risk-colored-small-color-map.bmp';
// UI Elements
var currTurnP;
var nextPhaseButton;
var gameMap;
var colorMap;
var centerSize = 25;
var currPlayer;
var waitingForGameLogic = true;
var colorAreaNameMap;
var highlightedAreaName = '';
var areas;
// Const key codes
const KEY_MAP = {
    'SPACE': 32
    , '1': 49
    , 'a': 65
    , 'r': 82
    , 's': 83
    , 'c': 67
};
var mouseMode = false;
var keys = [];

function Gui(game) {
    const cardsFolder = 'assets/Cards/';
    this.preload = function () {
        loadImage(GAME_MAP_PATH, function (image) {
            gameMap = image;
            gameMap.loadPixels();
        })
        loadImage(COLOR_MAP_PATH, function (image) {
            colorMap = image;
            colorMap.loadPixels();
            var colorAndAreas = game.fillAreas(colorMap);
            game.areas = colorAndAreas[0];
            areas = game.areas;
            colorAreaNameMap = colorAndAreas[1];
        })
        fs.readdirSync(cardsFolder).forEach(file => {
            loadImage(cardsFolder + file, function (image) {
                game.cards.set(file, image);
                console.log("This file name " + file + " with file " + image);
            })
        });
    }
    this.guiInit = function () {
            UnitAmountSelector();
            diceResultWindow();
            currTurnP = createP('Waiting For: ');
            nextPhaseButton = createButton('Next Phase');
            nextPhaseButton.hide();
        }
        // Control functions
        // player - The player who's turn it is
        //
        // amount - The amount of unit he should be allowed to place(optional, 
        //          if specified the amount will be limited, otherwise the player 
        //          may choose how many units he would like to place)
        // unclaimed - A boolean specifing whether or not the player should be forced to place units on unclaimed areas
        //
        // callback - A function that will be called when the player finished, recieved a parameter(amount of units placed)
    this.nextGameState = function (player, callback, gameState, ...args) {
        this.gameState = gameState;
        this.callback = callback;
        this.setCurrPlayer(player);
        this.args = args;
        waitingForGameLogic = false;
    }
    this.setCurrPlayer = function (player) {
            currPlayer = player;
            this.onPlayerChange();
        }
        // Events
    this.onPlayerChange = function () {
        this.updatePlayerStatus();
        switch (this.gameState) {
        case GAME_STATES.DEPLOY_CLAIMED:
            {
                nextPhaseButton.attribute('disabled', "");
            }
        case GAME_STATES.BTTL:
            {
                this.showNextButton();
                nextPhaseButton.removeAttribute('disabled');
                break;
            }
        default:
            {
                nextPhaseButton.hide();
                break;
            }
        }
    }
    this.showNextButton = function () {
        this.removePreviousEventListeners();
        nextPhaseButton.mousePressed(this.callback);
        nextPhaseButton.show();
    }
    this.removePreviousEventListeners = function () {
        for (var ev in nextPhaseButton._events) {
            nextPhaseButton.elt.removeEventListener(ev, nextPhaseButton._events[ev]);
        }
        // Clean events map
        nextPhaseButton._events = {};
    }
    this.updatePlayerStatus = function () {
            // Update curr player paragraph
            currTurnP.html('Waiting for: ' + currPlayer.name + '<br> Units Left: ' + currPlayer.unitsToPlace);
        }
        // Drawing
    this.draw = function () {
        background(255);
        image(gameMap, 0, 0);
        this.drawAreaCenters();
    }
    this.highlightArea = function (area) {
        // Set highlighted area name
        highlightedAreaName = area.name;
        // highlight all pixels of the area
        for (i = 0; i < area.pixPos.length; i++) {
            this.highlightPixel(area.pixPos[i].x, area.pixPos[i].y);
        }
        gameMap.updatePixels();
    }
    this.resetHighlight = function (areaName) {
        var areaPix;
        if (areaName) {
            areaPix = areas[areaName].pixPos;
        }
        else {
            areaPix = areas[highlightedAreaName].pixPos;
            highlightedAreaName = '';
        }
        for (i = 0; i < areaPix.length; i++) {
            this.setPixColor(areaPix[i].x, areaPix[i].y, areaPix[i].rgb);
        }
        gameMap.updatePixels();
    }
    this.highlightPixel = function (x, y) {
        var pixIndex = 4 * (x + y * gameMap.width);
        // For starters make the pixel greener
        var r = gameMap.pixels[pixIndex];
        var g = gameMap.pixels[pixIndex + 1];
        var b = gameMap.pixels[pixIndex + 2];
        if (r != 0 && g != 0 && b != 0) {
            gameMap.pixels[pixIndex] = r * 0.5;
            gameMap.pixels[pixIndex + 1] = (g * 0.5 + 100) % 256;
            gameMap.pixels[pixIndex + 2] = b * 0.5;
        }
    }
    this.setPixColor = function (x, y, rgb) {
        var pixIndex = 4 * (x + y * gameMap.width);
        gameMap.pixels[pixIndex] = rgb[0];
        gameMap.pixels[pixIndex + 1] = rgb[1];
        gameMap.pixels[pixIndex + 2] = rgb[2];
    }
    this.drawAreaCenters = function () {
            for (var area in areas) {
                if (areas.hasOwnProperty(area)) {
                    if ('units' in areas[area]) {
                        var unitsStr = areas[area].units.toString();
                        push();
                        colorMode(HSB);
                        fill(areas[area].owner.color);
                        noStroke();
                        ellipse(areas[area].center.x, areas[area].center.y, centerSize);
                        rectMode(CENTER);
                        fill(255);
                        text(unitsStr, areas[area].center.x, areas[area].center.y, textWidth(unitsStr), textSize());
                        pop();
                    }
                }
            }
        }
        /*
            Loops through the adjacent areas of currArea and executes isAreaAdjacentToSourceOrFof on them to determine
            if a certian condition is met
            
        */
    this.areaAdjacencyFunc = function (currArea, opts) {
        if (currArea.name in currPlayer.areas && currArea.units > 1) {
            for (i = 0; i < currArea.adjacentAreaNames.length; i++) {
                var adjacentAreaName = currArea.adjacentAreaNames[i];
                // Only if func returns true we want to return
                // otherwise we want the loop to continue
                if (this.isAreaAdjacentToSourceOrFof(adjacentAreaName, opts)) {
                    return true;
                }
            }
        }
        return false;
    }
    this.isAreaAdjacentToSourceOrFof = function (adjacentAreaName, opts) {
            var ownedByPlayer = (adjacentAreaName in currPlayer.areas);
            return (((opts.adjacentToFoe && !ownedByPlayer) || (!opts.adjacentToFoe && ownedByPlayer)));
        }
        /*
            Returns true if there is a path from sourceArea to destArea
            of areas owned by the same player
        */
    this.pathOfSameOwner = function (sourceArea, destArea) {
            let result = false;
            sourceArea.explored = true;
            for (areaName of sourceArea.adjacentAreaNames) {
                if (areaName === destArea.name) {
                    // If destArea is an immediate adjacent area we 
                    // shuld return right away without checking the rest of the areas
                    result = true;
                    break;
                }
                else if ((areas[areaName].owner.name === destArea.owner.name) && (!areas[areaName].explored)) {
                    if (this.pathOfSameOwner(areas[areaName], destArea)) {
                        // We want to return as soon as there is a true result,
                        // otherwise we want the loop to continue
                        result = true;
                        break;
                    }
                }
            }
            delete sourceArea.explored;
            return result;
        }
        /*
            This function returns true if there is a path of
            areas that are owned by sourceArea owner leading to destArea
            that is also owned by sourceArea owner
        */
    this.areaReachableFromSource = function (destAreaName) {
            let destArea = areas[destAreaName];
            if (destArea.owner.name !== this.source.owner.name) {
                return false;
            }
            else {
                return this.pathOfSameOwner(this.source, destArea);
            }
        }
        // IO
    this.mouseMoved = function () {
        if (!waitingForGameLogic) {
            if (mouseX < colorMap.width && mouseY < colorMap.height) {
                currentColor = this.getCurrColor();
                if (highlightedAreaName.localeCompare('') != 0) {
                    this.resetHighlight();
                }
                if (currentColor in colorAreaNameMap) {
                    var currAreaName = colorAreaNameMap[currentColor];
                    var highlight = false;
                    switch (this.gameState) {
                    case GAME_STATES.DEPLOY_UNCLAIMED:
                        {
                            highlight = !('owner' in areas[currAreaName]);
                            break;
                        }
                    case GAME_STATES.DEPLOY_CLAIMED:
                    case GAME_STATES.REINFORCE:
                        {
                            highlight = (areas[currAreaName].owner.name.localeCompare(currPlayer.name) == 0) && (currPlayer.unitsToPlace > 0);
                            break;
                        }
                    case GAME_STATES.BTTL:
                        {
                            if (this.source) {
                                var adjacentToSource = this.source.adjacentAreaNames.indexOf(currAreaName) != -1;
                                var ownedByPlayer = currAreaName in currPlayer.areas;
                                highlight = adjacentToSource && !ownedByPlayer;
                            }
                            else {
                                highlight = this.areaAdjacencyFunc(areas[currAreaName], {
                                    adjacentToFoe: true
                                }) && (areas[currAreaName].units > 1);
                            }
                            break;
                        }
                    case GAME_STATES.FORT:
                        {
                            if (this.source) {
                                highlight = this.areaReachableFromSource(currAreaName);
                            }
                            else {
                                highlight = this.areaAdjacencyFunc(areas[currAreaName], {
                                    adjacentToFoe: false
                                }) && (areas[currAreaName].units > 1);
                            }
                            break;
                        }
                    }
                    if (highlight) {
                        this.highlightArea(areas[currAreaName]);
                    }
                }
            }
        }
    }
    this.mousePressed = function mousePressed() {
        if (!waitingForGameLogic) {
            if (mouseButton == LEFT && this.mouseWithinCanvas()) {
                if (highlightedAreaName in areas) {
                    switch (this.gameState) {
                    case GAME_STATES.DEPLOY_UNCLAIMED:
                        {
                            if (currPlayer.unitsToPlace > 0) {
                                areas[highlightedAreaName].owner = currPlayer;
                                areas[highlightedAreaName].units = 1;
                                currPlayer.areas[highlightedAreaName] = areas[highlightedAreaName];
                                currPlayer.unitsToPlace--;
                                this.resetGui();
                                this.callback();
                            }
                            break;
                        }
                    case GAME_STATES.DEPLOY_CLAIMED:
                        {
                            nextPhaseButton.elt.disabled = false;
                        }
                    case GAME_STATES.REINFORCE:
                        {
                            areas[highlightedAreaName].units++;
                            currPlayer.unitsToPlace--;
                            if (currPlayer.unitsToPlace == 0) {
                                this.resetGui();
                                this.callback();
                            }
                            break;
                        }
                    case GAME_STATES.BTTL:
                        {
                            if (this.source) {
                                waitingForGameLogic = true;
                                let btlDialog = new BattleDialogController(this.source, areas[highlightedAreaName], this.args[0], () => {
                                    this.resetHighlight();
                                    this.source = undefined;
                                    waitingForGameLogic = false;
                                });
                            }
                            else {
                                this.source = areas[highlightedAreaName];
                            }
                            break;
                        }
                    case GAME_STATES.FORT:
                        {
                            if (this.source) {
                                let dest = areas[highlightedAreaName];
                                UnitAmountSelector.attachToModal({
                                    max: this.source.units - 1
                                    , phaseNoun: 'Fortification'
                                    , btnTxt: 'Move Units'
                                    , btnCallback: (movedUnits) => {
                                        this.source.units -= movedUnits;
                                        dest.units += movedUnits;
                                        UnitAmountSelector.hide();
                                        UnitAmountSelector.detachFromModal();
                                        this.resetGui();
                                        this.callback();
                                    }
                                })
                            }
                            else {
                                this.source = areas[highlightedAreaName];
                            }
                            break;
                        }
                    }
                    this.updatePlayerStatus();
                }
            }
        }
    }
    this.mouseDragged = function () {
        /* if (this.mouseWithinCanvas() && (highlightedAreaName in areas)) {
             areas[highlightedAreaName].center = {
                 'x': mouseX
                 , 'y': mouseY
             };
         }*/
    }
    this.handleMouseWheel = function (e) {}
    this.keyPressed = function () {
        if (!waitingForGameLogic) {
            // Safegaurd
            if (keys.indexOf(keyCode) == -1) {
                keys.push(keyCode);
            }
        }
    }
    this.keyReleased = function () {
        if (!waitingForGameLogic) {
            if (keys.indexOf(keyCode) != -1) {
                keys.slice(keys.indexOf(keyCode), 1);
            }
        }
    }
    this.keyComboPressed = function (keyCombo) {
            for (i = 0; i < keyCombo.length; i++) {
                if (keys.indexOf(keyCombo[i]) == -1) {
                    return false;
                }
            }
            // Guarding against states when key combo is pressed with additional characters
            return true && (keys.length == keyCombo.length);
        }
        // Helper Functions
    this.mouseWithinCanvas = function () {
        return (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height);
    }
    this.getCurrColor = function () {
        var r = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width)];
        var g = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 1];
        var b = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 2];
        var a = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 3];
        return (hex(r, 2) + hex(g, 2) + hex(b, 2));
    }
    this.resetGui = function () {
        if (highlightedAreaName in areas) {
            this.resetHighlight();
        }
        // Wait until callback calls gui again
        nextPhaseButton.elt.disabled = true;
        waitingForGameLogic = true;
    }
}