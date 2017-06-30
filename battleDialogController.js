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
        This class is in charge of all the logic behind the dialog
    */
function BattleDialogController(sourceArea, destArea, generateRandoms) {
    this.sourceArea = sourceArea;
    this.destArea = destArea;
    // Calculate maximum attackers amount and pass it to the view
    this.attackerPhase = function () {
        UnitAmountSelector.attachToModal({
            maxVal: Math.min(this.sourceArea.units - 1, MAX_ATTACKERS)
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
            maxVal: Math.min(this.destArea.units, MAX_DEFENDERS)
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
        diceResultWindow.attachToModal(this.attackerUnits, this.defendingUnits, generateRandoms);
    };
    this.attackerPhase();
}
/*
    This class is in charge of building the html of the dialog
*/
function UnitAmountSelector() {
    let headerBodyBackground = getModalHeaderBodyBgDivs();
    let updateSlider = function (maxVal, sliderOut) {
        // If slider was created previously, only update it's maxVal
        if (UnitAmountSelector.slider) {
            UnitAmountSelector.slider.attribute('max', maxVal);
            UnitAmountSelector.slider.value(maxVal);
            UnitAmountSelector.recalcSliderOutPos();
        }
        else {
            let slider = createSlider(1, maxVal, maxVal, 1);
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
    let createSliderOut = function (maxVal) {
        let sliderOut = createElement('output');
        sliderOut.id('sliderOut');
        sliderOut.attribute('for', 'unitSlider');
        sliderOut.value(maxVal);
        return sliderOut;
    }
    let createSliderForm = function (maxSliderVal) {
        let form = createElement('form');
        form.id('sliderForm');
        form.attribute('oninput', 'sliderOut.value = unitSlider.valueAsNumber');
        form.addClass('sliderForm');
        let sliderOut = createSliderOut(maxSliderVal);
        let slider = updateSlider(maxSliderVal, sliderOut);
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
        updateSlider(opts.maxVal);
        updateHeader(opts.phaseNoun);
        updateActionButton(opts.btnTxt, opts.btnCallback);
    }
    UnitAmountSelector.create = function (opts) {
        updateHeader(opts.phaseNoun);
        createSliderForm(opts.maxVal);
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
            attachAmountSelectorElementsToModal();
            headerBodyBackground.background.show();
        }
        else {
            UnitAmountSelector.create(opts);
            attachAmountSelectorElementsToModal();
            headerBodyBackground.background.show();
            UnitAmountSelector.created = true;
        }
    }
    let removeEltFromParent = function (p5Element) {
        let elt = p5Element.elt;
        elt.parentNode.removeChild(elt);
    }
    UnitAmountSelector.detachFromModal = function () {
        removeEltFromParent(UnitAmountSelector.header);
        removeEltFromParent(UnitAmountSelector.sliderForm);
        removeEltFromParent(UnitAmountSelector.actionBtn);
    }
    UnitAmountSelector.hide = function () {
        headerBodyBackground.background.hide();
    }
}

function diceResultWindow() {
    let headerBodyBg = getModalHeaderBodyBgDivs();
    let heading = createElement('h2', 'Battle Results');
    let generatePseudoRandom = function () {
        return Math.floor((Math.random() * 6) + 1);
    }
    let createLeftTriangle = function () {
        let triangle = createDiv('');
        triangle.addClass('left-triangle');
        return triangle;
    }
    let createAttackerDie = function () {
        let die = createDiv(generatePseudoRandom());
        die.addClass('die-attacker');
        return die;
    }
    let createDefenderDie = function () {
        let die = createDiv(generatePseudoRandom());
        die.addClass('die-defender');
        return die;
    }
    let createEmptyBattleDiv = function () {
        let btlDiv = createDiv('');
        btlDiv.addClass('battle');
        return btlDiv;
    }
    let createBatttleDiv = function () {
        let btlDiv = createEmptyBattleDiv();
        let atkDie = createAttackerDie();
        let defDie = createDefenderDie();
        let triangle = createLeftTriangle();
        btlDiv.child(atkDie);
        btlDiv.child(triangle);
        btlDiv.child(defDie);
        diceResultWindow.attackerDice.push(atkDie);
        diceResultWindow.defenderDice.push(defDie);
        diceResultWindow.triangles.push(triangle);
        return btlDiv;
    }
    let createDiceDiv = function (attackUnits, defendUnits) {
        diceResultWindow.attackerDice = [];
        diceResultWindow.defenderDice = [];
        diceResultWindow.triangles = [];
        let fightingUnits = attackUnits + defendUnits;
        let diceDiv = createDiv('');
        diceDiv.addClass('dice-div');
        for (i = 0; i < Math.floor(fightingUnits / 2); i++) {
            diceDiv.child(createBatttleDiv());
        }
        if (fightingUnits % 2 !== 0) {
            let btlDiv = createEmptyBattleDiv();
            if (attackUnits > defendUnits) {
                let atkDie = createAttackerDie();
                btlDiv.child(atkDie);
                diceResultWindow.attackerDice.push(atkDie);
            }
            else {
                let defDie = createDefenderDie();
                defDie.addClass('float-right');
                btlDiv.child(defDie);
                diceResultWindow.defenderDice.push(defDie);
            }
            diceDiv.child(btlDiv);
        }
        return diceDiv;
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
    diceResultWindow.setResults = function (randomArr, attackUnits, defendUnits) {
        diceResultWindow.stopAnimation();
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
                }
                else {
                    setTriangleSide(triangle, false);
                }
            }
        }
        if (attackUnits > defendUnits) {
            defenderResults.forEach(setTriangles(attackerResults, true))
        }
        else {
            attackerResults.forEach(setTriangles(defenderResults, false));
        }
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
    diceResultWindow.attachToModal = function (attackUnits, defendUnits, generateRandoms) {
        headerBodyBg.header.child(heading);
        headerBodyBg.body.child(createDiceDiv(attackUnits, defendUnits));
        headerBodyBg.background.show();
        diceResultWindow.startAnimation();
        generateRandoms(attackUnits + defendUnits, (randomArr) => {
            diceResultWindow.setResults(randomArr, attackUnits, defendUnits)
        });
    }
    diceResultWindow.detachFromModal = function () {}
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