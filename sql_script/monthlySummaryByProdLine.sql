SELECT
	prodLineID,
	DATEPART(year,recordDate) AS year,
	DATEPART(month,recordDate) AS month,
	AVG(unitSeedCount) AS avgUnitSeedCount
FROM productionHistory.dbo.seedCountResult
GROUP BY DATEPART(year,recordDate),DATEPART(month,recordDate),prodLineID;