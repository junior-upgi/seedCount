"use strict";

var list = [{ /* ** */
    id: -224820909,
    title: '統義業務部',
    type: 'group'
}, {
    id: -224420315,
    title: '統義生產部',
    type: 'group'
}, { /* ** */
    id: -150874076,
    title: "業務群組",
    type: "group"
}, {
    id: -155069392,
    title: "玻璃製造群組",
    type: "group"
}, {
    id: -157638300,
    title: "資訊群組",
    type: "group"
}, {
    id: -164742782,
    title: "產品開發群組",
    type: "group"
}];

function getChatID(title) {
    var chat_id;
    list.forEach(function (chatObject) {
        if (chatObject.title === title) {
            chat_id = chatObject.id;
        }
    });
    return chat_id;
};

module.exports = {
    getChatID,
    list
};
