"use strict";

var buttonInaccessibleCounter = 5; // 計數器 - 控制按鈕是否可使用 (預防使用者過度點選更新頁面造成錯誤)
var buttonInaccessibleCounterUpperLimit = 5; //控制計數器的停用時間長度上限

function autoRefresh() {
    var now;
    setInterval(function() {
        surveyBroadcastServerStatus();
        now = moment(moment(), "YYYY-MM-DD HH:mm:ss");
        //every second decrease the buttonInaccessibleCount by 1
        decreaseInaccessibleCounter(1);
        //enable/disable buttons depending on the value of buttonInaccessibleCounter variable
        if (buttonInaccessibleCounter > 0) {
            $(".subjectToAccessControl").prop("disabled", true);
        } else {
            $(".subjectToAccessControl").prop("disabled", false);
        }
        //at 58 second mark before each scheduled situation table update, increase the buttonInaccessibleCount by 5
        if ((now.format("m") % 10 === 0) && (now.format("s") === 58)) {
            increaseInaccessibleCounter(5);
        }
        //set situation table to refresh every 30 minutes
        if ((now.format("m") % 10 === 0) && (now.format("s") % 60 === 0)) {
            refresh();
        }
        //update the clock banner
        $("#clockBanner").text(now.format("YYYY-MM-DD HH:mm:ss"));
    }, 1000);
};

/*
// deprecated, to be removed if not other issues are experienced
function updateBroadcastRecord() {
    setInterval(function() {
        $.get("http://upgi.ddns.net:9002/seedCount/api/getRecentBroadcastRecord?workingDate=" + workingDate, function(recordset) {
            var broadcastRecordList = JSON.parse(recordset);
            broadcastRecordList.forEach(function(broadcastRecord) {
                var trimmedTimePoint = moment(broadcastRecord.recordDatetime, "YYYY-MM-DD HH:mm:ss").format("HHmm");
                $("span.broadcastIndicator." + trimmedTimePoint).removeClass("hidden");
            });
        });
    }, 60000);
    return;
};*/

function surveyBroadcastServerStatus() {
    $.ajax({
        url: telegramStatusUrl,
        type: "get",
        success: function(data) {
            $("button#broadcast24HourData").show();
            $("button#broadcastShiftData").show();
        },
        error: function(data) {
            $("button#broadcast24HourData").hide();
            $("button#broadcastShiftData").hide();
        }
    });
    return;
};

function switchToDate() {
    increaseInaccessibleCounter(10);
    if ($("input#designatedDate").val() !== '') {
        removeTableComponent();
        editModeInProgress = false;
        workingDate = $("input#designatedDate").val();
        reinitialize();
    }
}

function previous() {
    increaseInaccessibleCounter(10);
    removeTableComponent();
    editModeInProgress = false;
    workingDate = moment(workingDate, "YYYY-MM-DD").add(-1, "days").format("YYYY-MM-DD");
    reinitialize();
};

function refresh() {
    increaseInaccessibleCounter(10);
    removeTableComponent();
    editModeInProgress = false;
    reinitialize();
};

function today() {
    increaseInaccessibleCounter(10);
    removeTableComponent();
    editModeInProgress = false;
    $.get("../seedCount/api/getWorkingDateString", {
        datetimeString: moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
    }, function(workingDateString) {
        workingDate = workingDateString;
    });
    reinitialize();
};

function next() {
    increaseInaccessibleCounter(10);
    removeTableComponent();
    editModeInProgress = false;
    workingDate = moment(workingDate, "YYYY-MM-DD").add(1, "days").format("YYYY-MM-DD");
    reinitialize();
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