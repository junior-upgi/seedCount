var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false });
var CronJob = require("cron").CronJob;
var cors = require("cors");
var express = require("express");
var fs = require("fs");
var app = express();
var moment = require("moment-timezone");
var mssql = require("mssql");
var httpRequest = require("request");
var telegram = require("./telegram.js");

var backendHost = "http://localhost"; // development environment
var BackendHostPort = 4949; // development environment
var frontendHost = "http://192.168.0.16"; // development environment
var frontendHostPort = 80; // development environment port
//var backendHost = "http://upgi.ddns.net"; // development environment
//var BackendHostPort = 4949; // development environment
//var frontendHost = "http://upgi.ddns.net"; // production server
//var frontendHostPort = 3355; // production server port
var broadcastServer = "http://upgi.ddns.net:3939"; // broadcast server
var broadcastServerAPIEndpoint = "/broadcast";

// serve static photos
var seedImageDirectory = "seedImage";
var multer = require("multer");
var upload = multer({ dest: seedImageDirectory + "/" });
app.use("/" + seedImageDirectory, express.static("./" + seedImageDirectory));
console.log("影像伺服器服務於運行中... (" + backendHost + ":" + BackendHostPort + "/" + seedImageDirectory + ")");

var mssqlConfig = {
    server: "upgi.ddns.net", // access database from the Internet (development)
    //server: "192.168.168.5", // access database from LAN (production)
    user: "productionHistory",
    password: "productionHistory"
};

var workingTimezone = "Asia/Taipei";

app.use(cors());

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

app.listen(BackendHostPort);
console.log("氣泡數監測系統伺服器服務於運行中... (" + backendHost + ":" + BackendHostPort + ")");

// function to check new or updated seedCount entry that's dated within the past 8 hours, broadcast

var scheduledUpdate = new CronJob(telegram.scheduledSeedCountUpdateJob.schedule, function() {
    var currentDatetime = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    console.log("\n目前時間: " + currentDatetime.format("YYYY-MM-DD HH:mm:ss"));
    // server inspects system data
    console.log("     進行例行氣泡數據通報檢查");
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var mssqlRequest = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDatetime>'" +
            moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(telegram.scheduledSeedCountUpdateJob.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") +
            "' ORDER BY recordDatetime, prodLineID;";
        console.log("     查詢範圍：" +
            moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(telegram.scheduledSeedCountUpdateJob.observePeriod, "hours").format("YYYY-MM-DD HH:mm:ss") +
            " 之後資料");
        console.log("     SQL查詢：" + queryString);
        mssqlRequest.query(queryString, function(error, resultset) {
            if (error) {
                mssql.close();
                console.log("     查詢失敗：" + error);
            }
            mssql.close();
            if (telegram.scheduledSeedCountUpdateJob.online === true) {
                if (resultset.length === 0) { // 尚無可推播資料
                    console.log("     未發現作業資料");
                    httpRequest({
                        url: telegram.botAPIurl + telegram.seedCountBotToken + "/sendMessage",
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        json: {
                            "chat_id": telegram.glass_manufacture_groupID,
                            "text": moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(telegram.scheduledSeedCountUpdateJob.observePeriod, "hours").format("HH:mm") +
                                " 至今未發現作業資料"
                        }
                    }, function(error, response, body) {
                        if (error) {
                            console.log("     推播作業發生錯誤：" + error);
                        } else {
                            console.log("     推播作業成功：" + response.statusCode);
                            console.log("     伺服器回覆：" + body);
                        }
                    });
                } else { // 推播資料確認存在
                    console.log(resultset);
                    var contentString = currentDatetime.format("HH:mm") + " 氣泡數報告：\n";
                    resultset.forEach(function(seedCountDataPerLine) {
                        contentString += seedCountDataPerLine.prodLineID + "[" + seedCountDataPerLine.prodReference + "] - " +
                            " 氣泡數：" + seedCountDataPerLine.unitSeedCount + "\n";
                    });
                    console.log("     " + moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss") + " 發佈行動裝置通知");
                    httpRequest({
                        url: telegram.botAPIurl + telegram.seedCountBotToken + "/sendMessage",
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        json: {
                            "chat_id": telegram.glass_manufacture_groupID,
                            "text": contentString
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
scheduledUpdate.start();