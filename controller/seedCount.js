var moment = require("moment-timezone");

var database = require("../module/database.js");
var shift = require("../model/shift.js");

exports.getRecordCount = function(request, response, dateString) {
    var workDateStartTime = moment(shift.getWorkDatetimeString(dateString, "07:30"), "YYYY-MM-DD HH:mm:ss");
    var workDateEndTime = moment(workDateStartTime, "YYYY-MM-DD HH:mm:ss").add(1, "days").subtract(1, "milliseconds");
    var query = "SELECT COUNT(*) AS recordCount FROM productionHistory.dbo.seedCount WHERE recordDatetime BETWEEN '" + workDateStartTime.format("YYYY-MM-DD HH:mm:ss") + "' AND '" + workDateEndTime.format("YYYY-MM-DD HH:mm:ss") + "';";
    database.executeSql(query, function(data, error) {
        if (error) {
            response.writeHead(500, "internal error occurred", { "Content-Type": "text/html" });
            response.write("internal error occurred: " + error);
            response.status(200).end();
        } else {
            response.writeHead(200)
        }
    });
};

exports.getRecordset = function(request, response) {

};

exports.getRecord = function(request, response, identificationObject) {

};

exports.insertRecord = function(request, response, recordObject) {

};

exports.updateRecord = function(request, response, identificationObject) {

};

exports.deleteRecord = function(request, response, identificationObject) {

};