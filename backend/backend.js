var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var CronJob = require("cron").CronJob;
var cors = require("cors");
var express = require("express");
var fs = require("fs");
var app = express();
var moment = require("moment-timezone");
var mssql = require("mssql");
var multer = require("multer");
var upload = multer({ dest: "seedImage/" });
var mysql = require("mysql");
var httpRequest = require("request");
var utility = require("./uuidGenerator.js");

var frontendServer = "http://192.168.0.16:80"; // development environment
//var frontendServer = "http://upgi.ddns.net:3355"; // production server
var broadcastServer = "http://upgi.ddns.net:3939"; // broadcast server

var mssqlConfig = {
    server: "upgi.ddns.net", // access database from the Internet (development)
    //server: "192.168.168.5", // access database from LAN (production)
    user: "productionHistory",
    password: "productionHistory"
};

// host for the mobile messaging system 
var mysqlConfig = {
    //host: "192.168.168.86",
    host: "upgi.ddns.net",
    port: "3306",
    user: "overdueMonitor",
    password: "overdueMonitor",
    charset: "utf8_bin"
};

var workingTimezone = "Asia/Taipei";

app.use(cors());

// serve photos
app.use("/seedImage", express.static("./seedImage"));

// get one single record
app.get("/seedCount/api/getRecord", function(req, res) {
    console.log("\n/seedCount/api/getRecord");
    mssql.connect(mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            res.status(500).send("資料庫連結發生錯誤：" + error).end();
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCount WHERE recordDatetime='" + req.query.recordDatetime +
            "' AND prodFacilityID='" + req.query.prodFacilityID +
            "' AND prodLineID='" + req.query.prodLineID + "';";
        console.log("     SQL查詢：" + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                console.log("     單筆資料查詢失敗：" + error)
                res.status(500).send("單筆資料查詢失敗：" + error).end();
            }
            mssql.close();
            console.log("     單筆資料查詢成功");
            res.status(200).json(JSON.stringify(resultset)).end();
        });
    });
});

// get the count of how many records is within the queried condition 
app.get("/seedCount/api/getRecordCount", function(req, res) {
    console.log("\n/seedCount/api/getRecordCount");
    var dateToCheck = "";
    if (req.query.workingDate === undefined) {
        console.log("     條件值未定義，發生錯誤，回傳空值");
        res.status(400).send('[{}]').end();
    } else {
        console.log("     條件接收");
        dateToCheck = moment.tz(req.query.workingDate, workingTimezone);
        var workDateStartTime = moment(dateToCheck).add(450, 'm');
        var workDateEndTime = moment(workDateStartTime).add(1, 'd').subtract(1, 'ms');
        if ((!dateToCheck.isValid()) || (req.query.workingDate.length !== 10)) {
            console.log("     條件設定異常，發生錯誤，回傳空值");
            res.status(400).send('[{}]').end();
        } else {
            console.log("     以正常條件進行查詢");
            mssql.connect(mssqlConfig, function(error) {
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

// get a set of records
app.get("/seedCount/api/getRecordset", function(req, res) {
    console.log("\n/seedCount/api/getRecordset");
    mssql.connect(mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            res.status(500).send("資料庫連結發生錯誤：" + error).end();
        }
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult " +
            "WHERE recordDate='" + req.query.workingDate +
            "' ORDER BY prodLineID,recordDatetime;";
        console.log("     SQL查詢：" + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                console.log("     氣泡數資料讀取錯誤：" + error)
                res.status(500).send("氣泡數資料讀取錯誤：" + error).end();
            }
            mssql.close();
            console.log("     氣泡數計算結果讀取成功");
            res.status(200).json(JSON.stringify(resultset)).end();
        });
    });
});

// insert a new record
app.post("/seedCount/api/insertRecord", upload.any(), function(req, res) {
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
                res.status(500).send(req.body.prodLineID + " 圖片上傳錯誤： " + error).end();
            } else {
                console.log("     " + req.body.prodLineID + " 圖片上傳成功");
            }
        });
    }
    // connect to data server to insert data entry
    mssql.connect(mssqlConfig, function(error) {
        if (error) {
            console.log("     資料庫連結發生錯誤：" + error);
            res.status(500).send("資料庫連結發生錯誤：" + error).end();
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
        console.log("     SQL查詢：" + queryString);
        // insert data
        mssqlRequest.query(queryString, function(error) {
            if (error) {
                console.log("     資料讀取發生錯誤：" + error);
                res.status(500).send("資料讀取發生錯誤： " + error).end();
            }
            mssql.close();
            console.log("     " + moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " 氣泡數資料新增成功");
            res.status(200).send(req.body.recordDatetime + " " + req.body.prodLineID + " 氣泡數資料新增成功").end();
        });
    });
});

