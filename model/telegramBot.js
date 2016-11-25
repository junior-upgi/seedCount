"use strict";

var telegramChat = require("./telegramChat.js");

var list = [{
        id: 267738010,
        first_name: "逾期款機器人",
        username: "overdueMonitorBot",
        token: "267738010:AAGT17aLumIfVPNeFWht8eUEPuC2HfAouGk",
        functionList: [],
        joinedGroupIDList: []
    },
    {
        id: 251686312,
        first_name: "氣泡數機器人",
        username: "seedCountBot",
        token: "251686312:AAG8_sczOJvJSwtese4kgzH95RLyX5ZJ114",
        functionList: [],
        joinedGroupIDList: []
    },
    {
        id: 296411532,
        first_name: "UPGI註冊機器人",
        username: "upgiRegisterBot",
        token: "296411532:AAF9U92K7LLKB7g-jvvG4remdHGi90ph2fI",
        functionList: [],
        joinedGroupIDList: []
    },
    {
        id: 278943684,
        first_name: "產品開發機器人",
        username: "productDevelopmentBot",
        token: "278943684:AAHQDQMZrI2_3jPKnrY8tdrhn-2mKN9CwpI",
        functionList: [],
        joinedGroupIDList: []
    },
    {
        id: 260542039,
        first_name: "測試機器人",
        username: "testBot",
        token: "260542039:AAEOxo0MbczouifWwQKDyIyJKBN6Iy43htk",
        functionList: [],
        joinedGroupIDList: []
    },
    {
        id: 287236637,
        first_name: "UPGI IT 機器人",
        username: "upgiITBot",
        token: "287236637:AAHSuMHmaZJ2Vm9gXf3NeSlInrgr-XXzoRo",
        functionList: [],
        joinedGroupIDList: []
    }
];

function getToken(botUsername) {
    var token;
    list.forEach(function(botObject) {
        if (botObject.username === botUsername) {
            token = botObject.token;
        }
    });
    return token;
};

module.exports = {
    list,
    getToken
};