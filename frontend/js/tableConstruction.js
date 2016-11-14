"use strict";

var hideProdReferenceColumn = true;
var hideTimePointColumn = true;
var preventDisplay = true;

function constructSituationTable(dateString) {
    // construct the table heading
    $("#situationTableHeading").append('<th class="text-center">班次</th><th id="timePointFieldLabel" class="text-center">時間</th><th id="prodReferenceFieldLabel" class="text-center">產品</th>');
    $.each(prodLineList, function(index, prodLine) {
        $("#situationTableHeading").append('<th class="text-center ' + prodLine.reference + '">' + prodLine.reference + '</th>');
        //check if the index production line has the hidden property being true, if so, add a prevent display class attributes
        if (prodLine.hidden === true) {
            $("th." + prodLine.reference).addClass("preventDisplay");
        }
    });
    $("#situationTableHeading").append('<th class="text-center">平均</th>');
    // loop through each shift
    $.each(shiftList, function(index, shift) {
        //loop though each seed count examin check point
        $.each(shift.inspectTimePointList, function(index, inspectTimePoint) {
            //create first three fields and add appropriate class attributes for identification
            $("#situationTableDataSection").append(
                '<tr class="processing">' +
                '<td class="processing shiftField"></td>' +
                '<td class="processing timePointField"></td>' +
                '<td class="processing prodReferenceField"></td>' +
                '</tr>');
            $("tr.processing").addClass(shift.reference + ' ' + inspectTimePoint.trimmedTimePoint);
            $("td.processing.shiftField").html(shift.cReference).addClass("text-center " + shift.reference + ' ' + inspectTimePoint.trimmedTimePoint);
            $("td.processing.timePointField").html(inspectTimePoint.trimmedTimePoint).addClass("text-center " + shift.reference + ' ' + inspectTimePoint.trimmedTimePoint);
            $("td.processing.prodReferenceField").addClass("text-center " + shift.reference + ' ' + inspectTimePoint.trimmedTimePoint);
            //review the shiftList for items with hidden property of true, add a 'preventDisplay' class
            if (inspectTimePoint.hidden === true) {
                $("tr.processing." + inspectTimePoint.trimmedTimePoint).addClass("preventDisplay");
            }
            //loop though each production line
            $.each(prodLineList, function(index, prodLine) {
                //create one field for each production line and add appropriate class attributes for identification
                $("tr.processing").append('<td class="seedCountField processing empty ' + prodLine.reference + '"></td>');
                $("td." + prodLine.reference + ".processing")
                    .addClass("text-center " + facilityList[0].cReference + " " + shift.reference + ' ' + inspectTimePoint.trimmedTimePoint)
                    .data("workingDate", dateString)
                    .data("timePoint", inspectTimePoint.trimmedTimePoint)
                    .data("prodFacilityID", facilityList[0].cReference)
                    .data("prodLineID", prodLine.reference);
                //review the prodLineList for items with hidden property of true, add a 'preventDisplay' class
                if (prodLine.hidden === true) {
                    $("td.processing." + prodLine.reference).addClass("preventDisplay");
                }
            });
            // add one cell for summary
            $("tr.processing").append('<th class="processing hourlyAverageField"></td>')
            $("th.processing.hourlyAverageField").addClass("text-center " + shift.reference + ' ' + inspectTimePoint.trimmedTimePoint);
            $(".processing").removeClass("processing"); // remove all temp processing class attrib
        });
    });
    // construct the footer summary section
    $("#situationTableFooter").append('<th id="situationTableFooterLabel" class="text-center" colspan="3">當日平均</th>');
    // loop though each production line
    $.each(prodLineList, function(index, prodLine) {
        $("#situationTableFooter").append('<th class="text-center prodLineAverageField ' + prodLine.reference + '"></th>');
        //review the prodLineList for items with hidden property of true, add a 'preventDisplay' class
        if (prodLine.hidden === true) {
            $("th.prodLineAverageField." + prodLine.reference).addClass("preventDisplay");
        }
    });
    // create daily overall summary
    $("#situationTableFooter").append('<th class="text-center dailyAverageField"></th>');
    // proceed to getting actual table data, first get the record count
    var getRecordCount = function() { // promise of ajax function
        return $.getJSON(backendHost + ":" + backendHostPort + "/seedCount/api/getRecordCount?workingDate=" + dateString)
            .then(function(result) {
                return JSON.parse(result)[0].recordCount;
            });
    };
    var getRecordset = function() { // promise of ajax function
        return $.getJSON(backendHost + ":" + backendHostPort + "/seedCount/api/getRecordset?workingDate=" + dateString)
            .then(function(recordset) {
                return (JSON.parse(recordset));
            });
    };
    getRecordCount().done(function(recordCount) {
        if (recordCount < 1) { // if not records are found
            $("#workingDateBanner").text(dateString + " 尚無"); //set the date label on the situation table caption
            //skip the table data population step and go straight to table formatting
            formatSituationTable();
        } else { // if there are record(s) existed in the current date displayed
            $("#workingDateBanner").text(dateString); //set the date label on the situation table caption
            //ajax POST for seed count data and pass on the data for processing
            getRecordset().done(function(recordset) {
                populateSituationTable(recordset);
            });
        }
    });
    /*
    // proceed to getting actual table data, first get the record count
    $.getJSON(backendHost + ":" + backendHostPort + "/seedCount/api/getRecordCount?workingDate=" + dateString, function(result) {
        if (JSON.parse(result)[0].recordCount < 1) { // if not records are found
            $("#workingDateBanner").text(dateString + " 尚無"); //set the date label on the situation table caption
            //skip the table data population step and go straight to table formatting
            formatSituationTable();
        } else { // if there are record(s) existed in the current date displayed 
            $("#workingDateBanner").text(dateString); //set the date label on the situation table caption
            //ajax POST for seed count data and pass on the data for processing
            $.getJSON(backendHost + ":" + backendHostPort + "/seedCount/api/getRecordset?workingDate=" + dateString, function(result) {
                populateSituationTable(JSON.parse(result));
            });
        }
    });
    */
};

