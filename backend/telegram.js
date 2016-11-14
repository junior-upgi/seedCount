const botAPIurl = "https://api.telegram.org/bot";

var chatGroupList = [{
    id: "-150874076",
    reference: "sales",
    title: "業務"
}, {
    id: "-155069392",
    reference: "glass_manufacture",
    title: "玻璃製造"
}];

var botList = [{
        id: "267738010",
        first_name: "逾期款機器人",
        username: "overdueMonitorBot",
        token: "267738010:AAGT17aLumIfVPNeFWht8eUEPuC2HfAouGk",
        joinedGroupList: [chatGroupList[0]]
    },
    {
        id: "251686312",
        first_name: "氣泡數機器人",
        username: "seedCountBot",
        token: "251686312:AAG8_sczOJvJSwtese4kgzH95RLyX5ZJ114",
        joinedGroupList: [chatGroupList[1]]
    }
];

var userList = [{
    id: "241630569",
    user_name: "junior_upgi",
    first_name: "佳佑",
    last_name: "蔡",
    status: ["admin", "user"],
    joinedGroupList: [chatGroupList[0], chatGroupList[1]],
    upgEmployeeID: "05060001"
}];

var systemList = [{
    id: "wasteReduction",
    jobList: []
}, {
    id: "overdueMonitor",
    jobList: []
}, {
    id: "seedCount",
    jobList: [{
        id: "scheduledUpdate",
        online: true,
        broadcast: true,
        schedule: "0 30 7,15,23 * * *", // everyday at 07:30, 15:30, and 23:30
        //schedule: "0 */1 * * * *", // testing
        targetGroupList: [chatGroupList[1]],
        targetUserList: [userList[0]],
        observePeriod: 8,
        alertLevel: 10
    }]
}];

var seedCountSystem = systemList[2];

var scheduledSeedCountUpdateJob = seedCountSystem.jobList[0];

var glass_manufacture_groupID = chatGroupList[1].id;

var seedCountBotToken = botList[1].token;

var junior_upgi_ID = userList[0].id;

module.exports = {
    botAPIurl,
    chatGroupList,
    botList,
    userList,
    systemList,
    seedCountSystem,
    scheduledSeedCountUpdateJob,
    glass_manufacture_groupID,
    seedCountBotToken,
    junior_upgi_ID
};