var express = require("express");
var CronJob = require("cron").CronJob;
var cors = require("cors");
var app = express();
var multer = require("multer");
var upload = multer({ dest: "seedImage/" });
var fs = require("fs");
var mysql = require('mysql');
var mssql = require("mssql");
var moment = require("moment-timezone");
var workingTimezone = "Asia/Taipei";
var utility = require("./uuidGenerator.js");

var frontendServer = "http://192.168.0.16:80/"; //development environment
//var frontendServer = "http://upgi.ddns.net:3355/"; //production server

var mssqlConfig = {
    user: 'productionHistory',
    password: 'productionHistory',
    server: 'upgi.ddns.net' //access database from the Internet (development)
        //server: '192.168.168.5' //access database from LAN (production)
};

// host for the mobile messaging system 
var mysqlConfig = {
    // 'localhost' on production server
    host: '192.168.168.86',
    port: '3306',
    user: 'overdueMonitor',
    password: 'overdueMonitor',
    charset: 'utf8_bin'
};

app.use(cors());

// serve photos
app.use("/seedImage", express.static('./seedImage'));

// update existing record
app.post("/seedCount/api/updateRecord", upload.any(), function(req, res) {
    // query for the current record
    // remove exising photoPath and image file if existing
    // deal with the possibility when new photo does not exist
    var photoLocation;
    if (req.files.length == 0) {
        console.log("未上傳圖片");
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' + moment.tz(req.body.recordDatetime, "Asia/Taipei").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log(req.body.prodLineID + " 圖片上傳錯誤： " + error + '\n');
            } else {
                console.log(req.body.prodLineID + " 圖片上傳成功" + '\n');
            }
        });
    }
    // connect to data server to update existing record
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString =
            "UPDATE productionHistory.dbo.seedCount SET " +
            "prodReference='" + req.body.prodReference +
            "',thickness=" + req.body.thickness +
            ",count_0=" + (req.body.count_0 === '' ? "NULL" : req.body.count_0) +
            ",count_1=" + (req.body.count_1 === '' ? "NULL" : req.body.count_1) +
            ",count_2=" + (req.body.count_2 === '' ? "NULL" : req.body.count_2) +
            ",count_3=" + (req.body.count_3 === '' ? "NULL" : req.body.count_3) +
            ",count_4=" + (req.body.count_4 === '' ? "NULL" : req.body.count_4) +
            ",count_5=" + (req.body.count_5 === '' ? "NULL" : req.body.count_5) +
            ",note=" + (req.body.note === '' ? "NULL" : "'" + req.body.note + "'") +
            ",photoLocation=" + (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") +
            ",modified='" + req.body.modified +
            "' WHERE " +
            "recordDatetime='" + req.body.recordDatetime +
            "' AND prodFacilityID='" + req.body.prodFacilityID +
            "' AND prodLineID='" + req.body.prodLineID + "';";
        console.log(queryString + '\n');
        // insert data
        request.query(queryString, function(error) {
            if (error) {
                console.log("資料更新錯誤： " + error + '\n')
                throw error;
            }
            mssql.close();
            console.log(moment.tz(req.body.recordDatetime, "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " 氣泡數資料寫入成功\n");
            res.json({ "status": "success" });
        });
    });
});

// insert a new record
app.post('/seedCount/api/insertRecord', upload.any(), function(req, res) {
    //deal with NULL array in the case that photo isn't uploaded
    var photoLocation;
    if (req.files.length == 0) {
        console.log("未上傳圖片");
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' + moment.tz(req.body.recordDatetime, "Asia/Taipei").format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log(req.body.prodLineID + " 圖片上傳錯誤： " + error + '\n');
            } else {
                console.log(req.body.prodLineID + " 圖片上傳成功" + '\n');
            }
        });
    }
    // connect to data server to insert data entry
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "INSERT INTO productionHistory.dbo.seedCount VALUES ('" +
            moment.tz(req.body.recordDatetime, "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss") + "','" +
            req.body.prodFacilityID + "','" +
            req.body.prodLineID + "','" +
            req.body.prodReference + "','" +
            req.body.thickness + "'," +
            (req.body.count_0 === '' ? "NULL" : req.body.count_0) + "," +
            (req.body.count_1 === '' ? "NULL" : req.body.count_1) + "," +
            (req.body.count_2 === '' ? "NULL" : req.body.count_2) + "," +
            (req.body.count_3 === '' ? "NULL" : req.body.count_3) + "," +
            (req.body.count_4 === '' ? "NULL" : req.body.count_4) + "," +
            (req.body.count_5 === '' ? "NULL" : req.body.count_5) + "," +
            (req.body.note === '' ? "NULL" : "'" + req.body.note + "'") + "," +
            (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",'" +
            moment.tz(moment(), "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss") + "','" +
            moment.tz(moment(), "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss") + "');";
        console.log(queryString + '\n');
        // insert data
        request.query(queryString, function(error) {
            if (error) {
                console.log("資料寫入錯誤： " + error + '\n')
                throw error;
            }
            mssql.close();
            console.log(moment.tz(req.body.recordDatetime, "Asia/Taipei").format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " 氣泡數資料寫入成功\n");
            res.json({ "status": "success" });
        });
    });
});

