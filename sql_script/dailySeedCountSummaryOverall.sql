SELECT year
      ,month
      ,day
	  ,AVG(avgUnitSeedCount) AS avgUnitSeedCount
FROM productionHistory.dbo.dailySeedCountSummaryByProdLine
GROUP BY year,month,day;