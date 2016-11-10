"use strict";

var editMode = false;
var editModeInProgress = false;
var formAction; // variable to hold the API path to submit the form data to 

//add click-n-edit/insert functionality to seedCountField cells
$(document).on("click", "td.seedCountField", function() {
    if ((editMode === true) && (editModeInProgress === false)) {
        editModeInProgress = true;
        var workingCell = $(this);
        var workingRow = $(this).parent();
        // highlight element being edited
        workingCell
            .removeClass("success warning info")
            .addClass("inlineEditing")
            .css("background-color", "red")
            .css("color", "white")
            .css("font-weight", "bold");
        workingRow.after('<tr class="dataEntryRow"></tr>'); // insert one row under the current <tr>
        // load the inline edit template
        $("tr.dataEntryRow").load("./template/inlineEdit.html", function(response, status) {
            if (status === "success") { // if template successfully loaded
                if (workingCell.hasClass("filled")) { // if it's an edit and not a new record
                    loadExistingData(workingCell); // ajax for the existing record
                    $("form#inlineEditForm").append('&nbsp;&nbsp;&nbsp;&nbsp;<button id="deleteRecord" class="btn btn-danger btn-lg">刪除</button>');
                    formAction = backendHost + "/seedCount/api/updateRecord"; // set the API endpoint to post to update record
                } else {
                    //load data into common fields 時間、廠區、產線
                    $("input#recordDatetime").val(getWorkDatetimeString(
                        workingCell.data("workingDate"),
                        workingCell.data("timePoint").slice(0, 2) + ":" + workingCell.data("timePoint").slice(2)));
                    $("input#prodFacilityID").val(workingCell.data("prodFacilityID"));
                    $("input#prodLineID").val(workingCell.data("prodLineID"));
                    formAction = backendHost + "/seedCount/api/insertRecord"; // set the API endpoint to post to insert record
                }
                $("#prodReference").focus(); // set keyboard focus on the first input field
                readyFormForSubmission(workingCell); // confirm form is ready for submission after this point
                processDataInput(); // when cell data changes, calcuate the result on-the-fly
                $("form#inlineEditForm").submit(function() { // when user clicks on the submit button on the inline edit form
                    $(this).ajaxSubmit();
                    return false;
                });
                $("form#inlineEditForm").on("reset", function() { // when user clicks on the reset button on the inline edit form
                    loadExistingData(workingCell);
                });
                $("button#cancelInlineEdit").on("click", function() { // when user clicks on the cancel button in the inline edit form
                    //due to the way jquery.form.js works, the only way known to cancel a submission is through 'return false' in the beforeSubmit option
                    $(this).ajaxSubmit({
                        beforeSubmit: function() {
                            refresh();
                            return false;
                        }
                    });
                    return false;
                });
                deleteRecord();
            } else { // when template loading does not present a successful result, reset the page
                console.log("編輯面版載入錯誤：" + status);
                refresh();
            }
        });
    }
});

function deleteRecord() {
    formAction = "";
};

function loadExistingData(cellObject) {
    $.getJSON(backendHost + "/seedCount/api/getRecord", {
        recordDatetime: getWorkDatetimeString(
            cellObject.data("workingDate"),
            cellObject.data("timePoint").slice(0, 2) + ":" + cellObject.data("timePoint").slice(2)),
        prodFacilityID: cellObject.data("prodFacilityID"),
        prodLineID: cellObject.data("prodLineID")
    }).done(function(result) {
        //load data into common fields 時間、廠區、產線
        $("input#recordDatetime").val(getWorkDatetimeString(
            cellObject.data("workingDate"),
            cellObject.data("timePoint").slice(0, 2) + ":" + cellObject.data("timePoint").slice(2)));
        $("input#prodFacilityID").val(cellObject.data("prodFacilityID"));
        $("input#prodLineID").val(cellObject.data("prodLineID"));
        //if data retrieval is successful, fill the input fields with returned result
        var seedCountDataEntry = JSON.parse(result)[0];
        $("input#prodReference").val(seedCountDataEntry.prodReference);
        $("input#count_0").val(seedCountDataEntry.count_0);
        $("input#count_1").val(seedCountDataEntry.count_1);
        $("input#count_2").val(seedCountDataEntry.count_2);
        $("input#count_3").val(seedCountDataEntry.count_3);
        $("input#count_4").val(seedCountDataEntry.count_4);
        $("input#count_5").val(seedCountDataEntry.count_5);
        $("input#thickness").val(seedCountDataEntry.thickness);
        $("textarea#note").val(seedCountDataEntry.note);
        //work with possible existence of photos
        if (seedCountDataEntry.photoLocation !== null) {
            $("div#photoControlGroup").prepend('<img id="existingPhoto" height="120" width="120"><br>');
            $("img#existingPhoto").prop("src", backendHost + "/" + seedCountDataEntry.photoLocation);
            $("div#photoControlGroup").prepend('<span id="existingPhotoPath"></span><br>');
            $("span#existingPhotoPath").text(seedCountDataEntry.photoLocation);
        }
        $("input#created").val(moment(seedCountDataEntry.created, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
        $("input#modified").val(moment(seedCountDataEntry.modified, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
    }).fail(function() {
        console.log("單筆資料擷取發生錯誤，嘗試重設系統...");
        editModeInProgress = false;
        refresh();
    });
};

function readyFormForSubmission(cellObject) {
    $("form#inlineEditForm").ajaxForm({
        url: formAction,
        method: "post",
        beforeSubmit: function() {
            editModeInProgress = false;
            if (cellObject.hasClass("empty")) {
                // generate a new created datetime if it's a new record, 'filled' records should already have a created datetime value
                $("input#created").val(moment.tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"));
            }
            $("input#modified").val(moment.tz("Asia/Taipei").format("YYYY-MM-DD HH:mm:ss"));
        },
        success: function() {
            refresh();
        }
    });
};

function processDataInput() {
    $("input.inlineEditControl.seedCountField,input#thickness").on("change", function() {
        var seedCountSum = 0;
        var validEntryCount = 0;
        if ($("input#thickness").val() !== "") {
            $("input.inlineEditControl.seedCountField").each(function(index) {
                if ($(this).val() !== "") {
                    seedCountSum += Number($(this).val());
                    validEntryCount++;
                }
            });
            if (validEntryCount > 0) {
                $("td.seedCountField.inlineEditing").text(Math.round((seedCountSum / validEntryCount) * (10 / Number($("input#thickness").val())) * 100) / 100);
            }
        }
    });
};

function toggleEditMode() {
    if (editMode === true) {
        editMode = false;
        editModeInProgress = false;
        $("td.seedCountField").attr("onclick", "");
        $("button#editModeToggleButton").removeClass("btn-primary").addClass("btn-default").text("修改模式");
        refresh();
    } else {
        editMode = true;
        $("td.seedCountField").attr("onclick", "inlineEdit()");
        $("button#editModeToggleButton").removeClass("btn-default").addClass("btn-primary").text("取消修改模式");
        refresh();
    }
};