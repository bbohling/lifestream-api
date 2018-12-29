module.exports = {
  attributes: {
    id: {
      type: 'number',
      required: true
    },
    athleteId: {
      type: 'number'
    },
    name: {
      type: 'string'
    },
    distance: {
      type: 'number',
      columnType: 'FLOAT'
    },
    movingTime: {
      type: 'number'
    },
    elapsedTime: {
      type: 'number'
    },
    totalElevationGain: {
      type: 'number',
      columnType: 'FLOAT'
    },
    elevationHigh: {
      type: 'number',
      columnType: 'FLOAT'
    },
    elevationLow: {
      type: 'number',
      columnType: 'FLOAT'
    },
    activityType: {
      type: 'string'
    },
    startDate: {
      type: 'string'//,
      // columnType: 'datetime'
    },
    achievementCount: {
      type: 'number'
    },
    prCount: {
      type: 'number'
    },
    trainer: {
      type: 'boolean'
    },
    commute: {
      type: 'boolean'
    },
    gear: {
      type: 'string'
    },
    averageSpeed: {
      type: 'number',
      columnType: 'FLOAT'
    },
    maxSpeed: {
      type: 'number',
      columnType: 'FLOAT'
    },
    averageCadence: {
      type: 'number',
      columnType: 'FLOAT'
    },
    averageTemperature: {
      type: 'number',
      columnType: 'FLOAT'
    },
    averageWatts: {
      type: 'number',
      columnType: 'FLOAT'
    },
    maxWatts: {
      type: 'number'
    },
    weightedAverageWatts: {
      type: 'number'
    },
    kilojoules: {
      type: 'number',
      columnType: 'FLOAT'
    },
    deviceWatts: {
      type: 'boolean'
    },
    averageHeartRate: {
      type: 'number',
      columnType: 'FLOAT'
    },
    maxHeartRate: {
      type: 'number'
    },
    sufferScore: {
      type: 'number',
      defaultsTo: 0
    }
  }
};
