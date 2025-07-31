# Rate Limit Monitoring System

The Strava API rate limit logging system is now fully implemented and working! 🎉

## What's Been Implemented

### 1. Database Logging
- **Table**: `RateLimitLog` - stores detailed rate limit data after every API call
- **Data Captured**:
  - Overall limits: 15-minute (600) and daily (6000) request limits
  - Read limits: 15-minute (300) and daily (3000) request limits  
  - Current usage for both overall and read limits
  - Max utilization percentage across all limits
  - Delay applied due to rate limiting
  - Whether the request was rate limited (429 response)
  - Retry-after time if rate limited

### 2. Automatic Logging in StravaService
- **Method**: `logRateLimit()` - logs rate limit data to database
- **Integration**: Called after every API request in `makeRequest()`
- **Smart Warnings**: Logs usage milestones (50%, 67%, 83%, >90% of daily limit)

### 3. Monitoring Scripts

#### Basic Status Check
```bash
node scripts/rate-limit-monitor.js
```
Shows current rate limit status, recent API activity, and usage trends.

#### Live Dashboard (with watch mode)
```bash
node scripts/rate-limit-monitor.js watch
```
Updates every 30 seconds with live rate limit data.

#### Bulk Sync Dashboard
```bash
node scripts/bulk-sync-dashboard.js
```
Real-time dashboard specifically for monitoring bulk sync operations, updates every 10 seconds.

## Key Features

### 🎯 Critical Daily Limit Tracking
- **Current Read Usage**: 1,309/3,000 (44%) ✅
- **Remaining Today**: 1,691 requests
- **Reset Time**: Midnight UTC (automatic tracking)

### 📊 Usage Analytics
- Tracks request rate (requests per minute)
- Shows endpoint breakdown
- Identifies rate limiting events
- Calculates utilization trends

### ⚠️ Smart Warnings
- **2,500+ requests**: 🚨 Critical warning
- **2,000+ requests**: ⚠️ High usage warning  
- **1,500+ requests**: 📈 Moderate usage info

### 🚦 Rate Limiting Protection
- Progressive delays based on utilization:
  - 90%+: 10 second delays
  - 80%+: 5 second delays  
  - 70%+: 2 second delays
  - 50%+: 1 second delays
- Automatic retry on 429 responses
- Respects retry-after headers

## Example Output

```
🔥 CURRENT USAGE (from latest API call):
   Read Requests: 1309/3000 daily (44%)
   Overall Requests: 1309/6000 daily (22%)
   15-min Read: 2/300 (1%)
   15-min Overall: 2/600 (0%)
   Max Utilization: 43.63%
   Last Updated: 7/31/2025, 4:17:10 PM

📋 RECENT API ACTIVITY (last 10 calls):
Time         | Endpoint           | Daily Usage | Util% | Delay | Limited
-------------|-------------------|-------------|-------|-------|--------
4:17:10 PM   | /athlete          | 1309        | 43.63%| 0ms   | ✅ NO
4:15:43 PM   | /athlete          | 1308        | 43.6% | 0ms   | ✅ NO
```

## Database Queries

### Check total rate limit logs
```sql
SELECT COUNT(*) FROM rate_limit_logs;
```

### View recent activity
```sql
SELECT endpoint, timestamp, readUsageDaily, readLimitDaily, maxUtilizationPercent 
FROM rate_limit_logs 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Find rate limiting events
```sql
SELECT * FROM rate_limit_logs 
WHERE wasRateLimited = true 
ORDER BY timestamp DESC;
```

## Benefits

1. **Visibility**: See exactly how many of your 3,000 daily read requests you've used
2. **Prevention**: Automatic rate limiting prevents hitting API limits
3. **Debugging**: Detailed logs help identify usage patterns and issues
4. **Planning**: Trend analysis helps optimize bulk sync timing
5. **Monitoring**: Real-time dashboards for operational visibility

The system is now ready for production use and will help you stay well within Strava's API limits while maximizing throughput! 🚀
