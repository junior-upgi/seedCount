"use strict";

function getWorkDateString(datetimeObject) {
    if (datetimeObject.isSameOrAfter(datetimeObject.format("YYYY-MM-DD") + ' 07:30:00')) {
        return (datetimeObject.tz("Asia/Taipei").format("YYYY-MM-DD"));
    } else {
        var tempMoment = moment(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
        return (tempMoment.add(-1, "day").tz("Asia/Taipei").format("YYYY-MM-DD"));
    }
};

function getWorkDatetimeString(workingDateString, workingTime) {
    switch (true) {
        case (workingTime == shiftList[0].inspectTimePointList[0].timePoint):
        case (workingTime == shiftList[0].inspectTimePointList[1].timePoint):
        case (workingTime == shiftList[0].inspectTimePointList[2].timePoint):
        case (workingTime == shiftList[0].inspectTimePointList[3].timePoint):
        case (workingTime == shiftList[1].inspectTimePointList[0].timePoint):
        case (workingTime == shiftList[1].inspectTimePointList[1].timePoint):
        case (workingTime == shiftList[1].inspectTimePointList[2].timePoint):
        case (workingTime == shiftList[1].inspectTimePointList[3].timePoint):
            return (moment(workingDateString).format("YYYY-MM-DD") + " " + workingTime + ":00");
        case (workingTime == shiftList[2].inspectTimePointList[0].timePoint):
        case (workingTime == shiftList[2].inspectTimePointList[1].timePoint):
        case (workingTime == shiftList[2].inspectTimePointList[2].timePoint):
        case (workingTime == shiftList[2].inspectTimePointList[3].timePoint):
            return (moment(workingDateString).add(1, "days").format("YYYY-MM-DD") + " " + workingTime + ":00");
        default:
            alert("發現錯誤時間資料，無法建置正確工作時間。請通知 IT 重新啟動系統後台服務...");
            refresh();
    }
};