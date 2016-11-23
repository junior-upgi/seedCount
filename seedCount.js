"use strict";

var bodyParser = require("body-parser");
var CronJob = require("cron").CronJob;
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
//var telegramChat = require("./model/telegramChat");
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
                            "chat_id": 241630569,
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
                            "chat_id": 241630569,
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

app.get("/seedCount/api/getRecordCount", function(req, res) { // get the count of how many records is within the queried condition
    console.log("\n/seedCount/api/getRecordCount");
    var dateToCheck = "";
    if (req.query.workingDate === undefined) {
        console.log("     條件值未定義，發生錯誤，回傳空值");
        res.status(400).send("[{}]").end();
    } else {
        console.log("     條件接收");
        dateToCheck = moment(req.query.workingDate, "YYYY-MM-DD");
        var workDateStartTime = moment(dateToCheck).add(450, "minutes");
        var workDateEndTime = moment(workDateStartTime).add(1, "days").subtract(1, "milliseconds");
        if ((!dateToCheck.isValid()) || (req.query.workingDate.length !== 10)) {
            console.log("     條件設定異常，發生錯誤，回傳空值");
            res.status(400).send("[{}]").end();
        } else {
            console.log("     以正常條件進行查詢");
            mssql.connect(config.mssqlConfig, function(error) {
                if (error) {
                    console.log("     資料庫連結發生錯誤：" + error);
                    res.status(500).send("資料庫連結發生錯誤：" + error).end();
                }
                var mssqlRequest = new mssql.Request();
                var queryString = "SELECT COUNT(*) AS recordCount FROM productionHistory.dbo.seedCount WHERE recordDatetime BETWEEN '" +
                    workDateStartTime.format("YYYY-MM-DD HH:mm:ss:SSS") + "' AND '" +
                    workDateEndTime.format("YYYY-MM-DD HH:mm:ss:SSS") + "';";
                console.log("     SQL查詢：" + queryString);
                mssqlRequest.query(queryString, function(error, resultset) {
                    if (error) {
                        console.log("     存在資料筆數查詢發生錯誤：" + error);
                        res.status(500).send("[{}]").end();
                    }
                    console.log("     存在資料筆數查詢成功");
                    mssql.close();
                    res.status(200).json(JSON.stringify(resultset)).end();
                });
            });
        }
    }
});

app.get("/seedCount/api/getRecordset", function(req, response) { // get a set of records
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

app.get("/seedCount/api/getRecord", function(req, res) { // get one single record
    console.log("\n/seedCount/api/getRecord");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            res.status(500).send("資料庫連結發生錯誤：" + error).end();
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCount " +
            "WHERE recordDatetime='" + req.query.recordDatetime +
            "' AND prodFacilityID='" + req.query.prodFacilityID +
            "' AND prodLineID='" + req.query.prodLineID + "';";
        console.log("     SQL查詢：" + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                console.log("     單筆資料查詢失敗：" + error);
                res.status(500).send("單筆資料查詢失敗：" + error).end();
            }
            mssql.close();
            console.log("     單筆資料查詢成功");
            res.status(200).json(JSON.stringify(resultset)).end();
        });
    });
});

app.post("/seedCount/api/insertRecord", upload.any(), function(req, res) { // insert a new record
    console.log("\n/seedCount/api/insertRecord");
    //deal with NULL array in the case that photo isn't uploaded
    var photoLocation;
    if (req.files.length === 0) {
        console.log("     未發現上傳圖片");
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' +
            moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log("     " + req.body.prodLineID + " 圖片上傳錯誤： " + error);
                return res.status(500).send(req.body.prodLineID + " 圖片上傳錯誤： " + error);
            } else {
                console.log("     " + req.body.prodLineID + " 圖片上傳成功");
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
        var queryString = "INSERT INTO productionHistory.dbo.seedCount VALUES ('" +
            req.body.recordDatetime + "','" +
            req.body.prodFacilityID + "','" +
            req.body.prodLineID + "','" +
            req.body.prodReference + "','" +
            req.body.thickness + "'," +
            (req.body.count_0 === "" ? "NULL" : req.body.count_0) + "," +
            (req.body.count_1 === "" ? "NULL" : req.body.count_1) + "," +
            (req.body.count_2 === "" ? "NULL" : req.body.count_2) + "," +
            (req.body.count_3 === "" ? "NULL" : req.body.count_3) + "," +
            (req.body.count_4 === "" ? "NULL" : req.body.count_4) + "," +
            (req.body.count_5 === "" ? "NULL" : req.body.count_5) + "," +
            (req.body.note === "" ? "NULL" : "'" + req.body.note + "'") + "," +
            (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",'" +
            req.body.created + "','" +
            req.body.modified + "');";
        console.log("SQL query:\n" + queryString);
        // insert data
        mssqlRequest.query(queryString, function(error) {
            if (error) {
                console.log("error inserting new record: " + error);
                return res.status(500).send("error inserting new record: " + error);
            } else {
                // actions to take after a new entry is made //////////////////////////////
            }
            mssql.close();
            console.log(moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " new data entry inserted successfully");
            return res.status(200).redirect("../mobile");
        });
    });
});