// update existing record
app.post("/seedCount/api/updateRecord", upload.any(), function(req, res) {
    console.log("\n/seedCount/api/updateRecord");
    console.log(req.files.length);
    console.log(req.body);
    // deal with image add, change or deletion
    var photoLocation;
    /////////////////////////////////////////
    switch (true) {
        case ((req.files.length === 0) && (req.body.existingPhotoPath !== "")):
            console.log("A");
            break;
        case ((req.files.length === 0) && (req.body.existingPhotoPath === "")):
            console.log("B");
            break;
        case ((req.files.length === 1) && (req.body.existingPhotoPath !== "")):
            console.log("C");
            break;
        case ((req.files.length === 1) && (req.body.existingPhotoPath === "")):
            console.log("D");
            break;
        default:
    }
    /////////////////////////////////////////
    if (req.files.length === 0) {
        console.log("     未上傳圖片");
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' + moment(req.body.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log("     " + req.body.prodLineID + " 圖片上傳錯誤： " + error);
                res.status(500).send(req.body.prodLineID + " 圖片上傳錯誤： " + error).end();
            } else {
                console.log("     " + req.body.prodLineID + " 圖片上傳成功" + '\n');
            }
        });
    }
    // connect to data server to update existing record
    mssql.connect(mssqlConfig, function(error) {
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

// delete a record
app.post("/seedCount/api/deleteRecord", urlencodedParser, function(req, res) {
    console.log("\n/seedCount/api/deleteRecord");
    mssql.connect(mssqlConfig, function(error) {
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
                console.log("資料讀取發生錯誤：" + error);
                res.status(500).send("資料讀取發生錯誤：" + error).end();
            }
            if (resultset.length === 0) {
                console.log("     資料不存在");
                res.status(200).send("資料不存在").end();
            } else {
                if (resultset[0].photoLocation !== null) { // if photoLocation is not empty, delete the file
                    console.log("     發現資料存在附加檔案");
                    fs.unlink(resultset[0].photoLocation, function(error) {
                        if (error) {
                            console.log("     資料附加檔案刪除發生錯誤：" + error);
                            res.status(500).send("資料附加檔案刪除發生錯誤：" + error).end();
                        } else {
                            console.log("     資料附加檔案刪除成功");
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
                        }
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

app.listen(4949);
console.log("氣泡數監測系統伺服器服務於運行中... (端口：4949)");

var taskControl = {
    seedCountAlert: {
        //taskSchedule: "0 30 7,15,23 * * *", // everyday at 07:30, 15:30, and 23:30
        taskSchedule: "0 */2 * * * *", // for tesing
        broadcast: true,
        observePeriod: 8,
        alertLevel: 10
    }
};

var seedCountAlert = new CronJob(taskControl.seedCountAlert.taskSchedule, function() {
    var currentDatetime = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    console.log("\n目前時間: " + currentDatetime.format("YYYY-MM-DD HH:mm:ss"));
    // server inspects system data
    console.log("     進行例行氣泡數據通報檢查");
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE unitSeedCount>=" + taskControl.seedCountAlert.alertLevel + " AND recordDatetime>'" +
            moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(taskControl.seedCountAlert.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") + "' ORDER BY recordDatetime, prodLineID;";
        console.log("     SQL查詢：" + queryString);
        console.log("     查詢範圍：" + moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(taskControl.seedCountAlert.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") + " 之後資料");
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                mssql.close();
                console.log("     查詢失敗：" + error);
            }
            mssql.close();
            console.log("     查詢完畢：發現[" + resultset.length + "]筆數據異常");
            if (taskControl.seedCountAlert.broadcast === true) {
                var topicString = currentDatetime.format("MM/DD HH:mm") + " 氣泡數異常通報";
                if (resultset.length > 0) {
                    var contentString = "";
                    resultset.forEach(function(irregularity) {
                        contentString += moment(irregularity.recordDate, "YYYY-MM-DD").format("MM/DD") + " " +
                            moment(irregularity.recordTime, "HH:mm:ss").format("HH:mm") + " " +
                            irregularity.prodLineID + "[" + irregularity.prodReference + "] - " +
                            " 氣泡數：" + irregularity.unitSeedCount + "\n";
                    });
                    console.log("     發佈行動裝置通知");
                    httpRequest({
                        url: broadcastServer + "/broadcast",
                        method: "post",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        json: {
                            "messageCategoryID": "999",
                            "systemCategoryID": "4",
                            "manualTopic": topicString,
                            "content": contentString,
                            "recipientID": "05060001",
                            "userGroup": "Admin",
                            "url": frontendServer + "/seedCount",
                            "audioFile": "warning.mp3" // available sounds: alert.mp3 beep.mp3 warning.mp3 alarm.mp3
                        }
                    }, function(error, response, body) {
                        if (error) {
                            console.log("     推播作業發生錯誤：" + error);
                        } else {
                            console.log("     推播作業成功：" + response.statusCode);
                            console.log("     伺服器回覆：" + body);
                        }
                    });
                } else {
                    httpRequest({
                        url: broadcastServer + "/broadcast",
                        method: "post",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        json: {
                            "messageCategoryID": "999",
                            "systemCategoryID": "4",
                            "manualTopic": topicString,
                            "content": "請點選檢視今日氣泡數狀況",
                            "recipientID": "05060001",
                            "userGroup": "Admin",
                            "url": frontendServer + "/seedCount",
                            "audioFile": "alert.mp3" // available sounds: alert.mp3 beep.mp3 warning.mp3 alarm.mp3
                        }
                    }, function(error, response, body) {
                        if (error) {
                            console.log("     推播作業發生錯誤：" + error);
                        } else {
                            console.log("     推播作業成功：" + response.statusCode);
                            console.log("     伺服器回覆：" + body);
                        }
                    });
                }
            } else {
                console.log("     推播設定目前處於關閉狀態");
            }
        });
    });
}, null, true, workingTimezone);
seedCountAlert.start();