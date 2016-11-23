"use strict";

function deleteRecord(recordDatetime, prodFacilityID, prodLineID) {
    return "DELETE FROM productionHistory.dbo.seedCount WHERE " + "recordDatetime='" + recordDatetime + "' AND " + "prodFacilityID='" + prodFacilityID + "' AND " + "prodLineID='" + prodLineID + "';";
};

function getRecord(recordDatetime, prodFacilityID, prodLineID) {
    return "SELECT photoLocation FROM productionHistory.dbo.seedCount WHERE " + "recordDatetime='" + recordDatetime + "' AND " + "prodFacilityID='" + prodFacilityID + "' AND " + "prodLineID='" + prodLineID + "';";
};

function getRecordCount(startDatetimeString, endDatetimeString) {
    return "SELECT COUNT(*) AS recordCount FROM productionHistory.dbo.seedCount WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "';";
};

function getSeedCountRecordsBetweenDate(startDatetimeString, endDatetimeString) {
    return "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "' ORDER BY recordDatetime,prodLineID;";
};

module.exports = {
    deleteRecord,
    getRecord,
    getRecordCount,
    getSeedCountRecordsBetweenDate
};