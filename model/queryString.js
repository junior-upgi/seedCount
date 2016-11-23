"use strict";

function getRecordCount(startDatetimeString, endDatetimeString) {
    return "SELECT COUNT(*) AS recordCount FROM productionHistory.dbo.seedCount WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "';";
};

function getSeedCountRecordsBetweenDate(startDatetimeString, endDatetimeString) {
    return "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "' ORDER BY recordDatetime,prodLineID;";
};

module.exports = {
    getRecordCount,
    getSeedCountRecordsBetweenDate
};