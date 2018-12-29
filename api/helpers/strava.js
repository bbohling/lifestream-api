
const Promise = require("bluebird");
const request = require("request-promise");

module.exports = {
  friendlyName: 'strava helper',
  description: 'foo',
  inputs: {
    userId: {
      type: 'string',
      example: 'brandon',
      description: 'First name of the person.',
      required: true
    },
    getAll: {
      type: 'boolean',
      description: 'ingest all data',
      required: false
    }
  },
  fn: startIngest
}

let ingestAllData = false;

async function startIngest(inputs, exits) {
  ingestAllData = inputs.getAll;
  const userToken = sails.config.users[inputs.userId].accessToken;
  const options = requestOptions(userToken);
  const done = await getActivities(options);
  return exits.success('success');
}

function requestOptions(accessToken) {
  // STRAVA API
  return {
    url: sails.config.apis.strava.activities,
    qs: {
      access_token: accessToken,
      per_page: 200,
      page: 1
    },
    useQuerystring: true
  };
}


function getActivities(options) {
  return request(options)
    .then(JSON.parse)
    .then(activities => {
      if (activities && activities.length > 0) {
        if ((!ingestAllData && options.qs.page < 2) || ingestAllData) {
          sails.log(options.qs.page);
          options.qs.page++;
          return Promise.map(activities, activity => {
            return findOrCreateActivity(activity);
          }, { concurrency: 5 })
            .then(() => {
              return getActivities(options);
            });
        }
      }
      else {
        return;
      }
    });
}

function findOrCreateActivity(activity) {
  const data = {
    id: activity.id,
    athleteId: activity.athlete.id,
    name: activity.name || '',
    distance: activity.distance,
    movingTime: activity.moving_time,
    elapsedTime: activity.elapsed_time,
    totalElevationGain: activity.total_elevation_gain,
    elevationHigh: activity.elev_high,
    elevationLow: activity.elev_low,
    activityType: activity.type,
    startDate: activity.start_date_local,
    achievementCount: activity.achievement_count,
    prCount: activity.pr_count,
    trainer: activity.trainer,
    commute: activity.commute,
    gear: activity.gear_id || '',
    averageSpeed: activity.average_speed,
    maxSpeed: activity.max_speed,
    averageCadence: activity.average_cadence,
    averageTemperature: activity.average_temp,
    averageWatts: activity.average_watts,
    maxWattts: activity.max_watts,
    weightedAverageWatts: activity.weighted_average_watts,
    kilojoules: activity.kilojoules,
    deviceWatts: activity.device_watts,
    averageHeartRate: activity.average_heartrate,
    maxHeartRate: activity.max_heartrate,
    sufferScore: activity.suffer_score || 0
  };

  return Activity
    .findOne({ id: activity.id })
    .then(results => {
      if (results) {
        return Activity.update({ id: activity.id }, data);
      } else {
        return Activity.create(data);
      }
    });

}

// average/max speed calculation
function metersPerSecondToMilesPerHour(mps) {
  let mph = 0;
  if (mps) {
    mph = (mps * 25 / 11);
  }
  return mph;
}

// totalElevationGain calculation
function feetFromMeters(m) {
  let ft = 0;
  if (m) {
    ft = (m / 0.3048);
  }
  return ft;
}

// elevation high/low calculation
function metersToFeet(m) {
  let ft = 0;
  if (m) {
    ft = (m * 3.28084);
  }
  return ft;
}

// distance calculation
function metersToMiles(m) {
  let mi = 0;
  if (m) {
    mi = (m / 1609.34).toFixed(2);
  }
  return mi;
}

// averageTemperature calculation
function farenheitFromCelcius(c) {
  let f = 0;
  if (c) {
    f = (c * 9 / 5 + 32);
  }
  return f;
}
