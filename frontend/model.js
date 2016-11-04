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
    inspectTimePointList: ['08:00', '10:00', '12:00', '14:00'],
    length: 480
}, {
    reference: "night",
    cReference: "中班",
    start: "15:30",
    end: "23:30",
    inspectTimePointList: ['16:00', '18:00', '20:00', '22:00'],
    length: 480
}, {
    reference: "graveYard",
    cReference: "夜班",
    start: "23:30",
    end: "07:30",
    inspectTimePointList: ['00:00', '02:00', '04:00', '06:00'],
    length: 480
}];

var facilityList = [{
    cReference: '新工總廠'
}];

var prodLineList = [{
    reference: 'L1-1',
    side: 'west'
}, {
    reference: 'L1',
    side: 'west'
}, {
    reference: 'L2',
    side: 'west'
}, {
    reference: 'L3',
    side: 'center'
}, {
    reference: 'L5',
    side: 'center'
}, {
    reference: 'L6',
    side: 'center'
}, {
    reference: 'L7',
    side: 'east'
}, {
    reference: 'L8',
    side: 'east'
}];