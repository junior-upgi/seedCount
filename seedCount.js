"use strict";

var bodyParser = require("body-parser");
var fs = require("fs");
var express = require("express");
var morgan = require("morgan");
var moment = require("moment-timezone");
var mssql = require("mssql");
var multer = require("multer");
var httpRequest = require("request");

var config = require("./config.js");
var shift = require("./model/shift.js");
var prodLine = require("./model/prodLine.js");
var facility = require("./model/facility.js");
var upgiSystem = require("./model/upgiSystem.js");
var seedCountLevelCap = require("./model/seedCountLevelCap.js");
var telegram = require("./model/telegram");
var telegramBot = require("./model/telegramBot");
var telegramChat = require("./model/telegramChat");
//var telegramUser = require("./model/telegramUser");
var queryString = require("./model/queryString");

var app = express();
app.set("view engine", "ejs");
app.use(morgan("dev")); // log request and result to console
app.use(bodyParser.urlencoded({ extended: true })); // parse application/x-www-form-urlencoded
var urlencodedParser = bodyParser.urlencoded({ extended: true });
app.use(bodyParser.json()); // parse application/json
//var jsonParser = bodyParser.json();

app.use("/seedCount/frontend/js", express.static("./frontend/js")); // serve javascript files for frontend website
app.use("/seedCount/frontend/template", express.static("./frontend/template")); // serve front end website

// at system start up, make sure that file structure to hold seed image exists and start static image server
var fileStructureValidated = false;
var seedImageDirectory = "seedImage";
var upload = multer({ dest: seedImageDirectory + "/" });
if (fileStructureValidated !== true) {
    prodLine.list.forEach(function(indexedProdLine) { // generate image storage file structure according to prodLine list
        if (!fs.existsSync(seedImageDirectory + "/" + indexedProdLine.reference)) {
            fs.mkdirSync(seedImageDirectory + "/" + indexedProdLine.reference);
        }
    });
    fileStructureValidated = true;
    app.use("/seedCount/" + seedImageDirectory, express.static("./" + seedImageDirectory)); // serve static image files
    console.log("glass image being served... (" + config.serverHost + ":" + config.serverPort + "/" + seedImageDirectory + ")");
}

app.listen(config.serverPort); // start server
console.log("seedCount monitor server in operation... (" + config.serverHost + ":" + config.serverPort + ")");
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/seedCount/index", function(request, response) { // serve front page
    return response.status(200).sendFile(__dirname + "/frontend/index.html");
});

app.get("/seedCount/mobile", function(request, response) { // serve mobile portal page
    return response.status(200).sendFile(__dirname + "/frontend/mobile.html");
});

app.get("/seedCount/mobileEntry", function(request, response) { // serve mobile entry page
    return response.status(200).render("mobileEntry", {
        prodLineID: request.query.prodLineID
    });
});

app.get("/seedCount/api/getConfigData", function(request, response) {
    return response.status(200).json({
        workingTimezone: config.workingTimezone,
        serverHost: config.serverHost,
        serverPort: config.serverPort,
        telegramStatusUrl: telegram.statusUrl,
        broadcastServerHost: config.broadcastServerHost,
        broadcastServerPort: config.broadcastServerPort,
        seedCountSituationTableSetting: {
            hideProdReferenceColumn: upgiSystem.list[2].setting.hideProdReferenceColumn,
            hideTimePointColumn: upgiSystem.list[2].setting.hideTimePointColumn,
            preventDisplay: upgiSystem.list[2].setting.preventDisplay
        }
    });
});

app.get("/seedCount/api/getWorkingDateString", function(request, response) {
    return response.status(200).send(shift.getWorkingDateString(request.query.datetimeString));
});

app.get("/seedCount/api/getWorkDatetimeString", function(request, response) {
    return response.status(200).send(shift.getWorkDatetimeString(request.query.workingDateString, request.query.workingTime));
});

app.get("/seedCount/api/getShiftData", function(request, response) {
    return response.status(200).json(shift.list);
});

app.get("/seedCount/api/getProdLineData", function(request, response) {
    return response.status(200).json(prodLine.list);
});

app.get("/seedCount/api/getFacilityData", function(request, response) {
    return response.status(200).json(facility.list);
});

app.get("/seedCount/api/getSeedCountLevelCapData", function(request, response) {
    return response.status(200).json(seedCountLevelCap.setting);
});

