// Lib and nw js requires
var fs = require('fs');
var nw = require('nw.gui');
var win = nw.Window.get();

// Game
var gameManager = new Game();

var nxtAreaId = 0;

preload = gameManager.preload.bind(gameManager);

function setup() {
    var mainDiv = select('#mainDiv');

    // IO propagation
    keyPressed = gameManager.keyPressed.bind(gameManager);
    keyReleased = gameManager.keyReleased.bind(gameManager);
    mouseDragged = gameManager.mouseDragged.bind(gameManager);
    mousePressed = gameManager.mousePressed.bind(gameManager);
    mouseMoved = gameManager.mouseMoved.bind(gameManager);
    draw = gameManager.draw.bind(gameManager);
    cnv = createCanvas(1012, 675);
    uiDiv = createDiv('');
    uiDiv.id('uiDiv');
    mainDiv.child(cnv);
    win.on('blur', function () {
        // release all keys when window lost focus
        keys = [];
    })
    win.maximize();
    gameManager.initGame(['Tolia', 'Scandal', 'Asaf', 'Eilon']);
    //saveToFile();
    gameManager.start();
}


function saveToFile() {
    fs.writeFileSync('./data/areas.json', JSON.stringify(gameManager.areas), 'utf-8');
}

function cloneArray(arr) {
    var newArr = [];

    for (i = 0; i < arr.length; i++) {
        newArr.push(arr[i]);
    }

    return newArr;
}