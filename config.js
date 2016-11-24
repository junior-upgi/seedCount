var serverHost = "http://localhost"; //development
//var serverHost = "http://192.168.168.25"; // production server
var serverPort = process.env.PORT || 9002;
var broadcastServerHost = "http://upgi.ddns.net";
var broadcastServerPort = process.env.PORT || 9001;
var mssqlServerHost = "http://upgi.ddns.net"; // access database from the internet (development)
//var mssqlServerHost = "http://192.168.168.5"; // access database from LAN (production)
var upgiSystemAccount = "upgiSystem";
var upgiSystemPassword = "upgiSystem";

var mssqlConfig = {
    server: mssqlServerHost.slice(7),
    user: upgiSystemAccount,
    password: upgiSystemPassword
};

const workingTimezone = "Asia/Taipei"

module.exports = {
    serverHost,
    serverPort,
    broadcastServerHost,
    broadcastServerPort,
    upgiSystemAccount,
    upgiSystemPassword,
    mssqlConfig,
    workingTimezone
};