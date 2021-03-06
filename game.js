const FIRST_TRADING_REINF_COUNT = 4;
const MAX_TRADING_REINF = 30;

const COLOR_AREA_NAME_MAP_PATH = 'data/colorToAreaName.json';
const AREAS_DATA_PATH = 'data/areas.json';

// An object that defines game states
const GAME_STATES = {
    'DEPLOY_UNCLAIMED': 0
    , 'DEPLOY_CLAIMED': 1
    , 'CARD_TRADE': 2
    , 'REINFORCE': 3
    , 'BTTL': 4
    , 'FORT': 5
    , 'FINISH': 6
};

function Game() {
    this.players = [];
    this.areas = {};
    this.continents = [];
    this.currPlayerIndex = 0;
    this.guiManager;

    this.fillAreas = function (colorMap) {
        var colorAreaNameMap = JSON.parse(fs.readFileSync(COLOR_AREA_NAME_MAP_PATH, 'utf-8'));
        var areas = JSON.parse(fs.readFileSync(AREAS_DATA_PATH, 'utf-8'));

        return [areas, colorAreaNameMap];
    }

    this.guiManager = new Gui(this);

    this.preload = this.guiManager.preload;

    this.initGame = function (playerNames) {
        this.guiManager.guiInit();
        for (i = 0; i < playerNames.length; i++) {
            var startingArmies = playerAmountToArmyStartMap[playerNames.length.toString()];
            this.players.push(new Player(playerNames[i], startingArmies, newColor()));
        }
    }

    this.start = function () {
        this.gameState = GAME_STATES.DEPLOY_UNCLAIMED;
        this.deployUnclaimed();
    }

    var deployCallback = function (stateFunc) {
        this.currPlayerIndex = (this.currPlayerIndex + 1) % this.players.length;

        // Skip players that have no units left to place
        while (this.players[this.currPlayerIndex].unitsToPlace == 0 && this.unitsLeftToPlace()) {
            this.currPlayerIndex = (this.currPlayerIndex + 1) % this.players.length;
        }

        stateFunc.bind(this)();

    };

    // Games state functions
    this.deployUnclaimed = function () {

        const callback = deployCallback.bind(this, this.deployUnclaimed);

        if (!this.allAreasOwned()) {
            this.guiManager.nextGameState(this.players[this.currPlayerIndex], callback, this.gameState);
        } else {
            this.gameState = GAME_STATES.DEPLOY_CLAIMED;
            this.deployClaimed();
        }
    }

    this.deployClaimed = function () {

        const callback = deployCallback.bind(this, this.deployClaimed);

        if (this.unitsLeftToPlace()) {
            this.guiManager.nextGameState(this.players[this.currPlayerIndex], callback, this.gameState);
        } else {
            this.gameState = GAME_STATES.REINFORCE;
            this.reinforce();
        }
    }

    this.reinforce = function () {
        this.currPlayerIndex = (this.currPlayerIndex + 1) % this.players.length;
        this.players[this.currPlayerIndex].calcReinf();
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.battle.bind(this), this.gameState);
    }

    this.battle = function () {
        this.gameState = GAME_STATES.BTTL;
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.fortify.bind(this), this.gameState);
    }

    this.fortify = function () {
        this.gameState = GAME_STATES.FORT;
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.cardTrade.bind(this), this.gameState);
    }

    this.allAreasOwned = function () {
        var ownedAreasSum = 0;

        for (i = 0; i < this.players.length; i++) {
            ownedAreasSum += Object.keys(this.players[i].areas).length;
        }

        return (ownedAreasSum == Object.keys(this.areas).length);
    }

    this.unitsLeftToPlace = function () {
        var areUnitsLeft = false;

        for (i = 0; i < this.players.length; i++) {
            if (this.players[i].unitsToPlace > 0) {
                areUnitsLeft = true;
            }
        }

        return areUnitsLeft;
    }

    // IO propagation
    this.draw = this.guiManager.draw.bind(this.guiManager);
    this.mouseMoved = this.guiManager.mouseMoved.bind(this.guiManager);
    this.mousePressed = this.guiManager.mousePressed.bind(this.guiManager);
    this.mouseDragged = this.guiManager.mouseDragged.bind(this.guiManager);
    this.keyPressed = this.guiManager.keyPressed.bind(this.guiManager);
    this.keyReleased = this.guiManager.keyReleased.bind(this.guiManager);
    this.handleMouseWheel = this.guiManager.handleMouseWheel.bind(this.guiManager);
}

var colorRanges = [{
    'from': 0
    , 'to': 50
}, {
    'from': 90
    , 'to': 140
}, {
    'from': 180
    , 'to': 230
}, {
    'from': 270
    , 'to': 320
}];

var nextColorRange = 0;

function newColor() {
    push();
    colorMode(HSB);
    var clrRange = colorRanges[nextColorRange];
    var clr = color(random(clrRange.from, clrRange.to), 70, 70);
    nextColorRange++

    pop();

    return clr;
}

const playerAmountToArmyStartMap = {
    '3': 35
    , '4': 30
    , '5': 25
    , '6': 20
};

function Player(name, startUnits, clr) {
    this.name = name;
    this.areas = {};
    this.continents = [];
    this.cards = [];
    this.unitsToPlace = startUnits;
    this.sessionId = '';
    // This is an HSB color
    this.color = clr;

    this.calcReinf = function () {
        var reinf = Math.max(Math.floor(Object.keys(this.areas).length / 3), 3);
        // Add continents bonus when implemented
        this.unitsToPlace = reinf;
    }
}