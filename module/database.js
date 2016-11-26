var mssql = require("mssql");
var config = require("../config.js");

exports.executeSql = function(query, callback) {
    var connection = new mssql.Connection(config.mssqlConfig);
    connection.connect()
        .then(function() {
            var request = new mssql.Request(connection);
            request.query(query)
                .then(function(recordset) {
                    callback(recordset);
                })
                .catch(function(error) {
                    console.log(error);
                    callback(null, error);
                });
        })
        .catch(function(error) {
            console.log(error);
            callback(null, error);
        });
};