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

app.post('/seedCount/api/newEntry', upload.any(), function(req, res) {
    //deal with NULL array in the case that photo isn't uploaded
    var photoLocation;
    if (req.files.length == 0) {
        photoLocation = "NULL";
    } else {
        photoLocation = req.files[0].destination + req.body.prodLineID + '/' + moment(req.body.recordDate + ' ' + req.body.recordTime + ':00').format("YYYYMMDDHHmmss") + '.JPG';
        fs.rename(req.files[0].path, photoLocation, function(error) {
            console.log(error);
        });
    }
    // connect to data server
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "INSERT INTO productionHistory.dbo.seedCount VALUES ('" +
            moment(req.body.recordDate + ' ' + req.body.recordTime + ':00').format("YYYY-MM-DD HH:mm:ss") + "','" +
            req.body.prodFacilityID + "','" +
            req.body.prodLineID + "'," +
            req.body.seedCount + "," +
            (req.body.note === '' ? "NULL" : "'" + req.body.note + "'") + "," +
            (photoLocation === "NULL" ? "NULL" : "'" + photoLocation + "'") + ",'" +
            moment().format("YYYY-MM-DD HH:mm:ss") + "');";
        // insert data
        request.query(queryString, function(error, resultSet) {
            if (error) throw error;
            mssql.close();
            res.send("<div>" + req.body.prodLineID + "氣泡數資料寫入成功！</div><div><a href=\"http://upgi.ddns.net:3355/seedCount/index.html\">返回系統</a></div>");
            //res.send("<div>氣泡數資料寫入成功！</div><div><a href=\"http://192.168.0.16:80/seedCount/index.html\">返回系統</a></div>");
        });
    });
});

app.listen(4949);
console.log('seedCount backend server is running on port 4949...\n');