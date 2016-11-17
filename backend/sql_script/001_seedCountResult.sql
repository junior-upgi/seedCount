SELECT
	CONVERT(VARCHAR(10), DATEADD(DAY,-1,d.recordDatetime), 120) AS recordDate
	,CONVERT(VARCHAR(8),DATEADD(DAY,-1,d.recordDatetime), 108) AS recordTime
	,d.recordDatetime
	,d.prodFacilityID
	,d.prodLineID
	,d.prodReference
	,d.count_0
	,d.count_1
	,d.count_2
	,d.count_3
	,d.count_4
	,d.count_5
	,d.validEntryCount
	,d.avgCount
	,d.thickness
	,d.unitSeedCount
	,d.note
	,d.photoLocation
	,d.created
	,d.modified
FROM (
	SELECT b.recordDatetime
		  ,b.prodFacilityID
		  ,b.prodLineID
		  ,b.prodReference
		  ,b.count_0
		  ,b.count_1
		  ,b.count_2
		  ,b.count_3
		  ,b.count_4
		  ,b.count_5
		  ,c.validEntryCount
		  ,ROUND(CAST(ISNULL(b.count_0,0)+ISNULL(b.count_1,0)+ISNULL(b.count_2,0)+ISNULL(b.count_3,0)+ISNULL(b.count_4,0)+ISNULL(b.count_5,0) AS FLOAT)/c.validEntryCount,2) AS avgCount
		  ,b.thickness
		  ,ROUND((CAST(ISNULL(b.count_0,0)+ISNULL(b.count_1,0)+ISNULL(b.count_2,0)+ISNULL(b.count_3,0)+ISNULL(b.count_4,0)+ISNULL(b.count_5,0) AS FLOAT)/c.validEntryCount)*(10/b.thickness),2) AS unitSeedCount
		  ,b.note
		  ,b.photoLocation
		  ,b.created
		  ,b.modified
	FROM productionHistory.dbo.seedCount AS b
		LEFT JOIN (
			SELECT a.recordDatetime, a.prodFacilityID, a.prodLineID, COUNT(*) AS validEntryCount
			FROM (
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_0 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_1 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_2 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_3 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_4 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_5 IS NOT NULL) AS a
			GROUP BY a.recordDatetime, a.prodFacilityID, a.prodLineID) AS c ON (b.recordDatetime=c.recordDatetime AND b.prodFacilityID=c.prodFacilityID AND b.prodLineID=c.prodLineID)) AS d
WHERE CAST(d.recordDatetime AS TIME) BETWEEN '00:00' AND '07:30'
UNION ALL
SELECT
	CONVERT(VARCHAR(10),d.recordDatetime, 120) AS recordDate
	,CONVERT(VARCHAR(8),d.recordDatetime, 108) AS recordTime
	,d.recordDatetime
	,d.prodFacilityID
	,d.prodLineID
	,d.prodReference
	,d.count_0
	,d.count_1
	,d.count_2
	,d.count_3
	,d.count_4
	,d.count_5
	,d.validEntryCount
	,d.avgCount
	,d.thickness
	,d.unitSeedCount
	,d.note
	,d.photoLocation
	,d.created
	,d.modified
FROM (
	SELECT b.recordDatetime
		  ,b.prodFacilityID
		  ,b.prodLineID
		  ,b.prodReference
		  ,b.count_0
		  ,b.count_1
		  ,b.count_2
		  ,b.count_3
		  ,b.count_4
		  ,b.count_5
		  ,c.validEntryCount
		  ,ROUND(CAST(ISNULL(b.count_0,0)+ISNULL(b.count_1,0)+ISNULL(b.count_2,0)+ISNULL(b.count_3,0)+ISNULL(b.count_4,0)+ISNULL(b.count_5,0) AS FLOAT)/c.validEntryCount,2) AS avgCount
		  ,b.thickness
		  ,ROUND((CAST(ISNULL(b.count_0,0)+ISNULL(b.count_1,0)+ISNULL(b.count_2,0)+ISNULL(b.count_3,0)+ISNULL(b.count_4,0)+ISNULL(b.count_5,0) AS FLOAT)/c.validEntryCount)*(10/b.thickness),2) AS unitSeedCount
		  ,b.note
		  ,b.photoLocation
		  ,b.created
		  ,b.modified
	FROM productionHistory.dbo.seedCount AS b
		LEFT JOIN (
			SELECT a.recordDatetime, a.prodFacilityID, a.prodLineID, COUNT(*) AS validEntryCount
			FROM (
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_0 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_1 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_2 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_3 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_4 IS NOT NULL
				UNION ALL
				SELECT * FROM productionHistory.dbo.seedCount WHERE count_5 IS NOT NULL) AS a
			GROUP BY a.recordDatetime, a.prodFacilityID, a.prodLineID) AS c ON (b.recordDatetime=c.recordDatetime AND b.prodFacilityID=c.prodFacilityID AND b.prodLineID=c.prodLineID)) AS d
WHERE CAST(d.recordDatetime AS TIME) NOT BETWEEN '00:00' AND '07:30';