// populate data into the situation table
function populateSituationTable(seedCountRecordSet) {
    // loop through each record
    $.each(seedCountRecordSet, function(index, seedCountRecord) {
        var recordDatetime = moment(seedCountRecord.recordDatetime, "YYYY-MM-DD HH:mm:ss");
        // construct identification info for product cell from the index'ed record
        var productReferenceCellSelector = "td.prodReferenceField" + "." + recordDatetime.format("HHmm");
        // using the ID info to grab the correct <td> to insert data
        $(productReferenceCellSelector).append('<div>' + seedCountRecord.prodReference + '</div>');
        // construct identification info for seedCount Cell from the index'ed record
        var seedCountCellSelector = "td.seedCountField." + seedCountRecord.prodLineID + "." + recordDatetime.format("HHmm");
        // using the ID info to grab the correct <td> to insert data
        $(seedCountCellSelector).append(Math.round(seedCountRecord.unitSeedCount * 100) / 100).removeClass("empty").addClass("filled");
    });
    $("td,th").css("vertical-align", "middle");
    // cycle through each shift (每兩小時當日平均)
    $.each(shiftList, function(index, shift) {
        //cycle through each inspectTimePoint
        $.each(shift.inspectTimePointList, function(index, inspectTimePoint) {
            var validEntryCount = 0,
                seedCountSum = 0;
            //cycle through each bi-hourly <tr> and count the valid entries and get the sum of the entries
            $("td.seedCountField.filled." + inspectTimePoint.trimmedTimePoint).each(function(index, seedCountCell) {
                seedCountSum += Number($(this).text());
                validEntryCount++;
            });
            if (validEntryCount > 0) {
                // if there are valid entries, calculate the bi-hourly average
                $("th.hourlyAverageField." + inspectTimePoint.trimmedTimePoint).text(Math.round(((Math.round(seedCountSum * 100) / 100) / validEntryCount) * 100) / 100);
            }
        });
    });
    // calculate the summary column data
    $.each(prodLineList, function(index, prodLine) { // cycle through each production line (每線當日平均)
        var validEntryCount = 0,
            seedCountSum = 0;
        $("td.seedCountField.filled." + prodLine.reference).each(function(index, seedCountCell) {
            seedCountSum += Number($(this).text());
            validEntryCount++;
        });
        if (validEntryCount > 0) {
            //if there are valid entries, calculate the bi-hourly average
            $("th.prodLineAverageField." + prodLine.reference).text(Math.round(((Math.round(seedCountSum * 100) / 100) / validEntryCount) * 100) / 100);
        }
    });
    // daily overall average
    var validEntryCount = 0,
        seedCountSum = 0;
    $("td.seedCountField.filled").each(function(index, seedCountCell) {
        seedCountSum += Number($(this).text());
        validEntryCount++;
    });
    if (validEntryCount > 0) {
        //if there are valid entries, calculate the bi-hourly average
        $("th.dailyAverageField").text(Math.round(((Math.round(seedCountSum * 100) / 100) / validEntryCount) * 100) / 100);
    }
    formatSituationTable();
};

