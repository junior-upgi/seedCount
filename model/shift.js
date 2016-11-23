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
    var datetimeObject = moment(datetimeString, "YYYY-MM-DD HH:mm:ss");
    var workingDate = getWorkingDateString(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
    var shiftTimePointList = [
        moment(getWorkDatetimeString(workingDate, list[0].start), "YYYY-MM-DD HH:mm:ss").subtract(1, "days"),
        moment(getWorkDatetimeString(workingDate, list[1].start), "YYYY-MM-DD HH:mm:ss"),
        moment(getWorkDatetimeString(workingDate, list[2].start), "YYYY-MM-DD HH:mm:ss"),
        moment(getWorkDatetimeString(workingDate, list[0].start), "YYYY-MM-DD HH:mm:ss").add(1, "days")
    ];
    switch (true) {
        case (datetimeObject.isBefore(shiftTimePointList[3]) &&
            datetimeObject.isSameOrAfter(shiftTimePointList[2])):
            return list[2];
        case (datetimeObject.isBefore(shiftTimePointList[2]) &&
            datetimeObject.isSameOrAfter(shiftTimePointList[1])):
            return list[1];
        case (datetimeObject.isBefore(shiftTimePointList[1]) &&
            datetimeObject.isSameOrAfter(shiftTimePointList[0])):
            return list[0];
        default:
            throw "cannot get the correct shift data";
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
    if (((workingTime.slice(0, 2) >= 0) && (workingTime.slice(0, 2) <= 7)) &&
        ((workingTime.slice(3, 5) >= 0) && (workingTime.slice(3, 5) <= 30))) {
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