app.get("/seedCount/api/broadcast/shiftData", function(request, response) {
    var datetimeObject = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    var workingDateString = shift.getWorkingDateString(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
    var shiftObject = shift.getShiftObject(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
    var shiftStartDatetime = shift.getWorkDatetimeString(workingDateString, shiftObject.start);
    if (shiftObject.reference === "graveYard") {
        // prevent the date part of the end of night shift being improperly produced, due to the 07:30 overlap
        var shiftEndDatetime = shift.getWorkDatetimeString(datetimeObject.format("YYYY-MM-DD"), shiftObject.end);
    } else {
        var shiftEndDatetime = shift.getWorkDatetimeString(workingDateString, shiftObject.end);
    }
    var messageText = "【" +
        workingDateString.slice(5, 7) + "/" +
        workingDateString.slice(8, 10) + " " +
        shiftObject.cReference + "氣泡數通報】\n";
    mssql.connect(config.mssqlConfig)
        .then(function() {
            var mssqlRequest = new mssql.Request();
            console.log(queryString.getSeedCountRecordsBetweenDate(shiftStartDatetime, shiftEndDatetime));
            mssqlRequest.query(queryString.getSeedCountRecordsBetweenDate(shiftStartDatetime, shiftEndDatetime))
                .then(function(recordset) {
                    if (recordset.length !== 0) {
                        recordset.forEach(function(record) {
                            messageText += "   " + record.prodLineID + "[" +
                                record.prodReference + "] - 氣泡數：" +
                                seedCountLevelCap.applyHtmlColor(Math.round(record.unitSeedCount * 100) / 100) + "\n";
                        });
                    } else {
                        messageText += "未建立資料";
                    }
                    httpRequest({
                        url: upgiSystem.broadcastUrl,
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        json: {
                            "chat_id": telegramChat.getChatID("玻璃製造群組"),
                            "text": messageText,
                            "token": telegramBot.getToken("seedCountBot")
                        }
                    }, function(error, httpResponse, body) {
                        if (error || (httpResponse.statusCode !== 200)) {
                            mssql.close();
                            console.log("error sending broadcast message: " + error + "\n" + JSON.stringify(body));
                            return response.status(httpResponse.statusCode).send(error);
                        } else {
                            mssql.close();
                            return response.status(httpResponse.statusCode).end();
                        }
                    });
                })
                .catch(function(error) {
                    console.log("query error encountered: " + error);
                    return response.status(500).send(error);
                });
        }).catch(function(error) {
            console.log("error connecting to database: " + error);
            return response.status(500).send("error connecting to database: " + error);
        });
});

app.get("/seedCount/api/broadcast/24HourData", function(request, response) {
    var currentDatetimeObject = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    var datetimeObject;
    var workingDateString;
    var shiftObject;
    var shiftStartDatetime;
    var shiftEndDatetime;
    var messageText = {
        title: "【近24小時內氣泡數通報】\n",
        shiftMessage: []
    };
    mssql.connect(config.mssqlConfig)
        .then(function() {
            var mssqlRequest = new mssql.Request();
            var shiftDataQueryPromiseList = [];

            function queryShiftData(startDatetimeString, endDatetimeString) {
                return mssqlRequest.query(queryString.getSeedCountRecordsBetweenDate(startDatetimeString, endDatetimeString));
            };
            for (var loopIndex = 0; loopIndex <= 2; loopIndex++) {
                datetimeObject = moment(currentDatetimeObject, "YYYY-MM-DD HH:mm:ss");
                datetimeObject = datetimeObject.subtract((2 - loopIndex) * 8, "hours");
                workingDateString = shift.getWorkingDateString(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
                shiftObject = shift.getShiftObject(datetimeObject.format("YYYY-MM-DD HH:mm:ss"));
                shiftStartDatetime = shift.getWorkDatetimeString(workingDateString, shiftObject.start);
                if (shiftObject.reference === "graveYard") {
                    // prevent the date part of the end of night shift being improperly produced, due to the 07:30 overlap
                    shiftEndDatetime = shift.getWorkDatetimeString(datetimeObject.format("YYYY-MM-DD"), shiftObject.end);
                } else {
                    shiftEndDatetime = shift.getWorkDatetimeString(workingDateString, shiftObject.end);
                }
                messageText.shiftMessage[loopIndex] = "";
                messageText.shiftMessage[loopIndex] +=
                    workingDateString.slice(5, 7) + "/" +
                    workingDateString.slice(8, 10) + " " +
                    shiftObject.cReference + "\n";
                shiftDataQueryPromiseList[loopIndex] =
                    queryShiftData(shiftStartDatetime, shiftEndDatetime);
            }
            shiftDataQueryPromiseList[0]
                .then(function(recordset) {
                    if (recordset.length !== 0) {
                        recordset.forEach(function(record) {
                            messageText.shiftMessage[0] += "   " +
                                record.prodLineID + "[" +
                                record.prodReference + "] - 氣泡數：" +
                                seedCountLevelCap.applyHtmlColor(Math.round(record.unitSeedCount * 100) / 100) + "\n";
                        });
                    } else {
                        messageText.shiftMessage[0] += "未建立資料\n";
                    }
                    return shiftDataQueryPromiseList[1];
                })
                .then(function(recordset) {
                    if (recordset.length !== 0) {
                        recordset.forEach(function(record) {
                            messageText.shiftMessage[1] += "   " +
                                record.prodLineID + "[" +
                                record.prodReference + "] - 氣泡數：" +
                                seedCountLevelCap.applyHtmlColor(Math.round(record.unitSeedCount * 100) / 100) + "\n";
                        });
                    } else {
                        messageText.shiftMessage[1] += "未建立資料\n";
                    }
                    return shiftDataQueryPromiseList[2];
                })
                .then(function(recordset) {
                    if (recordset.length !== 0) {
                        recordset.forEach(function(record) {
                            messageText.shiftMessage[2] += "   " +
                                record.prodLineID + "[" +
                                record.prodReference + "] - 氣泡數：" +
                                seedCountLevelCap.applyHtmlColor(Math.round(record.unitSeedCount * 100) / 100) + "\n";
                        });
                    } else {
                        messageText.shiftMessage[2] += "未建立資料";
                    }
                    console.log(messageText.title +
                        messageText.shiftMessage[0] +
                        messageText.shiftMessage[1] +
                        messageText.shiftMessage[2]);
                    httpRequest({
                        url: upgiSystem.broadcastUrl,
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        json: {
                            "chat_id": telegramChat.getChatID("玻璃製造群組"),
                            "text": messageText.title +
                                messageText.shiftMessage[0] +
                                messageText.shiftMessage[1] +
                                messageText.shiftMessage[2],
                            "token": telegramBot.getToken("seedCountBot")
                        }
                    }, function(error, httpResponse, body) {
                        if (error || (httpResponse.statusCode !== 200)) {
                            mssql.close();
                            console.log("error sending broadcast message: " + error + "\n" + JSON.stringify(body));
                            return response.status(httpResponse.statusCode).send(error);
                        } else {
                            mssql.close();
                            return response.status(httpResponse.statusCode).end();
                        }
                    });
                })
                .catch(function(error) {
                    console.log("query error encountered: " + error);
                    return response.status(500).send(error);
                });
        })
        .catch(function(error) {
            console.log("error connecting to database: " + error);
            return response.status(500).send("error connecting to database: " + error);
        });
});

app.get("/seedCount/api/getRecordCount", function(req, res) { // get the count of how many records is within the queried condition [FIXED]
    console.log("\n/seedCount/api/getRecordCount");
    var dateToCheck = "";
    if (req.query.workingDate === undefined) {
        console.log("workingDate parameter not set, return empty recordset");
        return res.status(400).send('[{"recordCount":0}]');
    } else {
        dateToCheck = moment(req.query.workingDate, "YYYY-MM-DD");
        var workDateStartTime = moment(shift.getWorkDatetimeString(req.query.workingDate, "07:30"), "YYYY-MM-DD HH:mm:ss");
        var workDateEndTime = moment(workDateStartTime, "YYYY-MM-DD HH:mm:ss").add(1, "days").subtract(1, "milliseconds");
        if ((!dateToCheck.isValid()) || (req.query.workingDate.length !== 10)) {
            console.log("workingDate parameter irregularity detected, returning empty recordset");
            return res.status(400).send('[{"recordCount":0}]');
        } else {
            mssql.connect(config.mssqlConfig, function(error) {
                if (error) {
                    console.log("database connection error: " + error);
                    return res.status(500).send("database connection error: " + error);
                }
                var mssqlRequest = new mssql.Request();
                console.log("SQL query: " + queryString.getRecordCount(
                    workDateStartTime.format("YYYY-MM-DD HH:mm:ss:SSS"),
                    workDateEndTime.format("YYYY-MM-DD HH:mm:ss:SSS")));
                mssqlRequest.query(queryString.getRecordCount(
                        workDateStartTime.format("YYYY-MM-DD HH:mm:ss:SSS"),
                        workDateEndTime.format("YYYY-MM-DD HH:mm:ss:SSS")),
                    function(error, resultset) {
                        if (error) {
                            console.log("unable to query record count data, returning empty recordset" + error);
                            return res.status(500).send('[{"recordCount":0}]');
                        }
                        mssql.close();
                        return res.status(200).json(JSON.stringify(resultset));
                    });
            });
        }
    }
});

app.get("/seedCount/api/getRecordset", function(req, response) { // get a set of records [FIXED]
    console.log("\n/seedCount/api/getRecordset");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("database connection error: " + error);
            return response.status(500).send("database connection error: " + error);
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult " +
            "WHERE recordDate='" + req.query.workingDate +
            "' ORDER BY prodLineID,recordDatetime;";
        console.log("SQL query: " + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                console.log("seed count data query failure: " + error)
                return response.status(500).send("seed count data query failure: " + error);
            }
            mssql.close();
            console.log("seed count data result query successfully");
            return response.status(200).json(JSON.stringify(resultset));
        });
    });
});

