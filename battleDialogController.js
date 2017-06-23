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
function BattleDialogController(sourceArea, destArea) {
    this.sourceArea = sourceArea;
    this.destArea = destArea;
    // Calculate maximum attackers amount and pass it to the view
    this.view = new BattleDialogView(Math.min(this.sourceArea.units - 1, MAX_ATTACKERS));
    this.show = this.view.show.bind(this.view);
    this.attackerPhase = function () {}
}
/*
    This class is in charge of building the html of the dialog
*/
function UnitAmountSelector(maxSliderVal, callback) {
    let headerBodyBackground = getModalHeaderBodyBgDivs();
    let updateSlider = function (mavVal) {
        // If slider was created previously, only update it's maxVal
        if (UnitAmountSelector.slider) {
            UnitAmountSelector.slider.attribute('max', maxVal);
        }
        else {
            let slider = createSlider(1, maxSliderVal, maxSliderVal, 1);
            slider.id('unitSlider');
            createSliderOut(maxVal);
            let sliderOut = UnitAmountSelector.sliderOut;
            sliderOut.value = maxSliderVal;
            slider.input(recalcSliderOutPos);
            let recalcSliderOutPos = function () {
                let maxVal = parseInt(slider.attribute('max'));
                let minVal = parseInt(slider.attribute('min'));
                let range = maxVal - minVal;
                let sliderPecent = ((slider.value() - minVal) / range) * 100;
                let positionOffset = Math.round(CONTROL_THUMB_WIDTH * sliderPecent / 100) - (CONTROL_THUMB_WIDTH / 2);
                sliderOut.elt.style.left = 'calc(' + sliderPecent + '% - ' + positionOffset + 'px)';
            }
            recalcSliderOutPos();
            UnitAmountSelector.slider = slider;
        }
    }
    let createSliderOut = function () {
        if (UnitAmountSelector.sliderOut) {
            return UnitAmountSelector.sliderOut;
        }
        else {
            let sliderOut = createElement('output');
            sliderOut.id('sliderOut');
            sliderOut.attribute('for', 'unitSlider');
            UnitAmountSelector.sliderOut = sliderOut;
            return sliderOut;
        }
    }
    let createSliderForm = function () {
            let form = createElement('form');
            form.id('sliderForm');
            form.attribute('oninput', 'sliderOut.value = unitSlider.valueAsNumber');
            form.addClass('sliderForm');
            return form;
        }
        // Setting slider style
    var slider = createSlider(1, maxSliderVal, maxSliderVal, 1);
    slider.id('unitSlider');
    var header = createElement('h2', 'How many units would you like to use for the attack?');
    var headerDiv = createDiv('');
    var bodyDiv = createDiv('');
    var form = createElement('form');
    form.id('sliderForm');
    form.attribute('oninput', 'sliderOut.value = unitSlider.valueAsNumber');
    form.addClass('sliderForm');
    var actionBtn = createButton('Attack');
    actionBtn.addClass('action-button');
    var sliderOut = createElement('output');
    sliderOut.id('sliderOut');
    sliderOut.attribute('for', 'unitSlider');
    sliderOut.value = maxSliderVal;
    slider.input(function () {
        var maxVal = parseInt(slider.attribute('max'));
        var minVal = parseInt(slider.attribute('min'));
        var range = maxVal - minVal;
        var sliderPecent = ((slider.value() - minVal) / range) * 100;
        var positionOffset = Math.round(CONTROL_THUMB_WIDTH * sliderPecent / 100) - (CONTROL_THUMB_WIDTH / 2);
        sliderOut.elt.style.left = 'calc(' + sliderPecent + '% - ' + positionOffset + 'px)';
    });
    actionBtn.mousePressed(() => {
        bgAndContent.background.elt.style.display = 'none';
        callback(slider.value());
    })
    headerDiv.addClass('modal-header');
    headerDiv.child(header);
    bodyDiv.addClass('modal-body');
    bodyDiv.child(form);
    form.child(sliderOut);
    form.child(slider);
    bodyDiv.child(actionBtn);
    bgAndContent.content.child(headerDiv);
    bgAndContent.content.child(bodyDiv);
    this.show = function () {
        bgAndContent.background.elt.style.display = 'block';
    }
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
        modalBackground.child(this.modalContentDiv);
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