app.post("/seedCount/api/updateRecord", upload.any(), function(req, res) { // update existing record
    console.log("\n/seedCount/api/updateRecord");
    // deal with image add, change or deletion
    var photoLocation = "";
    if (req.files.length === 0) { // no new file is uploaded
        console.log("     未發現新上傳圖片");
        if (req.body.existingPhotoPath === "") {
            console.log("     移除原始圖片資料");
            photoLocation = seedImageDirectory + "/" + req.body.prodLineID + "/" +
                moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
            fs.unlink(photoLocation, function(error) {
                if (error) {
                    console.log("     原始圖片資料檔案刪除發生錯誤，嘗試繼續執行程式：" + error);
                }
            });
        }
        photoLocation = "NULL";
    } else { // a new uploaded file is found
        console.log("     發現新上傳圖片");
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' +
            moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log("     " + req.body.prodLineID + " 圖片上傳錯誤： " + error);
                res.status(500).send(req.body.prodLineID + " 圖片上傳錯誤： " + error).end();
            } else {
                console.log("     " + req.body.prodLineID + " 圖片上傳成功");
            }
        });
    }
    // connect to data server to update existing record
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤： " + error);
            res.status(500).send("資料庫連結發生錯誤： " + error).end();
        }
        var mssqlRequest = new mssql.Request();
        var queryString =
            "UPDATE productionHistory.dbo.seedCount SET " +
            "prodReference='" + req.body.prodReference +
            "',thickness=" + req.body.thickness +
            ",count_0=" + (req.body.count_0 === "" ? "NULL" : req.body.count_0) +
            ",count_1=" + (req.body.count_1 === "" ? "NULL" : req.body.count_1) +
            ",count_2=" + (req.body.count_2 === "" ? "NULL" : req.body.count_2) +
            ",count_3=" + (req.body.count_3 === "" ? "NULL" : req.body.count_3) +
            ",count_4=" + (req.body.count_4 === "" ? "NULL" : req.body.count_4) +
            ",count_5=" + (req.body.count_5 === "" ? "NULL" : req.body.count_5) +
            ",note=" + (req.body.note === "" ? "NULL" : "'" + req.body.note + "'") +
            ",photoLocation=" + (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") +
            ",modified='" + req.body.modified +
            "' WHERE " +
            "recordDatetime='" + req.body.recordDatetime +
            "' AND prodFacilityID='" + req.body.prodFacilityID +
            "' AND prodLineID='" + req.body.prodLineID + "';";
        console.log("     SQL查詢：" + queryString);
        // update data
        mssqlRequest.query(queryString, function(error) {
            if (error) {
                console.log("     資料更新錯誤： " + error);
                res.status(500).send("資料更新錯誤： " + error).end();
            }
            mssql.close();
            console.log("     " + moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " 氣泡數資料修改成功");
            res.status(200).send(req.body.recordDatetime + " " + req.body.prodLineID + " 氣泡數資料修改成功").end();
        });
    });
});

app.post("/seedCount/api/deleteRecord", urlencodedParser, function(req, res) { // delete a record
    console.log("\n/seedCount/api/deleteRecord");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            res.status(500).send("資料庫連結發生錯誤：" + error).end();
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT photoLocation FROM productionHistory.dbo.seedCount WHERE " +
            "recordDatetime='" + req.body.recordDatetime + "' AND " +
            "prodFacilityID='" + req.body.prodFacilityID + "' AND " +
            "prodLineID='" + req.body.prodLineID + "';";
        console.log("     SQL查詢：" + queryString);
        mssqlRequest.query(queryString, function(error, resultset) { // query the database and get the matching file's photoLocation data
            if (error) {
                console.log("     資料讀取發生錯誤：" + error);
                res.status(500).send("資料讀取發生錯誤：" + error).end();
            }
            if (resultset.length === 0) {
                console.log("     資料不存在");
                res.status(500).send("資料不存在").end();
            } else {
                if (resultset[0].photoLocation !== null) { // if photoLocation is not empty, delete the file
                    console.log("     發現資料存在附加檔案，進行資料附加檔案刪除");
                    fs.unlink(resultset[0].photoLocation, function(error) {
                        if (error) {
                            console.log("     資料附加檔案刪除發生錯誤，嘗試繼續執行程式：" + error);
                        }
                        queryString = "DELETE FROM productionHistory.dbo.seedCount WHERE " +
                            "recordDatetime='" + req.body.recordDatetime + "' AND " +
                            "prodFacilityID='" + req.body.prodFacilityID + "' AND " +
                            "prodLineID='" + req.body.prodLineID + "';";
                        console.log("     SQL查詢：" + queryString);
                        mssqlRequest.query(queryString, function(error) {
                            if (error) {
                                mssql.close();
                                console.log("資料刪除發生錯誤：" + error);
                                res.status(500).send("資料刪除發生錯誤：" + error).end();
                            }
                            mssql.close();
                            console.log("     資料刪除成功");
                            res.status(200).send("資料刪除成功").end();
                        });
                    });
                } else {
                    console.log("     發現資料且無附加檔案");
                    queryString = "DELETE FROM productionHistory.dbo.seedCount WHERE " +
                        "recordDatetime='" + req.body.recordDatetime + "' AND " +
                        "prodFacilityID='" + req.body.prodFacilityID + "' AND " +
                        "prodLineID='" + req.body.prodLineID + "';";
                    console.log("     SQL查詢：" + queryString);
                    mssqlRequest.query(queryString, function(error) {
                        if (error) {
                            mssql.close();
                            console.log("     資料刪除發生錯誤：" + error);
                            res.status(500).send("資料刪除發生錯誤：" + error).end();
                        }
                        mssql.close();
                        console.log("     資料刪除成功");
                        res.status(200).send("資料刪除成功").end();
                    });
                }
            }
        });
    });
});

