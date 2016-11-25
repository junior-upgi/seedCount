"use strict";

function deleteRecord(recordDatetime, prodFacilityID, prodLineID) {
    return "DELETE FROM productionHistory.dbo.seedCount WHERE " + "recordDatetime='" + recordDatetime + "' AND " + "prodFacilityID='" + prodFacilityID + "' AND " + "prodLineID='" + prodLineID + "';";
};

function getBroadcastRecord(startDatetimeString, endDatetimeString) {
    return "SELECT * FROM productionHistory.dbo.seedCountBroadcastRecord WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "' ORDER BY recordDatetime DESC;";
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

function insertRecord(recordDatetime, prodFacilityID, prodLineID, prodReference, thickness, count_0, count_1, count_2, count_3, count_4, count_5, note, photoLocation, created, modified) {
    return "INSERT INTO productionHistory.dbo.seedCount VALUES ('" + recordDatetime + "','" + prodFacilityID + "','" + prodLineID + "','" + prodReference + "','" + thickness + "'," + count_0 + "," + count_1 + "," + count_2 + "," + count_3 + "," + count_4 + "," + count_5 + "," + (note === "" ? "NULL" : "'" + note + "'") + "," + (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",'" + created + "','" + modified + "');";
};

function updateRecord(recordDatetime, prodFacilityID, prodLineID, prodReference, thickness, count_0, count_1, count_2, count_3, count_4, count_5, note, photoLocation, modified) {
    return "UPDATE productionHistory.dbo.seedCount SET " + "prodReference='" + prodReference + "',thickness=" + thickness + ",count_0=" + count_0 + ",count_1=" + count_1 + ",count_2=" + count_2 + ",count_3=" + count_3 + ",count_4=" + count_4 + ",count_5=" + count_5 + ",note=" + (note === "" ? "NULL" : "'" + note + "'") + ",photoLocation=" + (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",modified='" + modified + "' WHERE " + "recordDatetime='" + recordDatetime + "' AND prodFacilityID='" + prodFacilityID + "' AND prodLineID='" + prodLineID + "';";
};

module.exports = {
    deleteRecord,
    getBroadcastRecord,
    getRecord,
    getRecordCount,
    getSeedCountRecordsBetweenDate,
    insertRecord,
    updateRecord
};