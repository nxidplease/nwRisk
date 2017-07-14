const FIRST_TRADING_REINF_COUNT = 4;
const MAX_TRADING_REINF = 30;
const COLOR_AREA_NAME_MAP_PATH = 'data/colorToAreaName.json';
const AREAS_DATA_PATH = 'data/areas.json';
const CONTINENTS_DATA_PATH = 'data/continents.json';
let RandomOrg = require('random-org');
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
const RandomApi = {
    apiKey: 'fd73ee09-f89e-4d8e-88e3-3da8cf297cb8'
    , requestRandoms: function (numOfRandoms, callback) {
        if (this.client === undefined) {
            this.client = new RandomOrg({
                apiKey: this.apiKey
            });
        }
        this.client.generateIntegers(this.buildRequest(numOfRandoms)).then(function (result) {
            callback(result.random.data);
        }).catch((err) => {
            console.log(err);
        });
    }
    , buildRequest: function (numOfRandoms) {
        return {
            min: 1
            , max: 6
            , n: numOfRandoms
        }
    }
}

function Game() {
    this.players = [];
    this.areas = {};
    this.cards = new Map();
    this.continents = [];
    this.currPlayerIndex = 0;
    this.guiManager;
    this.readData = function () {
        let colorAreaNameMap = JSON.parse(fs.readFileSync(COLOR_AREA_NAME_MAP_PATH, 'utf-8'));
        let areas = JSON.parse(fs.readFileSync(AREAS_DATA_PATH, 'utf-8'));
        let continents = JSON.parse(fs.readFileSync(CONTINENTS_DATA_PATH, 'utf-8'));
        return [areas, colorAreaNameMap, continents];
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
        }
        else {
            this.gameState = GAME_STATES.DEPLOY_CLAIMED;
            this.deployClaimed();
        }
    }
    this.deployClaimed = function () {
        const callback = deployCallback.bind(this, this.deployClaimed);
        if (this.unitsLeftToPlace()) {
            this.guiManager.nextGameState(this.players[this.currPlayerIndex], callback, this.gameState);
        }
        else {
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
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.fortify.bind(this), this.gameState, RandomApi.requestRandoms.bind(RandomApi));
    }
    this.fortify = function () {
        this.gameState = GAME_STATES.FORT;
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.cardTrade.bind(this), this.gameState);
    }
    this.cardTrade = function () {
        this.currPlayerIndex = (this.currPlayerIndex + 1) % this.players.length;
        this.gameState = GAME_STATES.CARD_TRADE;
        this.guiManager.nextGameState(this.players[this.currPlayerIndex], this.reinforce.bind(this), this.gameState);
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