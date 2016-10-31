var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mssql = require('mssql');
var moment = require('moment');
var utility = require('./uuidGenerator.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var mssqlConfig = {
    user: 'productionHistory',
    password: 'productionHistory',
    server: '192.168.168.5'
}

app.post('/seedCount/api/newEntry', function(req, res) {
    var messageObject = {
        //submissionID: req.body.submission_id,
        //formID: req.body.formID,
        //ip: req.body.ip,
        recordDatetime: moment(req.body.recorddatetime[0] +
            '-' + req.body.recorddatetime[1] +
            '-' + req.body.recorddatetime[2] +
            ' ' + req.body.recorddatetime[3] +
            ':' + req.body.recorddatetime[4] + ':00', "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"),
        seedCount: req.body.prodline_1_1,
        note: "'" + req.body.note_1_1 + "'",
        photoName: req.body.photo_1_1,
        photoSource: {
            hostname: "www.jotform.com",
            port: 443,
            path: "/uploads/junior_upgi/" + req.body.formID + '/' + req.body.submission_id + '/' + req.body.photo_1_1,
            method: 'GET'
        },
        photoDestination: "'/home/junior/project_upgilinuxvm1/seedCount/photos/L1-1/" +
            moment(req.body.recorddatetime[0] + '-' +
                req.body.recorddatetime[1] + '-' +
                req.body.recorddatetime[2] + ' ' +
                req.body.recorddatetime[3] + ':' +
                req.body.recorddatetime[4], "YYYY-MM-DD HH:mm").format("YYYYMMDDHHmmss") + '/' + req.body.photo_1_1 + "'"
    };
    //deal with possible NULL values
    if (req.body.photo_1_1 === undefined) {
        messageObject.photoName = "NULL";
        messageObject.photoDestination = "NULL";
        messageObject.photoSource = "NULL";
    }
    //deal with possible NULL values
    if (req.body.note_1_1 === undefined) {
        messageObject.note = "NULL";
    }
    // connect to data server
    mssql.connect(mssqlConfig, function(error) {
        if (error) throw error;
        var request = new mssql.Request();
        var queryString = "INSERT INTO productionHistory.dbo.seedCount VALUES ('" + messageObject.recordDatetime + "','新工總廠','L1-1'," + messageObject.seedCount + "," + messageObject.note + "," + messageObject.photoDestination + ",'" + moment().format("YYYY-MM-DD HH:mm:ss") + "');";
        // insert data
        request.query(queryString, function(error, resultSet) {
            if (error) throw error;
            mssql.close();
            //console.log(messageObject);
            //console.log(req.body);
            res.send("<div>氣泡數資料寫入成功！</div><div><a href=\"http://upgi.ddns.net:3355/seedCount/index.html\">返回系統</a></div>");
        });
    });
});

app.listen(4949);
console.log('seedCount backend server is running on port 4949...\n');