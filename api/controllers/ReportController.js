const moment = require('moment');

module.exports = {

  cyclingYearly: cyclingYearly,
  cyclingProgress: cyclingProgress

};

let dates = {};

Object.defineProperty(dates, 'today', {
  get: function () { return moment.utc().utcOffset(-8, false).format(); }
});

Object.defineProperty(dates, 'todayDate', {
  get: function () { return moment.utc().utcOffset(-8, false).format(); }
});

Object.defineProperty(dates, 'firstDayThisYear', {
  get: function () { return moment.utc().utcOffset(-8, false).startOf('year').format(); }
});

Object.defineProperty(dates, 'lastYearToday', {
  get: function () { return moment.utc().utcOffset(-8, false).subtract(1, 'years').format(); }
});

Object.defineProperty(dates, 'firstDayLastYear', {
  get: function () { return moment.utc().utcOffset(-8, false).subtract(1, 'years').startOf('year').format(); }
});

async function cyclingYearly(req, res) {
  const userId = req.params.userId;
  if (!userId) {
    return res.json(400, { error: 'No user provided.' });
  }

  const query = `
  select YEAR(startDate) as 'year',
    count(*) as 'totalRides',
    COUNT(DISTINCT DATE(startDate)) as 'rideDays',
    cast(round((sum(distance)/1609.34),0) as INT) as miles,
    round((sum(movingTime)/(60*60))) as hours,
    cast(round((sum(totalElevationGain)/0.3048),0) as INT) as climbing,
    cast(round(sum(kilojoules),0) as INT) as calories,
    round((sum(sufferScore)/count(sufferScore))) as avgSufferScore
  from activity
  where athleteId=${sails.config.users[userId].athleteId}
    and (activityType='VirtualRide' OR activityType='Ride')
  group by YEAR(startDate)
  `;

  const results = await sails.sendNativeQuery(query);

  return res.json({
    data: results.rows
  });
}

async function cyclingProgress(req, res) {
  const userId = req.params.userId;
  if (!userId) {
    return res.json(400, { error: 'No user provided.' });
  }
  const thisYearResults = await Activity.find({
    where: {
      athleteId: sails.config.users[userId].athleteId,
      activityType: { in: ['VirtualRide', 'Ride'] },
      startDate: { "<=": dates.today, ">=": dates.firstDayThisYear }
    }
  });

  const lastYearResults = await Activity.find({
    where: {
      athleteId: sails.config.users[userId].athleteId,
      activityType: { in: ['VirtualRide', 'Ride'] },
      startDate: { "<=": dates.lastYearToday, ">=": dates.firstDayLastYear }
    }
  });

  let retval = {
    thisYear: await processData(thisYearResults),
    lastYear: await processData(lastYearResults)
  }

  return res.json({
    data: retval
  });

}

function simpleDate(dt) {
  return moment.utc(dt).format('YYYYMMDD');
}

async function processData(results) {
  let data = {};

  // total rides
  data.rides = results.length;

  // days ridden
  var rideDates = _.pluck(results, 'startDate');
  var rideNewDates = _.map(rideDates, simpleDate);
  //        console.log('ride dates: ', rideNewDates);
  var daysRidden = _.uniq(rideNewDates).length;
  data.daysRidden = daysRidden;

  // miles
  var distances = _.pluck(results, 'distance');
  var meters = _.reduce(distances, function (sum, num) {
    return sum + num
  });
  var rawMiles = Math.ceil(meters / 1609.34);
  data.miles = (meters > 0) ? rawMiles : 0;

  // ride average
  data.rideAverage = 0;
  if (!isNaN(rawMiles) && data.rides > 0) {
    data.rideAverage = Math.round((rawMiles / data.rides) * 10) / 10;
  }

  // average miles per day
  data.dailyAverage = 0;
  if (!isNaN(rawMiles)) {
    var day = moment.utc().utcOffset(-8, false).dayOfYear();
    var avg = rawMiles / day;
    data.dailyAverage = Math.round(avg * 10) / 10;
  }

  // percentage riding days
  data.percentageOfDays = 0;
  if (results.length > 0) {
    // var ridePercentage = results.length / day;
    var ridePercentage = daysRidden / day;
    data.percentageOfDays = Math.floor(ridePercentage * 100);
  }

  // climbing
  var climbing = _.pluck(results, 'totalElevationGain');
  var climbingMeters = _.reduce(climbing, function (sum, num) {
    return sum + num;
  });
  var climbingFeet = (climbingMeters > 0) ? Math.ceil(climbingMeters / 0.3048) : 0;
  data.climbing = climbingFeet;

  // calories
  var calories = _.pluck(results, 'kilojoules');
  var caloriesNoUndefineds = _.compact(calories);
  var cals = _.reduce(caloriesNoUndefineds, function (sum, num) {
    return sum + num
  });
  data.calories = (cals > 0) ? Math.ceil(cals) : 0;

  // moving time
  var times = _.pluck(results, 'movingTime');
  var time = _.reduce(times, function (sum, num) {
    return sum + num
  });
  var minutes = time / 60;
  data.movingTimeMinutes = (minutes > 0) ? Math.ceil(minutes) : 0;

  // average sufferScore
  var sufferScores = _.pluck(results, 'sufferScore');
  var totalSuffering = _.reduce(sufferScores, (sum, num) => sum + num);
  data.averageSufferScore = Math.round(totalSuffering / data.rides);

  return data;
}

