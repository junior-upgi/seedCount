var telegramChatGroup = require("./telegramChatGroup.js");

var list = [{
    id: "241630569",
    user_name: "junior_upgi",
    first_name: "佳佑",
    last_name: "蔡",
    status: ["admin", "user"],
    joinedGroupList: [
        telegramChatGroup.list[0],
        telegramChatGroup.list[1]
    ],
    upgEmployeeID: "05060001"
}];

module.exports = { list };