app.get("/seedCount/api/getRecord", function(req, res) { // get one single record [FIXED]
    console.log("\n/seedCount/api/getRecord");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("database connection error: " + error);
            return res.status(500).send("database connection error: " + error);
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCount " +
            "WHERE recordDatetime='" + req.query.recordDatetime +
            "' AND prodFacilityID='" + req.query.prodFacilityID +
            "' AND prodLineID='" + req.query.prodLineID + "';";
        console.log("SQL query: " + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                console.log("record query failed: " + error);
                return res.status(500).send("record query failed: " + error);
            }
            mssql.close();
            console.log("record query successful");
            return res.status(200).json(JSON.stringify(resultset));
        });
    });
});

app.post("/seedCount/api/insertRecord", upload.any(), function(req, res) { // insert a new record [FIXED]
    console.log("\n/seedCount/api/insertRecord");
    //deal with NULL array in the case that photo isn't uploaded
    var photoLocation;
    if (req.files.length === 0) {
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' +
            moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log(req.body.prodLineID + " photo upload failed: " + error);
                return res.status(500).send(req.body.prodLineID + " photo upload failed: " + error);
            } else {
                console.log(req.body.prodLineID + "photo uploaded");
            }
        });
    }
    // connect to data server to insert data entry
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("database connection failure: " + error);
            return res.status(500).send("database connection failure: " + error);
        }
        var mssqlRequest = new mssql.Request();
        var insertQueryString = queryString.insertRecord(req.body.recordDatetime, req.body.prodFacilityID, req.body.prodLineID,
            req.body.prodReference, req.body.thickness,
            req.body.count_0, req.body.count_1, req.body.count_2,
            req.body.count_3, req.body.count_4, req.body.count_5,
            req.body.note, photoLocation, req.body.created, req.body.modified);
        console.log("SQL query:\n" + insertQueryString);
        // insert data
        mssqlRequest.query(insertQueryString, function(error) {
            if (error) {
                console.log("error inserting new record: " + error);
                return res.status(500).send("error inserting new record: " + error);
            } else {
                // actions to take after a new entry is made //////////////////////////////
                // check if this record entry is within 1 shift of current time
                //var currentDatetimeObject=moment(moment(),"YYYY-MM-DD HH:mm:ss")
            }
            mssql.close();
            console.log(moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " new data entry inserted successfully");
            return res.status(200).redirect("../mobile");
        });
    });
});