/*
function processData(results) {
    return new Promise(function (resolve) {
        // only keep ride data
        results = _.remove(results, function (item) {
            return item.workout_type !== 3;
        });

        var data = {

        };

        // gear
        var noGear = _.pluck(_.filter(results, function (activity) {
            if (!activity.gear_id) {
                return activity.id;
            }
        }), 'id');

        console.log('gear', noGear);

        // total rides

        // TODO: probably should change this to capture days ridden
        //       sometimes I do multiple trainer rides in a single session
        //       so simply using number of rides is a bit misleading
        data.rides = results.length;

        // days ridden
        var rideDates = _.pluck(results, 'start_date_local');
        var rideNewDates = _.map(rideDates, simpleDate);
//        console.log('ride dates: ', rideNewDates);
        var daysRidden = _.uniq(rideNewDates).length;
        data.daysRidden = daysRidden;



        sails.log(distances.length);
        // miles
        var distances = _.pluck(results, 'distance');
        var meters = _.reduce(distances, function (sum, num) {
            return sum + num
        });
        var rawMiles = Math.ceil(meters / 1609.34);
        data.miles = (meters > 0) ? rawMiles : 0;

        if (fullReport) {
            // ride average
            data.rideAverage = 0;
            if (!isNaN(rawMiles) && data.rides > 0) {
                data.rideAverage = Math.round((rawMiles / data.rides) * 10) / 10;
            }

            // average miles per day
            data.dailyAverage = 0;
            if (!isNaN(rawMiles)) {
                var day = moment().dayOfYear();
                var avg = rawMiles / day;
                data.dailyAverage = Math.round(avg * 10) / 10;
            }


            // percentage riding days
            data.percentageOfDays = 0;
            if (results.length > 0) {
                // var ridePercentage = results.length / day;
                var ridePercentage = daysRidden / day;
                data.percentageOfDays = Math.floor(ridePercentage * 100);
            }

        }

        // climbing
        var climbing = _.pluck(results, 'total_elevation_gain');
        var climbingMeters = _.reduce(climbing, function (sum, num) {
            return sum + num;
        });
        var climbingFeet = (climbingMeters > 0) ? Math.ceil(climbingMeters / 0.3048) : 0;
        data.climbing = climbingFeet;

        // calories
        var calories = _.pluck(results, 'kilojoules');
        var caloriesNoUndefineds = _.compact(calories);
        var cals = _.reduce(caloriesNoUndefineds, function (sum, num) {
            return sum + num
        });
        data.calories = (cals > 0) ? Math.ceil(cals) : 0;

        if (fullReport) {
            // average calories
            data.caloriesAverage = 0;
            if (data.rides > 0) {
                data.caloriesAverage = Math.ceil(data.calories / data.rides);
            }

            // moving time
            var times = _.pluck(results, 'moving_time');
            var time = _.reduce(times, function (sum, num) {
                return sum + num
            });
            var minutes = time / 60;
            data.movingTimeMinutes = (minutes > 0) ? Math.ceil(minutes) : 0;

        }

        resolve(data);
    });
}
*/


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
