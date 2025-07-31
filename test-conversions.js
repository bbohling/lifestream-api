import { StravaService } from '../src/services/stravaService.js';

// Test the unit conversion in transformation
const mockActivity = {
  id: 123456789,
  name: 'Test Conversion',
  distance: 1609.34, // 1 mile in meters
  total_elevation_gain: 304.8, // 1000 feet in meters
  average_speed: 4.4704, // 10 mph in m/s
  average_temp: 20, // 68°F in Celsius
  athlete: { id: 12345 },
  type: 'Ride',
  start_date_local: '2024-01-01T08:00:00',
  moving_time: 3600,
  elapsed_time: 3600
};

const stravaService = new StravaService();
const result = stravaService.transformActivity(mockActivity);

console.log('Original values (metric):');
console.log('Distance (meters):', mockActivity.distance);
console.log('Elevation (meters):', mockActivity.total_elevation_gain);
console.log('Speed (m/s):', mockActivity.average_speed);
console.log('Temperature (°C):', mockActivity.average_temp);

console.log('\nConverted values (imperial):');
console.log('Distance (miles):', result.activityData.distance);
console.log('Elevation (feet):', result.activityData.totalElevationGain);
console.log('Speed (mph):', result.activityData.averageSpeed);
console.log('Temperature (°F):', result.activityData.averageTemperature);

console.log('\nExpected vs actual:');
console.log('Distance: expected ~1.0, got', result.activityData.distance);
console.log('Elevation: expected ~1000, got', result.activityData.totalElevationGain);
console.log('Speed: expected ~10, got', result.activityData.averageSpeed);
console.log('Temperature: expected 68, got', result.activityData.averageTemperature);
