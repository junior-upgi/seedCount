"use strict";

var moment = require("moment-timezone");

var list = [{
    reference: "day",
    cReference: "早班",
    start: "07:30",
    end: "15:30",
    inspectTimePointList: [{
            timePoint: "08:00",
            trimmedTimePoint: "0800",
            hidden: true
        },
        {
            timePoint: "10:00",
            trimmedTimePoint: "1000",
            hidden: true
        },
        {
            timePoint: "12:00",
            trimmedTimePoint: "1200",
            hidden: true
        },
        {
            timePoint: "14:00",
            trimmedTimePoint: "1400",
            hidden: false
        }
    ],
    duration: 480
}, {
    reference: "night",
    cReference: "中班",
    start: "15:30",
    end: "23:30",
    inspectTimePointList: [{
            timePoint: "16:00",
            trimmedTimePoint: "1600",
            hidden: true
        },
        {
            timePoint: "18:00",
            trimmedTimePoint: "1800",
            hidden: true
        },
        {
            timePoint: "20:00",
            trimmedTimePoint: "2000",
            hidden: true
        },
        {
            timePoint: "22:00",
            trimmedTimePoint: "2200",
            hidden: false
        }
    ],
    duration: 480
}, {
    reference: "graveYard",
    cReference: "夜班",
    start: "23:30",
    end: "07:30",
    inspectTimePointList: [{
            timePoint: "00:00",
            trimmedTimePoint: "0000",
            hidden: true
        },
        {
            timePoint: "02:00",
            trimmedTimePoint: "0200",
            hidden: true
        },
        {
            timePoint: "04:00",
            trimmedTimePoint: "0400",
            hidden: true
        },
        {
            timePoint: "06:00",
            trimmedTimePoint: "0600",
            hidden: false
        }
    ],
    duration: 480
}];

function getShiftObject(datetimeString) {
    var hour = datetimeString.slice(11, 13);
    var minute = datetimeString.slice(14, 16);
    switch (true) {
        case (((hour == 7) && (minute >= 30)) || ((hour >= 8) && (hour <= 14)) || ((hour == 15) && (minute < 30))):
            return list[0];
        case (((hour == 15) && (minute >= 30)) || ((hour >= 16) && (hour <= 22)) || ((hour == 23) && (minute < 30))):
            return list[1];
        case ((hour == 23) && (minute >= 30)):
        case (((hour >= 0) && (hour <= 6)) || ((hour == 7) && (minute < 30))):
            return list[2];
        default:
            throw "unable to retrieve correct shift data";
    }
}

function getWorkingDateString(datetimeString) {
    var datetimeObject = moment(datetimeString, "YYYY-MM-DD HH:mm:ss");
    if (datetimeObject.isSameOrAfter(datetimeObject.format("YYYY-MM-DD") + ' 07:30:00')) {
        return (datetimeObject.format("YYYY-MM-DD"));
    } else {
        return (datetimeObject.add(-1, "days").format("YYYY-MM-DD"));
    }
};

function getWorkDatetimeString(workingDateString, workingTime) {
    if (((workingTime.slice(0, 2) >= 0) && (workingTime.slice(0, 2) <= 6)) || ((workingTime.slice(0, 2) == 7) && (workingTime.slice(3, 5) >= 0) && (workingTime.slice(3, 5) < 30))) {
        return moment(workingDateString + " " + workingTime + ":00", "YYYY-MM-DD HH:mm:ss").add(1, "days").format("YYYY-MM-DD HH:mm:ss");
    } else {
        return moment(workingDateString + " " + workingTime + ":00", "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss");
    }
};

module.exports = {
    list,
    getShiftObject,
    getWorkingDateString,
    getWorkDatetimeString
};