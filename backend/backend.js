var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer({ dest: 'seedImage/' });
var fs = require('fs');
var mssql = require('mssql');
var moment = require('moment');
var utility = require('./uuidGenerator.js');

var mssqlConfig = {
    user: 'productionHistory',
    password: 'productionHistory',
    //server: 'upgi.ddns.net'
    server: '192.168.168.5'
}

app.post('/seedCount/api/mobileDataEntry', upload.any(), function(req, res) {
    //deal with NULL array in the case that photo isn't uploaded
    var photoLocation;
    if (req.files.length == 0) {
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' + moment(req.body.recordDate + ' ' + req.body.recordTime + ':00').format("YYYYMMDDHHmm") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            if (error) {
                console.log(req.body.prodLineID + " 圖片上傳錯誤： " + error + '\n');
            } else {
                console.log(req.body.prodLineID + " 圖片上傳成功" + '\n');
            }
        });
    }

    // connect to data server
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "INSERT INTO productionHistory.dbo.seedCount VALUES ('" +
            moment(req.body.recordDate + ' ' + req.body.recordTime + ':00').format("YYYY-MM-DD HH:mm:ss") + "','" +
            req.body.prodFacilityID + "','" +
            req.body.prodLineID + "','" +
            req.body.prodReference + "','" +
            req.body.thickness + "'," +
            (req.body.seedCount[0] === '' ? "NULL" : req.body.seedCount[0]) + "," +
            (req.body.seedCount[1] === '' ? "NULL" : req.body.seedCount[1]) + "," +
            (req.body.seedCount[2] === '' ? "NULL" : req.body.seedCount[2]) + "," +
            (req.body.seedCount[3] === '' ? "NULL" : req.body.seedCount[3]) + "," +
            (req.body.seedCount[4] === '' ? "NULL" : req.body.seedCount[4]) + "," +
            (req.body.seedCount[5] === '' ? "NULL" : req.body.seedCount[5]) + "," +
            (req.body.note === '' ? "NULL" : "'" + req.body.note + "'") + "," +
            (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",'" +
            moment().format("YYYY-MM-DD HH:mm:ss") + "');";
        console.log(queryString + '\n');
        // insert data
        request.query(queryString, function(error, resultSet) {
            if (error) {
                console.log("資料寫入錯誤： " + error + '\n')
                throw error;
            }
            mssql.close();
            console.log(moment(req.body.recordDate + ' ' + req.body.recordTime + ':00').format("YYYY-MM-DD HH:mm:ss") + " " + req.body.prodLineID + " 氣泡數資料寫入成功\n");
        });
        res.send("<div>" + req.body.prodLineID + "氣泡數資料寫入成功</div><div><a href=\"http://upgi.ddns.net:3355/seedCount/mobileEntry.html\">返回系統</a></div>");
        //res.send("<div>" + req.body.prodLineID + "氣泡數資料寫入成功！</div><div><a href=\"http://192.168.0.16:80/seedCount/mobileEntry.html\">返回系統</a></div>");
    });
});

app.get('/seedCount/api/dailySeedCountResult', function(req, res) {
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "SELECT * FROM productionHistory.dbo.seedCountResult WHERE recordDate='" + req.query.date + "' ORDER BY prodLineID,recordDatetime;";
        console.log(queryString + '\n');
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