function formatSituationTable() {
    $("td,th").css("vertical-align", "middle");
    $("td.day.seedCountField").addClass("success");
    $("td.night.seedCountField").addClass("warning");
    $("td.graveYard.seedCountField").addClass("info");
    $("td,th").css("border", "1px solid gray");
    if (hideTimePointColumn === true) {
        $("th#timePointFieldLabel,td.timePointField").css("display", "none");
        $("th#situationTableFooterLabel").attr("colspan", $("th#situationTableFooterLabel").attr("colspan") - 1);
    }
    if (hideProdReferenceColumn === true) {
        $("th#prodReferenceFieldLabel,td.prodReferenceField").css("display", "none");
        $("th#situationTableFooterLabel").attr("colspan", $("th#situationTableFooterLabel").attr("colspan") - 1);
    }
    $("td.filled,th.hourlyAverageField,th.prodLineAverageField,th.dailyAverageField").each(function(index, filledSeedCountField) {
        switch (true) {
            case ($(this).text() < seedCountLevelCap[0].ceiling):
                $(this).css("color", "green");
                break;
            case ($(this).text() < seedCountLevelCap[1].ceiling):
                $(this).css("color", "black");
                break;
            case ($(this).text() < seedCountLevelCap[2].ceiling):
                $(this).css("font-weight", "bold").css("color", "blue");
                break;
            default:
                $(this).css("font-weight", "bold").css("color", "red");
                break;
        }
    });
    if (preventDisplay === true) {
        $(".preventDisplay").hide();
        $("button#preventDisplayToggleButton").text("顯示");
    } else {
        $(".preventDisplay").show();
        $("button#preventDisplayToggleButton").text("隱藏");
    }
};

function togglePreventDisplay() {
    // prevent user from changing the preventDisplay status when inlineEdit mode is enabled
    // 1. to prevent unexpected behavior
    // 2. so that only visible cells should be possible to edit
    if (editMode === false) {
        if (preventDisplay === true) {
            preventDisplay = false;
            $(".preventDisplay").show();
            $("button#preventDisplayToggleButton").text("隱藏");
        } else {
            preventDisplay = true;
            $(".preventDisplay").hide();
            $("button#preventDisplayToggleButton").text("顯示");
        }
    } else {
        alert("要改變顯示內容請先將修改模式關閉！");
    }
};

function removeTableComponent() {
    $("span.workingDate").empty();
    $("tr#situationTableFooter").empty();
    $("tbody#situationTableDataSection").empty();
    $("tr#situationTableHeading").empty();
}