app.post("/seedCount/api/updateRecord", upload.any(), function(req, res) { // update existing record [FIXED]
    console.log("\n/seedCount/api/updateRecord");
    // deal with image add, change or deletion
    var photoLocation = "";
    if (req.files.length === 0) { // no new file is uploaded
        if (req.body.existingPhotoPath === "") {
            photoLocation = seedImageDirectory + "/" + req.body.prodLineID + "/" +
                moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
            fs.unlink(photoLocation, function(error) {
                if (error) {
                    console.log("error removing original photo (attempting to continue):" + error);
                }
            });
        }
        photoLocation = "NULL";
    } else { // a new uploaded file is found
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' +
            moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log(req.body.prodLineID + "error uploading photo: " + error);
                return res.status(500).send(req.body.prodLineID + "error uploading photo: " + error);
            } else {
                console.log(req.body.prodLineID + " photo uploaded");
            }
        });
    }
    // connect to data server to update existing record
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("database connection error: " + error);
            return res.status(500).send("database connection error: " + error);
        }
        var mssqlRequest = new mssql.Request();
        var updateQueryString = queryString.updateRecord(req.body.recordDatetime, req.body.prodFacilityID, req.body.prodLineID,
            req.body.prodReference, req.body.thickness,
            req.body.count_0, req.body.count_1, req.body.count_2,
            req.body.count_3, req.body.count_4, req.body.count_5,
            req.body.note, photoLocation, req.body.modified);
        console.log("SQL query: " + updateQueryString);
        // update data
        mssqlRequest.query(updateQueryString, function(error) {
            if (error) {
                console.log("record update failure:" + error);
                return res.status(500).send("record update failure:" + error);
            }
            mssql.close();
            console.log(moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " record updated");
            return res.status(200).send(req.body.recordDatetime + " " + req.body.prodLineID + " record updated");
        });
    });
});