app.get('/seedCount/api/getRecordCount', function(req, res) {
    var dateToCheck = '';
    if (req.query.workingDate === undefined) {
        console.log('parameter not received, empty results returned to the client...\n');
        res.send('{}');
    } else {
        console.log('parameter received...\n');
        dateToCheck = moment.tz(req.query.workingDate, workingTimezone);
        var workDateStartTime = moment(dateToCheck).add(450, 'm');
        var workDateEndTime = moment(workDateStartTime).add(1, 'd').subtract(1, 'ms');
        if ((!dateToCheck.isValid()) || (req.query.workingDate.length !== 10)) {
            console.log('parameter not valid...\n');
            res.send('{}');
        } else {
            console.log('parameter is valid...\n');
            mssql.connect(mssqlConfig, function(error) {
                if (error) throw error;
                var request = new mssql.Request();
                var queryString = "SELECT COUNT(*) AS recordCount FROM productionHistory.dbo.seedCount WHERE recordDatetime BETWEEN '" +
                    workDateStartTime.format("YYYY-MM-DD HH:mm:ss:SSS") + "' AND '" +
                    workDateEndTime.format("YYYY-MM-DD HH:mm:ss:SSS") + "';";
                //console.log(queryString);
                request.query(queryString, function(error, resultSet) {
                    if (error) {
                        console.log("recordCountOnDate API failure： " + error + '\n')
                        res.send('{}');
                        throw error;
                    }
                    console.log("recordCountOnDate success...!\n");
                    mssql.close();
                    res.json(JSON.stringify(resultSet));
                });
            });
        }
    }
});

app.get('/seedCount/api/getRecord', function(req, res) {
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCount WHERE recordDatetime='" + req.query.recordDatetime + "' AND prodFacilityID='" + req.query.prodFacilityID + "' AND prodLineID='" + req.query.prodLineID + "';";
        console.log(queryString + '\n');
        request.query(queryString, function(error, resultSet) {
            if (error) {
                console.log("retrieveRecord API failure： " + error + '\n')
                res.send('{}');
                throw error;
            }
            console.log("retrieveRecord success...!\n");
            mssql.close();
            res.json(JSON.stringify(resultSet));
        });
    });
});

app.get('/seedCount/api/getRecordset', function(req, res) {
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDate='" + req.query.workingDate + "' ORDER BY prodLineID,recordDatetime;";
        //console.log(queryString + '\n');
        request.query(queryString, function(error, resultSet) {
            if (error) {
                console.log("氣泡數資料讀取錯誤： " + error + '\n')
                throw error;
            }
            console.log("氣泡數計算結果讀取成功\n");
            mssql.close();
            res.json(JSON.stringify(resultSet));
        });
    });
});

app.listen(4949);
console.log('seedCount backend server is running on port 4949...\n');

var currentDatetime;
new CronJob('*/5 * * * * *', function() {
    currentDatetime = moment(moment(), "YYYY-MM-DD HH:mm:ss");
    console.log("目前時間: " + currentDatetime.format("YYYY-MM-DD HH:mm:ss"));
    if ((currentDatetime.format("mm") % 1 === 0) && (currentDatetime.format("ss") % 30 === 0)) {
        console.log("進行氣泡數據檢查");
        mssql.connect(mssqlConfig, function(error) {
            if (error) throw error;
            var request = new mssql.Request();
            var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE unitSeedCount>10 AND recordDatetime>'" +
                moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss") + "'";
            console.log("查詢範圍：" + moment(currentDatetime, "YYYY-MM-DD HH:mm:ss").subtract(2, "hours").format("YYYY-MM-DD HH:mm:ss") + " 之後資料");
            request.query(queryString, function(error, resultSet) {
                if (error) {
                    console.log("查詢失敗： " + error);
                    throw error;
                }
                mssql.close();
                console.log("查詢成功，發現[" + resultSet.length + "]筆數據異常");
                resultSet.forEach(function(irregularEntry) {
                    console.log(irregularEntry.recordDate + " " + irregularEntry.prodLineID + "線 -" + irregularEntry.recordTime + "氣泡數：" + irregularEntry.unitSeedCount);
                    console.log("發佈行動裝置通知");
                    /////////////////////////////////////////////////////////////////
                    /*
                    var recipientID = "";
                    var messageID = utility.uuidGenerator();
                    var broadcastStatusID = utility.uuidGenerator();
                    // establish connection to mobileMessagingSystem server
                    var mysqlConn = mysql.createConnection(mysqlConfig);
                    mysqlConn.connect();
                    // write to the mobileMessagingSystem.message table
                    mysqlConn.query("INSERT INTO mobileMessagingSystem.message (`ID`,`messageCategoryID`,`systemCategoryID`,`manualTopic`,`content`,`created_at`) VALUES ('" + messageID + "'," + item.messageCategoryID + "," + item.systemCategoryID + ",'" + item.manualTopic + "','" + item.content + "','" + convertDateTime(item.generated) + "');", function(error) {
                        if (error) throw error;
                    });
                    // check the user ID used by the mobile messaging system (compare against the particular sales' ERP ID or 員工編號)
                    mysqlConn.query("SELECT a.userID,c.erpID FROM upgiSystem.userGroupMembership a INNER JOIN (SELECT ID FROM upgiSystem.userGroup WHERE reference='Sales') b ON a.userGroupID=b.ID LEFT JOIN upgiSystem.user c ON a.userID=c.ID WHERE a.deprecated IS NULL AND c.erpID='" + item.recipientID + "';", function(error, data, fieldList) {
                        if (error) throw error;
                        recipientID = data[0].userID;
                        // write the mobileMessagingSystem.broadcastStatus table
                        mysqlConn.query("INSERT INTO mobileMessagingSystem.broadcastStatus (`ID`,`messageID`,`recipientID`,`primaryRecipient`,`url`,`audioFile`,`permanent`,`created_at`) VALUES ('" + broadcastStatusID + "','" + messageID + "','" + recipientID + "','1','" + item.url + "','" + item.audioFile + "',0,'" + convertDateTime(item.generated) + "');", function(error) {
                            if (error) throw error;
                        });
                        mysqlConn.end();
                    });
                    */
                    ///////////////////////////////////////////////////////////////////////
                });
            });
        });
    }
}, null, true, 'Asia/Taipei');