"use strict";

var config = require("../config.js");

const botAPIUrl = "https://api.telegram.org/bot";
const statusUrl = config.broadcastServerHost + ":" + config.broadcastServerPort + "/status";

module.exports = {
    botAPIUrl,
    statusUrl
};