-- Sample user insertion for testing
-- Replace the values with your actual Strava credentials

INSERT INTO users (id, name, athlete_id, access_token, refresh_token, expires_at, last_sync_at, created_at, updated_at)
VALUES (
  'cm123example',
  'brandon',
  12345678,
  'your_strava_access_token_here',
  'your_strava_refresh_token_here',
  1735689600,
  NULL,
  datetime('now'),
  datetime('now')
);

-- Sample activity data for testing reports
INSERT INTO activities (
  id, athlete_id, name, distance, moving_time, elapsed_time,
  total_elevation_gain, elevation_high, elevation_low, activity_type,
  start_date, achievement_count, pr_count, trainer, commute, gear,
  average_speed, max_speed, average_cadence, average_temperature,
  average_watts, max_watts, weighted_average_watts, kilojoules,
  device_watts, average_heart_rate, max_heart_rate, suffer_score,
  kom_count, best_kom_rank, best_pr_rank, segment_efforts,
  created_at, updated_at
) VALUES (
  987654321,
  12345678,
  'Morning Ride with KOM',
  25000.0,
  3600,
  3900,
  500.0,
  100.0,
  10.0,
  'Ride',
  '2024-01-15 08:00:00',
  2,
  1,
  0,
  0,
  'bike123',
  6.94,
  15.28,
  85.0,
  15.0,
  200.0,
  350,
  220,
  800.0,
  1,
  145.0,
  165,
  75,
  2,
  1,
  3,
  '[{"id":123456,"name":"Tunnel Rd","segmentId":673683,"segmentName":"Tunnel Rd","komRank":1,"prRank":3,"achievements":["kom"],"elapsedTime":300,"movingTime":295,"distance":1200,"startIndex":100,"endIndex":200},{"id":123457,"name":"Hawk Hill","segmentId":229781,"segmentName":"Hawk Hill","komRank":2,"prRank":null,"achievements":["kom"],"elapsedTime":480,"movingTime":475,"distance":1800,"startIndex":300,"endIndex":500}]',
  datetime('now'),
  datetime('now')
);

-- Sample raw activity data for testing
INSERT INTO raw_activities (
  activity_id, raw_data, created_at, updated_at
) VALUES (
  987654321,
  '{"id": 987654321, "name": "Morning Ride with KOM", "type": "Ride", "distance": 25000, "moving_time": 3600, "segment_efforts": [{"id": 123456, "name": "Tunnel Rd", "kom_rank": 1, "pr_rank": 3, "achievements": ["kom"]}, {"id": 123457, "name": "Hawk Hill", "kom_rank": 2, "pr_rank": null, "achievements": ["kom"]}]}',
  datetime('now'),
  datetime('now')
);
