const MAX_ATTACKERS = 3;
const MAX_DEFENDERS = 2;
const CONTROL_THUMB_WIDTH = 20;
const INPUT_RANGE_WIDTH_PERCENT = 75;
const BATTLE_DLG_STATES = {
        ATTACKER_PAHSE: 0
        , DEFENDER_PHASE: 1
        , RESULT_PHASE: 2
    }
    /*
        Various utilities for common operations on DOM elements
    */
let btnFactory = {
    createButton: function ({
        txt = '', callback, classList = [], style = {}, attributes
    }) {
        let btn = createButton(txt);
        if (callback) {
            btn.mousePressed(callback);
        }
        classList.forEach((cls) => {
            btn.addClass(cls)
        });
        for (prop in style) {
            btn.style(prop, style[prop]);
        }
        for (atr in attributes) {
            btn.attribute(atr, attributes[atr]);
        }
        return btn;
    }
}

function enableIfDisabled(p5Element) {
    if ((p5Element.attribute('disabled') !== null) && (p5Element.attribute('disabled') !== undefined)) {
        p5Element.removeAttribute('disabled');
    }
}

function removeBtnFromParent(btn) {
    removeAllEventHandlers(btn);
    removeEltFromParent(btn);
}

function removeEltFromParent(p5Element) {
    let elt = p5Element.elt;
    elt.parentNode.removeChild(elt);
}

function removeAllEventHandlers(p5Element) {
    for (var ev in p5Element._events) {
        p5Element.elt.removeEventListener(ev, p5Element._events[ev]);
    }
    // Clean events map
    p5Element._events = {};
}

