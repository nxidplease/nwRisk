const MAX_ATTACKERS = 3;
const MAX_DEFENDERS = 2;

function BattleDialogController(sourceArea, destArea) {
    this.sourceArea = sourceArea;
    this.destArea = destArea;
    this.modalBackground = select('.modal-background');
    this.modalContentDiv = select('.modal-content');

    if (this.modalBackground === null) {
        this.modalBackground = createDiv('');
        this.modalBackground.addClass('modal-background');
        this.modalContentDiv = createDiv('');
        this.modalContentDiv.addClass('modal-content');
    }

    var maxAttackers = Math.min(this.sourceArea.units - 1, MAX_ATTACKERS);
    buildHtml(maxAttackers);

    this.show = function () {
        this.modalBackground.elt.style.display = 'block';
    }

    var buildHtml = function (maxSliderVal) {
        var slider = createSlider(1, maxSliderVal, maxSliderVal, 1);
        var header = createElement('h2', 'How many units would you like to use?');
        var headerDiv = createDiv('');
        var bodyDiv = createDiv('');
        headerDiv.addClass('modal-header');
        headerDiv.child(header);

        bodyDiv.addClass('modal-body');
        bodyDiv.child(slider);
        this.modalContentDiv.child(headerDiv);
        this.modalContentDiv.child(bodyDiv);

    }
}