import fs from 'fs';

// Step 1: Load the JSON data from the file
fs.readFile('./public/geojson/hourly.json', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }

    const jsonData = JSON.parse(data);
    const hourlyData = jsonData.hourly;
    const timeStamps = hourlyData.time;
    const radiationData = hourlyData.shortwave_radiation_instant;
    const dniData = hourlyData.direct_normal_irradiance_instant;

    // Step 2: Aggregate daily data
    const dailyAggregation = {};

    timeStamps.forEach((timestamp, index) => {
        const date = timestamp.split("T")[0]; // Extract date
        if (!dailyAggregation[date]) {
            dailyAggregation[date] = {
                totalShortwave: 0,
                totalDNI: 0,
                count: 0
            };
        }

        dailyAggregation[date].totalShortwave += radiationData[index];
        dailyAggregation[date].totalDNI += dniData[index];
        dailyAggregation[date].count += 1;
    });

    // Step 3: Calculate daily averages
    const dailyAverages = {};
    for (const date in dailyAggregation) {
        dailyAverages[date] = {
            avgShortwave: dailyAggregation[date].totalShortwave / dailyAggregation[date].count,
            avgDNI: dailyAggregation[date].totalDNI / dailyAggregation[date].count
        };
    }

    // Step 4: Output the results
    fs.writeFile('daily_averages.json', JSON.stringify(dailyAverages, null, 4), (err) => {
      if (err) {
          console.error("Error writing file:", err);
          return;
      }
      console.log('Daily averages written to daily_averages.json');
  });
});
