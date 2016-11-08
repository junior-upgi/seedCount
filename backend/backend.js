var express = require('express');
var cors = require('cors');
var app = express();
var multer = require('multer');
var upload = multer({ dest: 'seedImage/' });
var fs = require('fs');
var mssql = require('mssql');
//var moment = require('moment');
var moment = require('moment-timezone');
var workingTimezone = "Asia/Taipei";
var utility = require('./uuidGenerator.js');

var frontendServer = "http://192.168.0.16:80/"; //development environment
//var frontendServer = "http://upgi.ddns.net:3355/"; //production server

var mssqlConfig = {
    user: 'productionHistory',
    password: 'productionHistory',
    server: 'upgi.ddns.net' //access database from the Internet (development)
        //server: '192.168.168.5' //access database from LAN (production)
};

app.use(cors());

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
    // connect to data server to insert mobile data entry
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
            /*            var trialCount = 0;
                        var seedCountSum = 0;
                        req.body.seedCount.forEach(function(seedCountValue, index) {
                            if (seedCountValue !== '') {
                                trialCount += seedCountValue;
                                seedCountSum++;
                            }
                        });
                        if (((seedCountSum / trialCount) * (10 / req.body.thickness)) > 10) {
                            console.log
                            console.log("系統偵測到氣泡數超過正常值狀況，即將發送通知...！\n");
                        }*/
            //res.send("<div>" + req.body.prodLineID + "氣泡數資料寫入成功</div><div><a href=\"" + frontendServer + "/seedCount/mobileEntry.html\">返回系統</a></div>");
            res.json({ "status": "success" });
        });
    });
});

app.get('/seedCount/api/getRecordsetOnDate', function(req, res) {
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

app.get('/seedCount/api/getRecordCountOnDate', function(req, res) {
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

app.get('/seedCount/api/getRecordAtDatetime', function(req, res) {
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

app.listen(4949);
console.log('seedCount backend server is running on port 4949...\n');