"use strict";

var formAction; // variable to hold the API path to submit the form data to
var editMode = false;
var editModeInProgress = false;

//add click-n-edit/insert functionality to seedCountField cells
//$("td.seedCountField").on("click", function() {
$(document).on("click", "td.seedCountField", function() {
    if ((editMode === true) && (editModeInProgress === false)) {
        var workingCell = $(this);
        var workingRow = $(this).parent();
        editModeInProgress = true;
        // highlight element being edited
        workingCell
            .removeClass("success warning info")
            .addClass("inlineEditing")
            .css("background-color", "red")
            .css("color", "white")
            .css("font-weight", "bold");
        workingRow.after('<tr class="dataEntryRow"></tr>'); // insert one row under the current <tr>
        // load the inline edit template
        $("tr.dataEntryRow").load("../seedCount/frontend/template/inlineEdit.html", function(response, status) {
            if (status === "success") { // if template successfully loaded
                if (workingCell.hasClass("filled")) { // if it's an edit and not a new record
                    loadExistingData(workingCell); // ajax for the existing record
                    $("form#inlineEditForm").append('&nbsp;&nbsp;&nbsp;&nbsp;<button id="deleteRecord" type="button" class="subjectToAccessControl btn btn-danger btn-lg">資料刪除</button>');
                    formAction = "../seedCount/api/updateRecord"; // set the API endpoint to post to update record
                } else {
                    $.get("../seedCount/api/getWorkDatetimeString", {
                        workingDateString: workingCell.data("workingDate"),
                        workingTime: workingCell.data("timePoint").slice(0, 2) + ":" + workingCell.data("timePoint").slice(2)
                    }, function(workDatetimeString) {
                        //load data into common fields 時間、廠區、產線
                        $("input#recordDatetime").val(workDatetimeString);
                        $("input#prodFacilityID").val(workingCell.data("prodFacilityID"));
                        $("input#prodLineID").val(workingCell.data("prodLineID"));
                        formAction = "../seedCount/api/insertRecord"; // set the API endpoint to post to insert record
                    });
                }
                $("#prodReference").focus(); // set keyboard focus on the first input field
                processDataInput(); // when cell data changes, calcuate the result on-the-fly
                $("form#inlineEditForm").submit(function() { // when user clicks on the submit button on the inline edit form
                    $(".subjectToAccessControl").prop("disabled", true);
                    if (workingCell.hasClass("empty")) { // new record requires system to generate both 'created' and 'modified' data
                        $("input#created").val(moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                        $("input#modified").val(moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                    } else { // modification of existing record only requires overwrite of the modified data
                        $("input#modified").val(moment(moment(), "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                    }
                    var formData = new FormData($(this)[0]);
                    $.ajax({
                        url: formAction,
                        type: "post",
                        data: formData,
                        async: true,
                        cache: false,
                        contentType: false,
                        processData: false
                    }).done(function() {
                        refresh();
                    });
                    return false;
                });
                $("form#inlineEditForm").on("reset", function() { // when user clicks on the reset button on the inline edit form
                    setTimeout(function() {
                        loadExistingData(workingCell);
                        $("#prodReference").focus(); // set keyboard focus on the first input field
                    });
                });
                $("button#cancelInlineEdit").on("click", function() { // when user clicks on the cancel button in the inline edit form
                    refresh();
                    return false;
                });
                $("button#deleteRecord").on("click", function() { // when user clicks on the delete record button
                    formAction = "../seedCount/api/deleteRecord";
                    $.post(
                        formAction,
                        $("form#inlineEditForm").serialize(),
                        "json"
                    ).done(function() {
                        refresh();
                    });
                    return false;
                });
            } else { // when template loading does not present a successful result, reset the page
                console.log("編輯面版載入錯誤：" + status);
                refresh();
            }
        });
    }
});

function loadExistingData(cellObject) {
    var workDatetimeString;
    $.get("../seedCount/api/getWorkDatetimeString", {
        workingDateString: cellObject.data("workingDate"),
        workingTime: cellObject.data("timePoint").slice(0, 2) + ":" + cellObject.data("timePoint").slice(2)
    }, function(data) {
        workDatetimeString = data;
        //load data into common fields 時間、廠區、產線
        $("input#recordDatetime").val(workDatetimeString);
        $("input#prodFacilityID").val(cellObject.data("prodFacilityID"));
        $("input#prodLineID").val(cellObject.data("prodLineID"));
        if (cellObject.hasClass("filled")) {
            $.getJSON("../seedCount/api/getRecord", {
                recordDatetime: workDatetimeString,
                prodFacilityID: cellObject.data("prodFacilityID"),
                prodLineID: cellObject.data("prodLineID")
            }).done(function(result) {
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
                    $("div#photoControlGroup").prepend('&nbsp;&nbsp;&nbsp;&nbsp;<button id="deletePhoto" type="button" class="inlineEditControl subjectToAccessControl btn btn-danger" onclick="deletePhotoAction()">刪圖</button>');
                    $("div#photoControlGroup").prepend('<img id="existingPhoto" height="120" width="120"><br>');
                    $("img#existingPhoto").prop("src", "./" + seedCountDataEntry.photoLocation + "?timestamp=" + new Date().getTime());
                    $("div#photoControlGroup").prepend('<input id="existingPhotoPath" name="existingPhotoPath" type="text" class="text-center" size="30" readonly hidden><br>');
                    $("input#existingPhotoPath").val(seedCountDataEntry.photoLocation);
                    $("input#photo").hide();
                }
                $("input#created").val(moment(seedCountDataEntry.created, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
                $("input#modified").val(moment(seedCountDataEntry.modified, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss"));
            }).fail(function() {
                console.log("單筆資料擷取發生錯誤，嘗試重設系統...");
                editModeInProgress = false;
                refresh();
            });
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

function deletePhotoAction() { // when user clicks on the delete photo button
    $("input#existingPhotoPath").val("");
    $("img#existingPhoto").prop("src", "").hide();
    $("button#deletePhoto").hide();
    $("input#photo").show();
};

function toggleEditMode() {
    if (editMode === true) {
        editMode = false;
        editModeInProgress = false;
        $("td.seedCountField").attr("onclick", "");
        $("button#editModeToggleButton").removeClass("btn-primary").addClass("btn-default").text("輸入模式");
        refresh();
    } else {
        editMode = true;
        $("td.seedCountField").attr("onclick", "inlineEdit()");
        $("button#editModeToggleButton").removeClass("btn-default").addClass("btn-primary").text("取消輸入");
        refresh();
    }
};