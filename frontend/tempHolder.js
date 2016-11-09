

    $(document).ready(function() {
        $("#clockBanner").text(initializeDatetime.format("YYYY-MM-DD HH:mm:ss"));
        $("#designatedDate").val(workingDate);
        constructSituationTable(workingDate);
        autoRefresh();
    });


