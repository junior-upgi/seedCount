var moment = require("moment-timezone");

var workingTimezone = "Asia/Taipei";

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

function getWorkDateString(datetimeObject) {
    if (datetimeObject.isSameOrAfter(datetimeObject.format("YYYY-MM-DD") + ' 07:30:00')) {
        return (datetimeObject.tz(workingTimezone).format("YYYY-MM-DD"));
    } else {
        var tempMoment = moment(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
        return (tempMoment.add(-1, "days").tz(workingTimezone).format("YYYY-MM-DD"));
    }
};

function getWorkDatetimeString(workingDateString, workingTime) {
    switch (true) {
        case (workingTime === list[0].inspectTimePointList[0].timePoint):
        case (workingTime === list[0].inspectTimePointList[1].timePoint):
        case (workingTime === list[0].inspectTimePointList[2].timePoint):
        case (workingTime === list[0].inspectTimePointList[3].timePoint):
        case (workingTime === list[1].inspectTimePointList[0].timePoint):
        case (workingTime === list[1].inspectTimePointList[1].timePoint):
        case (workingTime === list[1].inspectTimePointList[2].timePoint):
        case (workingTime === list[1].inspectTimePointList[3].timePoint):
            return (moment(workingDateString).format("YYYY-MM-DD") + " " + workingTime + ":00");
        case (workingTime === list[2].inspectTimePointList[0].timePoint):
        case (workingTime === list[2].inspectTimePointList[1].timePoint):
        case (workingTime === list[2].inspectTimePointList[2].timePoint):
        case (workingTime === list[2].inspectTimePointList[3].timePoint):
            return (moment(workingDateString).add(1, "days").format("YYYY-MM-DD") + " " + workingTime + ":00");
        default:
            alert("時間資料錯誤，無法建置正確工作時間。請通知 IT 重新啟動系統後台服務...");
            return false;
    }
};

module.exports = {
    workingTimezone,
    list,
    getWorkDateString,
    getWorkDatetimeString
};