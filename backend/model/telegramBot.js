var telegramChatGroup = require("./telegramChatGroup.js");

var list = [{
        id: "267738010",
        first_name: "逾期款機器人",
        username: "overdueMonitorBot",
        token: "267738010:AAGT17aLumIfVPNeFWht8eUEPuC2HfAouGk",
        joinedGroupList: [telegramChatGroup.list[0]]
    },
    {
        id: "251686312",
        first_name: "氣泡數機器人",
        username: "seedCountBot",
        token: "251686312:AAG8_sczOJvJSwtese4kgzH95RLyX5ZJ114",
        joinedGroupList: [telegramChatGroup.list[1]]
    }
];

module.exports = { list };