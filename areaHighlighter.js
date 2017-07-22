let areaHighlighter = (function () {
        'use strict';

        function highlightPixel(x, y, gameMap) {
            let pixIndex = 4 * (x + y * gameMap.width);
            // For starters make the pixel greener
            let r = gameMap.pixels[pixIndex];
            let g = gameMap.pixels[pixIndex + 1];
            let b = gameMap.pixels[pixIndex + 2];
            if (r != 0 && g != 0 && b != 0) {
                gameMap.pixels[pixIndex] = r * 0.5;
                gameMap.pixels[pixIndex + 1] = (g * 0.5 + 100) % 256;
                gameMap.pixels[pixIndex + 2] = b * 0.5;
            }
        }

        function setPixColor(x, y, rgb, gameMap) {
            let pixIndex = 4 * (x + y * gameMap.width);
            gameMap.pixels[pixIndex] = rgb[0];
            gameMap.pixels[pixIndex + 1] = rgb[1];
            gameMap.pixels[pixIndex + 2] = rgb[2];
        }

        function highlightArea(area, gameMap) {
            // highlight all pixels of the area
            for (i = 0; i < area.pixPos.length; i++) {
                highlightPixel(area.pixPos[i].x, area.pixPos[i].y, gameMap);
            }
            gameMap.updatePixels();
        }

        function resetAreaHighlight(areas, highlightedAreaName, gameMap, areaName) {
            let areaPix;
            if (areaName) {
                areaPix = areas[areaName].pixPos;
            }
            else {
                areaPix = areas[highlightedAreaName].pixPos;
                highlightedAreaName = '';
            }
            for (i = 0; i < areaPix.length; i++) {
                setPixColor(areaPix[i].x, areaPix[i].y, areaPix[i].rgb, gameMap);
            }
            gameMap.updatePixels();
        }

        function getCurrColor(colorMap, mouseX, mouseY) {
            let r = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width)];
            let g = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 1];
            let b = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 2];
            let a = colorMap.pixels[4 * (mouseX + mouseY * colorMap.width) + 3];
            return (hex(r, 2) + hex(g, 2) + hex(b, 2));
        }
        return {
            getCurrColor: getCurrColor
            , highlightArea: highlightArea
            , resetAreaHighlight: resetAreaHighlight
        }
    }
    ());