// seedCount system scheduled update
var seedCountScheduledUpdate = upgiSystem.list[2].jobList[0];
var seedCountBot = telegramBot.list[1];
var scheduledUpdate = new CronJob(seedCountScheduledUpdate.schedule, function() {
    var currentDatetime = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    console.log("\n目前時間: " + currentDatetime.format("YYYY-MM-DD HH:mm:ss"));
    // server inspects system data
    console.log("     進行" + seedCountScheduledUpdate.reference + "檢查");
    mssql.connect(config.mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            return false;
        } else {
            var mssqlRequest = new mssql.Request();
            var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDatetime>'" +
                moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(seedCountScheduledUpdate.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") +
                "' ORDER BY recordDatetime, prodLineID;";
            console.log("     查詢範圍：" +
                moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(seedCountScheduledUpdate.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") +
                " 之後資料");
            console.log("     SQL查詢：" + queryString);
            mssqlRequest.query(queryString, function(error, resultset) {
                if (error) {
                    mssql.close();
                    console.log("     資料庫查詢失敗：" + error);
                    return false;
                }
                mssql.close();
                if (seedCountScheduledUpdate.online === true) {
                    if (seedCountScheduledUpdate.broadcast === true) {
                        if (resultset.length === 0) { // 尚無可推播資料
                            console.log("     未發現作業資料");
                            var contentString = currentDatetime.format("HH:mm") + " " + seedCountScheduledUpdate.reference + "：\n";
                            contentString += moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(seedCountScheduledUpdate.observePeriod, "hours").format("HH:mm") +
                                " 至今未發現作業資料";
                            // loop through each designed target group and user and broadcast
                            seedCountScheduledUpdate.targetGroupIDList.concat(
                                seedCountScheduledUpdate.targetUserIDList).forEach(function(TargetGroupID) {
                                httpRequest({
                                    url: telegram.botAPIUrl + seedCountBot.token + "/sendMessage",
                                    method: "post",
                                    headers: { "Content-Type": "application/json" },
                                    json: {
                                        "chat_id": TargetGroupID,
                                        "text": contentString
                                    }
                                }, function(error, response, body) {
                                    if (error) {
                                        console.log("     推播作業發生錯誤：" + error);
                                    } else {
                                        console.log("     推播作業成功：" + response.statusCode);
                                        console.log("     伺服器回覆：" + JSON.stringify(body));
                                    }
                                });
                            });
                        } else { // 推播資料確認存在
                            var contentString = currentDatetime.format("HH:mm") + " " + seedCountScheduledUpdate.reference + "：\n";
                            resultset.forEach(function(seedCountDataPerLine) {
                                contentString += seedCountDataPerLine.prodLineID + "[" + seedCountDataPerLine.prodReference + "] - " +
                                    " 氣泡數：" + (Math.round(seedCountDataPerLine.unitSeedCount * 100) / 100) + "\n";
                            });
                            console.log("     " + moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " 發佈行動裝置通知");
                            // loop through each designed target group and user and broadcast
                            seedCountScheduledUpdate.targetGroupIDList.concat(
                                seedCountScheduledUpdate.targetUserIDList).forEach(function(TargetGroupID) {
                                httpRequest({
                                    url: telegram.botAPIUrl + seedCountBot.token + "/sendMessage",
                                    method: "post",
                                    headers: { "Content-Type": "application/json" },
                                    json: {
                                        "chat_id": TargetGroupID,
                                        "text": contentString
                                    }
                                }, function(error, response, body) {
                                    if (error) {
                                        console.log("     推播作業發生錯誤：" + error);
                                    } else {
                                        console.log("     推播作業成功：" + response.statusCode);
                                        console.log("     伺服器回覆：" + JSON.stringify(body));
                                    }
                                });
                            });
                        }
                    } else {
                        console.log("     推播程序目前處於關閉狀態");
                    }
                } else {
                    console.log("     " + seedCountScheduledUpdate.reference + "程序目前處於關閉狀態");
                }
            });
        }
    });
}, null, true, shift.workingTimezone);
//scheduledUpdate.start();

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