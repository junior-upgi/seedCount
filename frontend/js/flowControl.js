"use strict";
var buttonInaccessibleCounter = 5; // 計數器 - 控制按鈕是否可使用 (預防使用者過度點選更新頁面造成錯誤)
var buttonInaccessibleCounterUpperLimit = 5; //控制計數器的停用時間長度上限

function autoRefresh() {
    var now;
    setInterval(function() {
        now = moment.tz(moment(), workingTimezone);
        //every second decrease the buttonInaccessibleCount by 1
        decreaseInaccessibleCounter(1);
        //enable/disable buttons depending on the value of buttonInaccessibleCounter variable
        if (buttonInaccessibleCounter > 0) {
            $("button:not(button#preventDisplayToggleButton)").prop("disabled", true);
            $("input#submitInlineEdit,input#resetInlineEdit").prop("disabled", true);
        } else {
            $("button:not(button#preventDisplayToggleButton)").prop("disabled", false);
            $("input#submitInlineEdit,input#resetInlineEdit").prop("disabled", false);
        }
        //at 58 second mark before each scheduled situation table update, increase the buttonInaccessibleCount by 5
        if ((now.format("m") % 10 === 0) && (now.format("s") === 58)) {
            increaseInaccessibleCounter(5);
        }
        //set situation table to refresh every 30 minutes
        if ((now.format("m") % 30 === 0) && (now.format("s") % 60 == 0)) {
            refresh();
        }
        //update the clock banner
        $("#clockBanner").text(now.format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
};

function switchToDate() {
    increaseInaccessibleCounter(10, 10);
    if ($("#designatedDate").val() !== '') {
        $("span.workingDate").empty();
        $("tr#situationTableFooter").empty();
        $("tbody#situationTableDataSection").empty();
        $("tr#situationTableHeading").empty();
        editModeInProgress = false;
        workingDate = $("#designatedDate").val();
        constructSituationTable(workingDate);
    }
}

function previous() {
    increaseInaccessibleCounter(10, 10);
    $("span.workingDate").empty();
    $("tr#situationTableFooter").empty();
    $("tbody#situationTableDataSection").empty();
    $("tr#situationTableHeading").empty();
    editModeInProgress = false;
    workingDate = moment.tz(workingDate, "Asia/Taipei").add(-1, "days").format("YYYY-MM-DD");
    constructSituationTable(workingDate);
};

function refresh() {
    increaseInaccessibleCounter(10, 10);
    $("span.workingDate").empty();
    $("tr#situationTableFooter").empty();
    $("tbody#situationTableDataSection").empty();
    $("tr#situationTableHeading").empty();
    editModeInProgress = false;
    constructSituationTable(workingDate);
};

function today() {
    increaseInaccessibleCounter(10, 10);
    $("span.workingDate").empty();
    $("tr#situationTableFooter").empty();
    $("tbody#situationTableDataSection").empty();
    $("tr#situationTableHeading").empty();
    editModeInProgress = false;
    workingDate = getWorkDateString(moment.tz(moment(), "Asia/Taipei"));
    constructSituationTable(workingDate);
};

function next() {
    increaseInaccessibleCounter(10, 10);
    $("span.workingDate").empty();
    $("tr#situationTableFooter").empty();
    $("tbody#situationTableDataSection").empty();
    $("tr#situationTableHeading").empty();
    editModeInProgress = false;
    workingDate = moment.tz(workingDate, "Asia/Taipei").add(1, "days").format("YYYY-MM-DD");
    constructSituationTable(workingDate);
};

function decreaseInaccessibleCounter(numberOfSecond) {
    if (buttonInaccessibleCounter - numberOfSecond >= 0) {
        buttonInaccessibleCounter -= numberOfSecond;
    }
};

function increaseInaccessibleCounter(numberOfSecond) {
    if ((buttonInaccessibleCounter + numberOfSecond) <= buttonInaccessibleCounterUpperLimit) {
        buttonInaccessibleCounter += numberOfSecond;
    } else {
        buttonInaccessibleCounter = buttonInaccessibleCounterUpperLimit;
    }
};