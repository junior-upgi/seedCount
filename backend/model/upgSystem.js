var telegramChatGroup = require("./telegramChatGroup.js");
var telegramUser = require("./telegramUser.js");

var list = [{
    id: "wasteReduction",
    jobList: []
}, {
    id: "overdueMonitor",
    jobList: []
}, {
    id: "seedCount",
    jobList: [{
        id: "scheduledUpdate",
        reference: "例行氣泡數據通報",
        type: "periodicFunction",
        online: true,
        broadcast: true,
        schedule: "10 30 7,15,23 * * *", // everyday at 07:30:10, 15:30:10, and 23:30:10
        //schedule: "*/5 * * * * *", // testing
        targetGroupIDList: [telegramChatGroup.list[1].id], // 製造
        targetUserIDList: [telegramUser.list[0].id], // 蔡佳佑
        observePeriod: 8,
        alertLevel: 10
    }, {
        id: "irregularityBroadcast",
        reference: "氣泡數異常通報",
        type: "singleExecution",
        online: false,
        broadcast: false,
        schedule: "",
        targetGroupIDList: [
            telegramChatGroup.list[0].id, // 業務
            telegramChatGroup.list[1].id // 製造
        ],
        targetUserIDList: [telegramUser.list[0].id], // 蔡佳佑
        observePeriod: 8,
        alertLevel: 10
    }]
}];

module.exports = { list };