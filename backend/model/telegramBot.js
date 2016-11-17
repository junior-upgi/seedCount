var telegramChatGroup = require("./telegramChatGroup.js");

var list = [{
        id: "267738010",
        first_name: "逾期款機器人",
        username: "overdueMonitorBot",
        token: "267738010:AAGT17aLumIfVPNeFWht8eUEPuC2HfAouGk",
        joinedGroupIDList: [telegramChatGroup.list[0].id]
    },
    {
        id: "251686312",
        first_name: "氣泡數機器人",
        username: "seedCountBot",
        token: "251686312:AAG8_sczOJvJSwtese4kgzH95RLyX5ZJ114",
        joinedGroupIDList: [telegramChatGroup.list[1].id]
    },
    {
        id: "296411532",
        first_name: "UPGI註冊機器人",
        username: "upgiRegisterBot",
        token: "296411532:AAF9U92K7LLKB7g-jvvG4remdHGi90ph2fI",
        joinedGroupIDList: []
    },
    {
        id: "278943684",
        first_name: "產品開發機器人",
        username: "productDevelopmentBot",
        token: "278943684:AAHQDQMZrI2_3jPKnrY8tdrhn-2mKN9CwpI",
        joinedGroupIDList: [telegramChatGroup.list[3].id]
    }
];

module.exports = { list };