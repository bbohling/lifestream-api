module.exports = {

  yearlyCycling: yearlyCycling

};

async function yearlyCycling(req, res) {
  const userId = req.params.userId;
  if (!userId) {
    return res.json(400, { error: 'No user provided.' });
  }

  const query = `
    select YEAR(startDate) as 'Year',
      cast(round((sum(distance)/1609.34),0) as INT) as Miles,
      round((sum(movingTime)/(60*60))) as Hours,
      cast(round((sum(totalElevationGain)/0.3048),0) as INT) as Climbing
    from activity
    where athleteId=${sails.config.users[userId].athleteId}
      and (activityType='VirtualRide' OR activityType='Ride')
    group by YEAR(startDate)`;

  const results = await sails.sendNativeQuery(query);

  return res.json({
    data: results.rows
  });
}

/*

/cycling/progress
{
  "thisYear": {
    "rides": 105,
    "daysRidden": 91,
    "miles": 2168,
    "rideAverage": 20.6,
    "dailyAverage": 6,
    "percentageOfDays": 25,
    "climbing": 161495,
    "calories": 100418,
    "caloriesAverage": 957,
    "movingTimeMinutes": 10089
  },
  "lastYear": {
    "rides": 83,
    "daysRidden": 76,
    "miles": 2065,
    "rideAverage": 24.9,
    "dailyAverage": 5.7,
    "percentageOfDays": 20,
    "climbing": 148667,
    "calories": 104663,
    "caloriesAverage": 1261,
    "movingTimeMinutes": 9179
  }
}

/cycling/trends
{
  "graph": {
    "title": "Cycling Trends",
    "refreshEveryNSeconds": 3600,
    "total": false,
    "type": "bar",
    "xAxis": {
      "showEveryLabel": false
    },
    "datasequences": Array[2][
      {
        "title": "thisYear",
        "color": "blue",
        "datapoints": Array[5][
          {
            "title": "rides",
            "value": 105
          },
          {
            "title": "daysRidden",
            "value": 91
          },
          {
            "title": "miles",
            "value": 2168
          },
          {
            "title": "climbing",
            "value": 161495
          },
          {
            "title": "calories",
            "value": 100418
          }
        ]
      },
      {
        "title": "lastYear",
        "color": "lightGray",
        "datapoints": Array[5][
          {
            "title": "rides",
            "value": 83
          },
          {
            "title": "daysRidden",
            "value": 76
          },
          {
            "title": "miles",
            "value": 2065
          },
          {
            "title": "climbing",
            "value": 148667
          },
          {
            "title": "calories",
            "value": 104663
          }
        ]
      }
    ]
  }
}
*/
