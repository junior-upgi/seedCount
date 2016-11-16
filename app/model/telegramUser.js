var telegramChatGroup = require("./telegramChatGroup.js");

var list = [{
    id: "241630569",
    user_name: "junior_upgi",
    first_name: "佳佑",
    last_name: "蔡",
    status: ["admin", "user"],
    joinedGroupIDList: [
        telegramChatGroup.list[0].id,
        telegramChatGroup.list[1].id
    ],
    upgEmployeeID: "05060001"
}, {
    id: "252069370",
    user_name: "upgi_spark",
    first_name: "于斌",
    last_name: "林",
    status: ["admin", "user"],
    joinedGroupList: [],
    upgEmployeeID: "16080003"
}, {
    id: "240006091",
    user_name: null,
    first_name: "治儒",
    last_name: "陳",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "15050003"
}, {
    id: "261033177",
    user_name: null,
    first_name: "顯鈞",
    last_name: "黃",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "16010002"
}, {
    id: "270251655",
    username: "Wenghungta",
    first_name: "宏達",
    last_name: "翁",
    status: ["admin", "user"],
    joinedGroupList: [],
    upgEmployeeID: "99030003"
}, {
    id: "243538978",
    username: "upgfurnace",
    first_name: "高榮",
    last_name: "張",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "10120001"
}, {
    id: "260499091",
    username: "Jacobchuang",
    first_name: "再興",
    last_name: "莊",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "88080073"
}, {
    id: "297313252",
    username: "UPGElle",
    first_name: "世玲",
    last_name: "翁",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "07100003"
}, {
    id: "280941957",
    username: "upgijacklin",
    first_name: "建睿",
    last_name: "林",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "94030001"
}, {
    id: "269370139",
    username: "Oliviachen0227",
    first_name: "逸樺",
    last_name: "陳",
    status: ["user"],
    joinedGroupList: [],
    upgEmployeeID: "06070004"
}];

module.exports = { list };