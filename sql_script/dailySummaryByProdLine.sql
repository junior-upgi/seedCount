SELECT
	prodLineID
	,DATEPART(year,recordDate) AS year
	,DATEPART(month,recordDate) AS month
	,DATEPART(day,recordDate) AS day
	,AVG(unitSeedCount) AS avgUnitSeedCount
FROM productionHistory.dbo.seedCountResult
GROUP BY DATEPART(year,recordDate),DATEPART(month,recordDate),DATEPART(day,recordDate),prodLineID;