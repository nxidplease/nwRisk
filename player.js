
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
    
    this.addCard = function (new_card) {
        this.card.add(new_card);
    }
}