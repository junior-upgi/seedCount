var seedCountLevelCap = [{
    situation: "良好",
    ceiling: 4
}, {
    situation: "正常",
    ceiling: 8
}, {
    situation: "偏高",
    ceiling: 10
}, {
    situation: "嚴重",
    ceiling: 9999
}];

var shiftList = [{
    reference: "day",
    cReference: "早班",
    start: "07:30",
    end: "15:30",
    //inspectTimePointList: ['08:00', '10:00', '12:00', '14:00'],
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
    length: 480
}, {
    reference: "night",
    cReference: "中班",
    start: "15:30",
    end: "23:30",
    //inspectTimePointList: ['16:00', '18:00', '20:00', '22:00'],
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
    length: 480
}, {
    reference: "graveYard",
    cReference: "夜班",
    start: "23:30",
    end: "07:30",
    //inspectTimePointList: ['00:00', '02:00', '04:00', '06:00'],
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
    length: 480
}];

var facilityList = [{
    cReference: '新工總廠'
}];

var prodLineList = [{
    reference: 'L1-1',
    side: 'west',
    hidden: true
}, {
    reference: 'L1',
    side: 'west',
    hidden: false
}, {
    reference: 'L2',
    side: 'west',
    hidden: false
}, {
    reference: 'L3',
    side: 'center',
    hidden: true
}, {
    reference: 'L5',
    side: 'center',
    hidden: true
}, {
    reference: 'L6',
    side: 'center',
    hidden: false
}, {
    reference: 'L7',
    side: 'east',
    hidden: false
}, {
    reference: 'L8',
    side: 'east',
    hidden: false
}];