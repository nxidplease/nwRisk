const GAME_MAP_PATH = 'assets/risk-colored-small.jpg';
const COLOR_MAP_PATH = 'assets/risk-colored-small-color-map.bmp';
// UI Elements
let currTurnP;
let nextPhaseButton;
let gameMap;
let colorMap;
let centerSize = 25;
let currPlayer;
let waitingForGameLogic = true;
let colorAreaNameMap;
let highlightedAreaName = '';
let areas;
let continents;
// Const key codes
const KEY_MAP = {
    'SPACE': 32
    , '1': 49
    , 'a': 65
    , 'r': 82
    , 's': 83
    , 'c': 67
};
let mouseMode = false;
let keys = [];

function Gui(game) {
    const cardsFolder = 'assets/Cards/';

    function preload() {
        loadImage(GAME_MAP_PATH, function (image) {
            gameMap = image;
            gameMap.loadPixels();
        })
        loadImage(COLOR_MAP_PATH, function (image) {
            colorMap = image;
            colorMap.loadPixels();
            let data = game.readData();
            game.areas = data[0];
            areas = game.areas;
            colorAreaNameMap = data[1];
            continents = data[2];
        })
        fs.readdirSync(cardsFolder).forEach(file => {
            loadImage(cardsFolder + file, function (image) {
                game.cards.set(file, image);
                console.log("This file name " + file + " with file " + image);
            })
        });
    }

    function guiInit() {
        currTurnP = createP('Waiting For: ');
        nextPhaseButton = createButton('Next Phase');
        nextPhaseButton.hide();
    }
    /* Control functions
       player - The player who's turn it is

       amount - The amount of unit he should be allowed to place(optional, 
                if specified the amount will be limited, otherwise the player 
                may choose how many units he would like to place)
       unclaimed - A boolean specifing whether or not the player should be forced to place units on unclaimed areas

       callback - A function that will be called when the player finished, recieved a parameter(amount of units placed)
    */
    function nextGameState(player, callback, gameState, ...args) {
        this.gameState = gameState;
        this.callback = callback;
        this.setCurrPlayer(player);
        this.args = args;
        waitingForGameLogic = false;
    }

    function setCurrPlayer(player) {
        currPlayer = player;
        this.onPlayerChange();
    }
    // Events
    function onPlayerChange() {
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

    function showNextButton() {
        this.removePreviousEventListeners();
        nextPhaseButton.mousePressed(this.callback);
        nextPhaseButton.show();
    }

    function removePreviousEventListeners() {
        for (let ev in nextPhaseButton._events) {
            nextPhaseButton.elt.removeEventListener(ev, nextPhaseButton._events[ev]);
        }
        // Clean events map
        nextPhaseButton._events = {};
    }

    function updatePlayerStatus() {
        // Update curr player paragraph
        currTurnP.html('Waiting for: ' + currPlayer.name + '<br> Units Left: ' + currPlayer.unitsToPlace);
    }
    // Drawing
    function draw() {
        background(255);
        image(gameMap, 0, 0);
        this.drawAreaCenters();
    }

    function clearAreaHighlight() {
        areaHighlighter.resetAreaHighlight(areas, highlightedAreaName, gameMap);
        highlightedAreaName = '';
    }

    function drawAreaCenters() {
        for (let area in areas) {
            if (areas.hasOwnProperty(area)) {
                if ('units' in areas[area]) {
                    let unitsStr = areas[area].units.toString();
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
    function areaAdjacencyFunc(currArea, opts) {
        if (currArea.name in currPlayer.areas && currArea.units > 1) {
            for (i = 0; i < currArea.adjacentAreaNames.length; i++) {
                let adjacentAreaName = currArea.adjacentAreaNames[i];
                // Only if func returns true we want to return
                // otherwise we want the loop to continue
                if (this.isAreaAdjacentToSourceOrFof(adjacentAreaName, opts)) {
                    return true;
                }
            }
        }
        return false;
    }

    function isAreaAdjacentToSourceOrFof(adjacentAreaName, opts) {
        let ownedByPlayer = (adjacentAreaName in currPlayer.areas);
        return (((opts.adjacentToFoe && !ownedByPlayer) || (!opts.adjacentToFoe && ownedByPlayer)));
    }
    /*
        Returns true if there is a path from sourceArea to destArea
        of areas owned by the same player
    */
    function pathOfSameOwner(sourceArea, destArea) {
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
    function areaReachableFromSource(destAreaName) {
        let destArea = areas[destAreaName];
        if (destArea.owner.name !== this.source.owner.name) {
            return false;
        }
        else {
            return this.pathOfSameOwner(this.source, destArea);
        }
    }
    // IO
    function mouseMoved() {
        if (!waitingForGameLogic) {
            if (mouseX < colorMap.width && mouseY < colorMap.height) {
                //currentColor = this.getCurrColor();
                currentColor = areaHighlighter.getCurrColor(colorMap, mouseX, mouseY);
                if (highlightedAreaName.localeCompare('') != 0) {
                    clearAreaHighlight();
                    //this.resetAreaHighlight();
                }
                if (currentColor in colorAreaNameMap) {
                    let currAreaName = colorAreaNameMap[currentColor];
                    let highlight = false;
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
                                let adjacentToSource = this.source.adjacentAreaNames.indexOf(currAreaName) != -1;
                                let ownedByPlayer = currAreaName in currPlayer.areas;
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
                        highlightedAreaName = currAreaName;
                        areaHighlighter.highlightArea(areas[currAreaName], gameMap);
                        //this.highlightArea(areas[currAreaName]);
                    }
                }
            }
        }
    }

    function mousePressed() {
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
                                    areaHighlighter.resetAreaHighlight(areas, highlightedAreaName, gameMap);
                                    highlightedAreaName = '';
                                    //this.resetAreaHighlight();
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

    function mouseDragged() {
        /* if (this.mouseWithinCanvas() && (highlightedAreaName in areas)) {
             areas[highlightedAreaName].center = {
                 'x': mouseX
                 , 'y': mouseY
             };
         }*/
    }

    function handleMouseWheel(e) {}

    function keyPressed() {
        if (!waitingForGameLogic) {
            // Safegaurd
            if (keys.indexOf(keyCode) == -1) {
                keys.push(keyCode);
            }
        }
    }

    function keyReleased() {
        if (!waitingForGameLogic) {
            if (keys.indexOf(keyCode) != -1) {
                keys.slice(keys.indexOf(keyCode), 1);
            }
        }
    }

    function keyComboPressed(keyCombo) {
        for (i = 0; i < keyCombo.length; i++) {
            if (keys.indexOf(keyCombo[i]) == -1) {
                return false;
            }
        }
        // Guarding against states when key combo is pressed with additional characters
        return true && (keys.length == keyCombo.length);
    }
    // Helper Functions
    function mouseWithinCanvas() {
        return (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height);
    }

    function resetGui() {
        if (highlightedAreaName in areas) {
            clearAreaHighlight();
            //this.resetAreaHighlight();
        }
        // Wait until callback calls gui again
        nextPhaseButton.elt.disabled = true;
        waitingForGameLogic = true;
    }
}