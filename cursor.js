const MIN_SPACE = 5;
const MAX_SPACE = 15;

function Cursor() {
    this.pos = createVector(width / 2, height / 2);
    this.transp = '1.0';
    this.space = 5;
    this.stepSize = 1;
    this.speedMod = 1.0;
    this.storkeSize = 10;
    this.moveRight = false;
    this.moveLeft = false;
    this.moveUp = false;
    this.moveDown = false;

    this.update = function () {

        var dx = 0;
        var dy = 0;

        if (this.moveUp) {
            dy = -this.stepSize;
        } else if (this.moveDown) {
            dy = this.stepSize;
        }

        if (this.moveRight) {
            dx = this.stepSize;
        } else if (this.moveLeft) {
            dx = -this.stepSize;
        }

        dx = dx * this.speedMod;
        dy = dy * this.speedMod;

        this.pos.x = this.pos.x + dx;
        this.pos.y = this.pos.y + dy;

        if (this.pos.x > width) {
            this.pos.x = width;
        }

        if (this.pos.x < 0) {
            this.pos.x = 0;
        }

        if (this.pos.y > height) {
            this.pos.y = height;
        }

        if (this.pos.y < 0) {
            this.pos.y = 0;
        }
    }

    this.show = function () {
        strokeWeight(2);
        stroke('rgba(150, 0, 0,' + this.transp + ')');
        line(this.pos.x + this.space, this.pos.y, this.pos.x + (this.space + this.storkeSize), this.pos.y);
        line(this.pos.x - this.space, this.pos.y, this.pos.x - (this.space + this.storkeSize), this.pos.y);
        line(this.pos.x, this.pos.y - this.space, this.pos.x, this.pos.y - (this.space + this.storkeSize));
        line(this.pos.x, this.pos.y + this.space, this.pos.x, this.pos.y + (this.space + this.storkeSize));
    }

    this.handleMouseWheel = function (e) {
        if (e.deltaY < 0) {
            this.space = this.space * 0.8;
            if (this.space < MIN_SPACE) {
                this.space = MIN_SPACE;
            }
        } else {
            this.space = this.space * 1.2;

            if (this.space > MAX_SPACE) {
                this.space = MAX_SPACE;
            }
        }
    }

    this.handleKeyPressed = function () {
        if (keyCode == UP_ARROW) {
            this.moveUp = true;
        }

        if (keyCode == DOWN_ARROW) {
            this.moveDown = true;
        }

        if (keyCode == RIGHT_ARROW) {
            this.moveRight = true;
        }

        if (keyCode == LEFT_ARROW) {
            this.moveLeft = true;
        }

        if (keyCode == SHIFT) {
            this.speedMod = 3.0;
        }

        if (keyCode == CONTROL) {
            this.speedMod = 0.25;
        }

        if (keyCode == ALT) {
            this.transp = '0';
        }
    }

    this.handleKeyReleased = function () {
        if (keyCode == UP_ARROW) {
            this.moveUp = false;
        }

        if (keyCode == DOWN_ARROW) {
            this.moveDown = false;
        }

        if (keyCode == RIGHT_ARROW) {
            this.moveRight = false;
        }

        if (keyCode == LEFT_ARROW) {
            this.moveLeft = false;
        }

        if (keyCode == SHIFT || keyCode == CONTROL) {
            this.speedMod = 1.0;
        }

        if (keyCode == ALT) {
            this.transp = '1.0';
        }
    }
}