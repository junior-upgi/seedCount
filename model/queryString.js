function getSeedCountRecordsBetweenDate(startDatetimeString, endDatetimeString) {
    return "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDatetime BETWEEN '" + startDatetimeString + "' AND '" + endDatetimeString + "' ORDER BY recordDatetime,prodLineID;";
};

module.exports = {
    getSeedCountRecordsBetweenDate
};