app.post("/seedCount/api/deleteRecord", urlencodedParser, function(req, res) { // delete a record [FIXED]
    console.log("\n/seedCount/api/deleteRecord");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("failure connecting to database: " + error);
            return res.status(500).send("failure connecting to database: " + error);
        }
        var mssqlRequest = new mssql.Request();
        var getRecordQuery = queryString.getRecord(req.body.recordDatetime, req.body.prodFacilityID, req.body.prodLineID);
        var deleteRecordQuery = queryString.deleteRecord(req.body.recordDatetime, req.body.prodFacilityID, req.body.prodLineID);
        console.log("SQL query: " + getRecordQuery);
        mssqlRequest.query(getRecordQuery, function(error, resultset) { // query the database and get the matching file's photoLocation data
            if (error) {
                console.log("failure while querying database: " + error);
                return res.status(500).send("failure while querying database: " + error).end();
            }
            if (resultset.length === 0) {
                console.log("record does not exist");
                return res.status(500).send("record does not exist");
            } else {
                if (resultset[0].photoLocation !== null) { // if photoLocation is not empty, delete the file
                    fs.unlink(resultset[0].photoLocation, function(error) {
                        if (error) {
                            console.log("failure while removing record with photo attached (attempting to continue): " + error);
                        }
                        console.log("SQL query" + deleteRecordQuery);
                        mssqlRequest.query(deleteRecordQuery, function(error) {
                            if (error) {
                                mssql.close();
                                console.log("error encountered while deleting record: " + error);
                                res.status(500).send("error encountered while deleting record: " + error).end();
                            }
                            mssql.close();
                            console.log("record deleted");
                            return res.status(200).send("record deleted");
                        });
                    });
                } else {
                    console.log("SQL query: " + deleteRecordQuery);
                    mssqlRequest.query(deleteRecordQuery, function(error) {
                        if (error) {
                            mssql.close();
                            console.log("record delete failure: " + error);
                            return res.status(500).send("record delete failure: " + error);
                        }
                        mssql.close();
                        console.log("record deleted");
                        return res.status(200).send("record deleted");
                    });
                }
            }
        });
    });
});

/*
// used to check shift and time relationship values can be produced correctly
console.log(shift.getWorkDatetimeString("2016-11-23", "07:30"));
console.log(shift.getWorkDatetimeString("2016-11-23", "07:40"));
console.log(shift.getWorkDatetimeString("2016-11-23", "15:30"));
console.log(shift.getWorkDatetimeString("2016-11-23", "15:40"));
console.log(shift.getWorkDatetimeString("2016-11-23", "23:30"));
console.log(shift.getWorkDatetimeString("2016-11-23", "23:40"));
console.log(shift.getWorkDatetimeString("2016-11-23", "00:00"));
console.log(shift.getWorkDatetimeString("2016-11-23", "00:30"));
console.log(shift.getWorkDatetimeString("2016-11-24", "07:30"));
console.log("==============================================================");
console.log(shift.getWorkingDateString("2016-11-23 07:30"));
console.log(shift.getWorkingDateString("2016-11-23 07:40"));
console.log(shift.getWorkingDateString("2016-11-23 15:30"));
console.log(shift.getWorkingDateString("2016-11-23 15:40"));
console.log(shift.getWorkingDateString("2016-11-23 23:30"));
console.log(shift.getWorkingDateString("2016-11-23 23:40"));
console.log(shift.getWorkingDateString("2016-11-24 00:00"));
console.log(shift.getWorkingDateString("2016-11-24 00:30"));
console.log(shift.getWorkingDateString("2016-11-24 07:30"));
console.log("==============================================================");
console.log(shift.getShiftObject("2016-11-23 07:30").cReference);
console.log(shift.getShiftObject("2016-11-23 07:40").cReference);
console.log(shift.getShiftObject("2016-11-23 15:30").cReference);
console.log(shift.getShiftObject("2016-11-23 15:40").cReference);
console.log(shift.getShiftObject("2016-11-23 23:30").cReference);
console.log(shift.getShiftObject("2016-11-23 23:40").cReference);
console.log(shift.getShiftObject("2016-11-24 00:00").cReference);
console.log(shift.getShiftObject("2016-11-24 00:30").cReference);
console.log(shift.getShiftObject("2016-11-24 07:30").cReference);
*/