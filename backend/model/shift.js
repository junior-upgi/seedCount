var shiftList = [{
    reference: "day",
    cReference: "早班",
    start: "07:30",
    end: "15:30",
    inspectTimePointList: [{
            timePoint: "08:00",
            trimmedTimePoint: "0800",
            hidden: true
        },
        {
            timePoint: "10:00",
            trimmedTimePoint: "1000",
            hidden: true
        },
        {
            timePoint: "12:00",
            trimmedTimePoint: "1200",
            hidden: true
        },
        {
            timePoint: "14:00",
            trimmedTimePoint: "1400",
            hidden: false
        }
    ],
    duration: 480
}, {
    reference: "night",
    cReference: "中班",
    start: "15:30",
    end: "23:30",
    inspectTimePointList: [{
            timePoint: "16:00",
            trimmedTimePoint: "1600",
            hidden: true
        },
        {
            timePoint: "18:00",
            trimmedTimePoint: "1800",
            hidden: true
        },
        {
            timePoint: "20:00",
            trimmedTimePoint: "2000",
            hidden: true
        },
        {
            timePoint: "22:00",
            trimmedTimePoint: "2200",
            hidden: false
        }
    ],
    duration: 480
}, {
    reference: "graveYard",
    cReference: "夜班",
    start: "23:30",
    end: "07:30",
    inspectTimePointList: [{
            timePoint: "00:00",
            trimmedTimePoint: "0000",
            hidden: true
        },
        {
            timePoint: "02:00",
            trimmedTimePoint: "0200",
            hidden: true
        },
        {
            timePoint: "04:00",
            trimmedTimePoint: "0400",
            hidden: true
        },
        {
            timePoint: "06:00",
            trimmedTimePoint: "0600",
            hidden: false
        }
    ],
    duration: 480
}];

module.exports = { shiftList };