function getModalHeaderBodyBgDivs() {
    if (getModalHeaderBodyBgDivs.modalDivs) {
        return getModalHeaderBodyBgDivs.modalDivs;
    }
    else {
        let modalBackground = createDiv('');
        modalBackground.addClass('modal-background');
        let modalContentDiv = createDiv('');
        modalContentDiv.addClass('modal-content');
        modalBackground.child(modalContentDiv);
        let headerDiv = createDiv('');
        let bodyDiv = createDiv('');
        headerDiv.addClass('modal-header');
        bodyDiv.addClass('modal-body');
        modalContentDiv.child(headerDiv);
        modalContentDiv.child(bodyDiv);
        let modalDivs = {
            header: headerDiv
            , body: bodyDiv
            , background: modalBackground
        };
        getModalHeaderBodyBgDivs.modalDivs = modalDivs;
        return modalDivs;
    }
}
/*
    This class is in charge of all the logic behind the dialog
*/
function BattleDialogController(sourceArea, destArea, generateRandoms, guiCb) {
    this.sourceArea = sourceArea;
    this.destArea = destArea;
    // Calculate maximum attackers amount and pass it to the view
    this.attackerPhase = function () {
        UnitAmountSelector.attachToModal({
            max: Math.min(this.sourceArea.units - 1, MAX_ATTACKERS)
            , phaseNoun: 'Attack'
            , btnTxt: 'Attack'
            , btnCallback: (val) => {
                this.attackerUnits = val;
                this.defenderPhase();
            }
        });
    }
    this.defenderPhase = function () {
        UnitAmountSelector.update({
            max: Math.min(this.destArea.units, MAX_DEFENDERS)
            , phaseNoun: 'Defence'
            , btnTxt: 'Defend'
            , btnCallback: (val) => {
                this.defendingUnits = val;
                UnitAmountSelector.hide();
                UnitAmountSelector.detachFromModal();
                this.resultPhase();
            }
        });
    };
    this.resultPhase = function () {
        diceResultWindow.attachToModal({
            attacking: this.attackerUnits
            , defending: this.defendingUnits
            , randomGen: generateRandoms
            , source: this.sourceArea
            , dest: this.destArea
            , keepFightingCb: () => {
                diceResultWindow.detachFromModal();
                this.attackerPhase();
            }
            , winCb: this.winPhase
            , retreatCb: guiCb
        });
    };
    this.winPhase = function (lastFightAttackingUnits) {
        UnitAmountSelector.attachToModal({
            max: this.sourceArea.units - 1
            , min: lastFightAttackingUnits
            , startingVal: lastFightAttackingUnits
            , phaseNoun: 'defending your new area'
            , btnTxt: 'Move Units'
            , btnCallback: (val) => {
                this.sourceArea.units -= val;
                this.destArea.units += val;
                UnitAmountSelector.hide();
                UnitAmountSelector.detachFromModal();
                guiCb();
            }
        })
    }.bind(this);
    this.attackerPhase();
}
/*
    This class is in charge of building the html of the dialog
*/
let UnitAmountSelector = (function UnitAmountSelector() {
    let headerBodyBackground;
    let updateSlider = function ({
        max, min = 1, startingVal = max, sliderOut
    }) {
        // If slider was created previously, only update it's maxVal
        if (UnitAmountSelector.slider) {
            UnitAmountSelector.slider.attribute('max', max);
            UnitAmountSelector.slider.attribute('min', min);
            UnitAmountSelector.slider.value(startingVal);
            UnitAmountSelector.recalcSliderOutPos();
        }
        else {
            let slider = createSlider(min, max, startingVal, 1);
            slider.id('unitSlider');
            let recalcSliderOutPos = function () {
                let maxVal = parseInt(slider.attribute('max'));
                let minVal = parseInt(slider.attribute('min'));
                let range = maxVal - minVal;
                let sliderPrecent;
                if (range === 0) {
                    sliderPrecent = 0;
                }
                else {
                    sliderPrecent = ((slider.value() - minVal) / range) * 100;
                }
                let positionOffset = Math.round(CONTROL_THUMB_WIDTH * sliderPrecent / 100) - (CONTROL_THUMB_WIDTH / 2);
                sliderOut.html(slider.value());
                sliderOut.elt.style.left = 'calc(' + sliderPrecent + '% - ' + positionOffset + 'px)';
            }
            slider.input(recalcSliderOutPos);
            recalcSliderOutPos();
            UnitAmountSelector.slider = slider;
            UnitAmountSelector.recalcSliderOutPos = recalcSliderOutPos;
        }
        return UnitAmountSelector.slider;
    }
    let createSliderOut = function (startingVal) {
        let sliderOut = createElement('output');
        sliderOut.id('sliderOut');
        sliderOut.attribute('for', 'unitSlider');
        sliderOut.value(startingVal);
        return sliderOut;
    }
    let createSliderForm = function (opts) {
        let form = createElement('form');
        form.id('sliderForm');
        form.attribute('oninput', 'sliderOut.value = unitSlider.valueAsNumber');
        form.addClass('sliderForm');
        let sliderOut = createSliderOut(opts.startingVal ? opts.startingVal : opts.max);
        opts.sliderOut = sliderOut;
        let slider = updateSlider(opts);
        form.child(sliderOut);
        form.child(slider);
        UnitAmountSelector.sliderForm = form;
        return form;
    }
    let updateHeader = function (phaseNoun) {
        let headingText = 'How many units would you like to use for the ' + phaseNoun + '?';
        if (UnitAmountSelector.header) {
            UnitAmountSelector.header.html(headingText)
        }
        else {
            UnitAmountSelector.header = createElement('h2', headingText);
        }
        return UnitAmountSelector.header;
    }
    let updateActionButton = function (btnText, callback) {
        let mousePressHandler = () => {
            //headerBodyBackground.background.hide();
            callback(UnitAmountSelector.slider.value());
        };
        if (UnitAmountSelector.actionBtn) {
            removeAllEventHandlers(UnitAmountSelector.actionBtn);
            UnitAmountSelector.actionBtn.html(btnText);
            UnitAmountSelector.actionBtn.mousePressed(mousePressHandler);
        }
        else {
            let actionBtn = createButton(btnText);
            actionBtn.addClass('action-button');
            actionBtn.mousePressed(mousePressHandler);
            UnitAmountSelector.actionBtn = actionBtn;
        }
        return UnitAmountSelector.actionBtn;
    }
    UnitAmountSelector.update = function (opts) {
        updateSlider(opts);
        updateHeader(opts.phaseNoun);
        updateActionButton(opts.btnTxt, opts.btnCallback);
    }
    UnitAmountSelector.create = function (opts) {
        headerBodyBackground = getModalHeaderBodyBgDivs();
        updateHeader(opts.phaseNoun);
        createSliderForm(opts);
        updateActionButton(opts.btnTxt, opts.btnCallback);
    }
    let attachAmountSelectorElementsToModal = function () {
        headerBodyBackground.header.child(UnitAmountSelector.header);
        headerBodyBackground.body.child(UnitAmountSelector.sliderForm);
        headerBodyBackground.body.child(UnitAmountSelector.actionBtn);
    }
    UnitAmountSelector.attachToModal = function (opts) {
        if (UnitAmountSelector.created) {
            UnitAmountSelector.update(opts);
        }
        else {
            UnitAmountSelector.create(opts);
            UnitAmountSelector.created = true;
        }
        attachAmountSelectorElementsToModal();
        headerBodyBackground.background.show();
    }
    UnitAmountSelector.detachFromModal = function () {
        removeEltFromParent(UnitAmountSelector.header);
        removeEltFromParent(UnitAmountSelector.sliderForm);
        removeEltFromParent(UnitAmountSelector.actionBtn);
    }
    UnitAmountSelector.hide = function () {
        headerBodyBackground.background.hide();
    }
    return UnitAmountSelector;
})();
let diceResultWindow = (function diceResultWindow() {
    let headerBodyBg;
    let heading;
    //removeEltFromParent(heading);
    let generatePseudoRandom = function () {
        return Math.floor((Math.random() * 6) + 1);
    }
    let createLeftTriangle = function (btlDiv) {
        let triangle = createDiv('');
        triangle.addClass('left-triangle');
        btlDiv.child(triangle);
        diceResultWindow.triangles.push(triangle);
    }
    let createAttackerDie = function (btlDiv) {
        let die = createDiv(generatePseudoRandom());
        die.addClass('die-attacker');
        btlDiv.child(die);
        diceResultWindow.attackerDice.push(die);
    }
    let createDefenderDie = function (btlDiv) {
        let die = createDiv(generatePseudoRandom());
        die.addClass('die-defender');
        btlDiv.child(die);
        diceResultWindow.defenderDice.push(die);
    }
    let createEmptyBattleDiv = function () {
        let btlDiv = createDiv('');
        btlDiv.addClass('battle');
        return btlDiv;
    }
    let createBatttleDiv = function () {
        let btlDiv = createEmptyBattleDiv();
        let atkDie = createAttackerDie(btlDiv);
        let triangle = createLeftTriangle(btlDiv);
        let defDie = createDefenderDie(btlDiv);
        return btlDiv;
    }
    let addAttackerDefenderDice = function (diceDiv, attacking, defending) {
        diceResultWindow.attackerDice = [];
        diceResultWindow.defenderDice = [];
        diceResultWindow.triangles = [];
        let fullBattleDivs = Math.min(attacking, defending);
        for (i = 0; i < fullBattleDivs; i++) {
            diceDiv.child(createBatttleDiv());
        }
        let diceOverflow = function (createDie, overflow) {
            for (i = 0; i < overflow; i++) {
                let btlDiv = createEmptyBattleDiv();
                let die = createDie(btlDiv);
                diceDiv.child(btlDiv);
            }
        }
        if (attacking > fullBattleDivs) {
            diceOverflow(createAttackerDie, attacking - fullBattleDivs);
        }
        else if (defending > fullBattleDivs) {
            diceOverflow(createDefenderDie, defending - fullBattleDivs);
        }
    }
    let createDiceDiv = function (attackUnits, defendUnits) {
        let diceDiv = createDiv('');
        diceDiv.addClass('dice-div');
        addAttackerDefenderDice(diceDiv, attackUnits, defendUnits);
        return diceDiv;
    }
    let createRetreatButton = function () {
        return btnFactory.createButton({
            txt: 'Retreat'
            , callback: diceResultWindow.retreatCallback
            , classList: ['action-button']
            , attributes: {
                disabled: ''
            }
        });
    }
    let createKeepFighting = function (callback) {
        return btnFactory.createButton({
            txt: 'Keep Fighting'
            , callback: callback
            , classList: ['action-button']
            , attributes: {
                disabled: ''
            }
        });
    }
    let setTriangleSide = function (triangle, isLeft) {
        let removeClasses = (element) => {
            element.class('')
        };
        if (isLeft) {
            removeClasses(triangle);
            triangle.addClass('left-triangle');
            triangle.style('visibility', 'visible');
        }
        else {
            removeClasses(triangle);
            triangle.addClass('right-triangle');
            triangle.style('visibility', 'visible');
        }
    }
    diceResultWindow.setResults = function (randomArr, attackUnits, defendUnits, source, dest) {
        diceResultWindow.stopAnimation();
        enableIfDisabled(diceResultWindow.retreatBtn);
        let attackerResults = randomArr.slice(0, attackUnits);
        let defenderResults = randomArr.slice(attackUnits, attackUnits + defendUnits + 1);
        let byDescendingOrder = (a, b) => {
            return (b - a);
        };
        attackerResults = attackerResults.sort(byDescendingOrder);
        defenderResults = defenderResults.sort(byDescendingOrder);
        let setDieVal = (results) => {
            return (die, i) => {
                die.html(results[i])
            }
        };
        diceResultWindow.attackerDice.forEach(setDieVal(attackerResults));
        diceResultWindow.defenderDice.forEach(setDieVal(defenderResults));
        let setTriangles = (otherResults, otherIsAttacker) => {
            return (res, i) => {
                let triangle = diceResultWindow.triangles[i];
                let attackerResult;
                let defenderResult;
                if (!otherIsAttacker) {
                    attackerResult = res;
                    defenderResult = otherResults[i];
                }
                else {
                    attackerResult = otherResults[i];
                    defenderResult = res;
                }
                if (attackerResult > defenderResult) {
                    setTriangleSide(triangle, true);
                    dest.units--;
                }
                else {
                    setTriangleSide(triangle, false);
                    source.units--;
                }
            }
        }
        if (attackUnits > defendUnits) {
            defenderResults.forEach(setTriangles(attackerResults, true))
        }
        else {
            attackerResults.forEach(setTriangles(defenderResults, false));
        }
        // Enable fight again if attacker has enough units and 
        // defender still has defending units
        if ((source.units > 1) && (dest.units > 0)) {
            enableIfDisabled(diceResultWindow.keepFightingBtn);
        }
        else {
            /* Force closing of window and resolve the whole battle
               either giving control of destArea to attacker, or simply quiting
               because attacker cannot attack anymore due to insufficent units.
            */
            if (dest.units === 0) {
                // Attacker won and he owns the dest area
                delete dest.owner.areas[dest.name];
                dest.owner = source.owner;
                source.owner.areas[dest.name] = dest;
                diceResultWindow.detachFromModal();
                diceResultWindow.winCb(attackUnits);
            }
            else {
                // Attacker has insufficent units for attack, close the modal and let gui take control back
                diceResultWindow.detachFromModal();
                diceResultWindow.retreatCallback();
            }
        }
    }
    let createResultWindowElements = function (attacking, defending, keepFightingCallback) {
        headerBodyBg = getModalHeaderBodyBgDivs();
        heading = createElement('h2', 'Battle Results');
        diceResultWindow.diceDiv = createDiceDiv(attacking, defending);
        diceResultWindow.retreatBtn = createRetreatButton();
        diceResultWindow.keepFightingBtn = createKeepFighting(keepFightingCallback);
    }
    let updateResultWindowElements = function (attacking, defending, keepFightingCallback) {
        updateDiceDiv(attacking, defending);
        updateButtons(keepFightingCallback);
    }
    let updateDiceDiv = function (attacking, defending) {
        addAttackerDefenderDice(diceResultWindow.diceDiv, attacking, defending);
    }
    let updateButtons = function (keepFightingCb) {
        diceResultWindow.retreatBtn.mousePressed(diceResultWindow.retreatCallback);
        diceResultWindow.keepFightingBtn.mousePressed(keepFightingCb);
    }
    let attachResultWindowElements = function () {
        headerBodyBg.header.child(heading);
        headerBodyBg.body.child(diceResultWindow.diceDiv);
        headerBodyBg.body.child(diceResultWindow.retreatBtn);
        headerBodyBg.body.child(diceResultWindow.keepFightingBtn);
    }
    diceResultWindow.startAnimation = function () {
        diceResultWindow.intervalId = setInterval(() => {
            let dieCb = (die) => {
                die.html(generatePseudoRandom());
            };
            diceResultWindow.attackerDice.forEach(dieCb);
            diceResultWindow.defenderDice.forEach(dieCb);
        }, 125);
    }
    diceResultWindow.stopAnimation = function () {
        clearInterval(diceResultWindow.intervalId);
    }
    diceResultWindow.attachToModal = function ({
        attacking, defending, randomGen, source, dest, retreatCb, keepFightingCb, winCb
    }) {
        diceResultWindow.retreatCallback = () => {
            diceResultWindow.detachFromModal();
            retreatCb();
        };
        diceResultWindow.winCb = winCb;
        if (diceResultWindow.created) {
            updateResultWindowElements(attacking, defending, keepFightingCb);
        }
        else {
            createResultWindowElements(attacking, defending, keepFightingCb);
        }
        attachResultWindowElements();
        headerBodyBg.background.show();
        diceResultWindow.startAnimation();
        randomGen(attacking + defending, (randomArr) => {
            diceResultWindow.setResults(randomArr, attacking, defending, source, dest)
        });
    }
    diceResultWindow.detachFromModal = function () {
        headerBodyBg.background.hide();
        removeEltFromParent(heading);
        removeEltFromParent(diceResultWindow.diceDiv);
        removeBtnFromParent(diceResultWindow.retreatBtn);
        removeBtnFromParent(diceResultWindow.keepFightingBtn);
        let removeDie = (die) => {
            die.remove()
        };
        diceResultWindow.attackerDice.forEach(removeDie);
        diceResultWindow.defenderDice.forEach(removeDie);
    }
    return diceResultWindow;
})();