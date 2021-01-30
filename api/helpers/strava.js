const Promise = require('bluebird');
const request = require("request-promise");
const moment = require("moment");

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

const defaultUser = 'brandon';
let ingestAllData = false;
let tokenInfo = {};
let user;

async function startIngest(inputs, exits) {
  ingestAllData = inputs.getAll;
  user = inputs.userId || defaultUser;
  // const userToken = sails.config.users[inputs.userId].accessToken;
  const tokens = await requestRefreshToken(user);
  if (tokens) {
    const options = requestOptions(tokens);
    console.log(options);
    const done = await getActivities(options);
    return exits.success('success');
  } else {
    return exits.error({ message: 'error' })
  }

}

async function requestRefreshToken(user) {
  // first, check to see if we have a valid token
  tokenInfo = await User.findOne({ name: user });
  if (tokenInfo) {
    // check to see if valid
    const expires = moment.unix(tokenInfo.expiresAt);
    // expired token
    if (moment().isAfter(expires)) {
      console.log('======= EXPIRED TOKEN ==========');
      tokenInfo = getNewToken({ user });
    }
  } else {
    // no token,
    tokenInfo = getNewToken({ user });
  }
  console.log(tokenInfo);
  return tokenInfo;
}

async function getNewToken({ refreshToken, user }) {
  const options = {
    method: 'post',
    url: `${sails.config.apis.strava.oauth}/token`,
    qs: {
      client_id: sails.config.apis.strava.clientId,
      client_secret: sails.config.apis.strava.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken || sails.config.users[user].refreshToken
    }
  };
  const response = await request(options);
  if (response) {
    const json = JSON.parse(response);
    // refresh token details
    const tokenDetails = {
      name: user,
      accessToken: json.access_token,
      refreshToken: json.refresh_token,
      expiresAt: json.expires_at
    }
    console.log(tokenDetails);
    // see if there is a user
    const existingUser = await User.findOne({ name: user });
    if (existingUser) {
      // update
      await User.updateOne({ name: user })
        .set(tokenDetails);
    } else {
      // create user
      await User.create(tokenDetails);
    }
    return tokenDetails;
  } else {
    console.log(`unable to getNewToken: ${options}`);
    return null;
  }
}

function requestOptions(tokens) {
  // STRAVA API
  return {
    url: sails.config.apis.strava.activities,
    qs: {
      per_page: 200,
      page: 1
    },
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`
    },
    useQuerystring: true
  };
}


function getActivities(options) {
  return request(options)
    .then(JSON.parse)
    .then(activities => {
      if (activities && activities.length > 0) {
        console.log(`activity count: ${activities.length}`);
        if ((!ingestAllData && options.qs.page < 2) || ingestAllData) {
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
    startDate: activity.start_date_local.replace('Z', ''),
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
