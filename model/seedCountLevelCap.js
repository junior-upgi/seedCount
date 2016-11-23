"use strict";

var setting = [{
    situation: "良好",
    ceiling: 4,
    color: "green"
}, {
    situation: "正常",
    ceiling: 8,
    color: "black"
}, {
    situation: "偏高",
    ceiling: 10,
    color: "blue"
}, {
    situation: "嚴重",
    ceiling: 9999,
    color: "red"
}];

function applyHtmlColor(value) {
    switch (true) {
        case (value < setting[0].ceiling):
            return value;
        case (value < setting[1].ceiling):
            return value;
        case (value < setting[2].ceiling):
            return '<b>' + value + '</b>';
        default:
            return '<b>' + value + '</b>';
    }
}

module.exports = {
    setting,
    applyHtmlColor
};