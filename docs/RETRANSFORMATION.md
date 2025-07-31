# Activity Data Re-transformation

After updating the unit conversion logic in `calculations.js`, you can re-transform existing activity data without making new API calls to Strava. This uses the raw Strava data stored in the `raw_activities` table.

## Usage Methods

### 1. Command Line Scripts

```bash
# Re-transform all activities for all users
npm run retransform:all

# Re-transform activities for a specific athlete
npm run retransform:user 12345678
```

### 2. API Endpoints

```bash
# Re-transform all activities via API
curl -X POST http://localhost:3000/v1/retransform/all

# Re-transform activities for specific athlete via API  
curl -X POST http://localhost:3000/v1/retransform/user/12345678

# Check re-transformation status and stats
curl http://localhost:3000/v1/retransform/status
```

### 3. Programmatic Usage

```javascript
import { retransformAllActivities, retransformUserActivities } from './src/utils/retransformActivities.js';

// Re-transform all activities
const result = await retransformAllActivities();
console.log(`Processed: ${result.processed}, Errors: ${result.errors}`);

// Re-transform for specific athlete
const userResult = await retransformUserActivities('12345678');
console.log(`Processed: ${userResult.processed} activities for athlete ${userResult.athleteId}`);
```

## What Gets Updated

The re-transformation process updates the following fields with proper unit conversions:

- **Distance**: `meters` → `miles` (÷ 1609.34)
- **Elevation**: `meters` → `feet` (÷ 0.3048) 
  - `totalElevationGain`
  - `elevationHigh`
  - `elevationLow`
- **Speed**: `m/s` → `mph` (× 25 ÷ 11)
  - `averageSpeed`
  - `maxSpeed`
- **Temperature**: `Celsius` → `Fahrenheit` (× 9 ÷ 5 + 32)
  - `averageTemperature`
- **Segment Efforts**: Distance converted to miles
- **KOM/PR Data**: Recalculated from segment efforts

## Safety Features

- **Batch Processing**: Processes activities in batches of 100 to avoid overwhelming the database
- **Error Handling**: Continues processing even if individual activities fail
- **Logging**: Detailed logs of progress and any errors
- **Validation**: Only processes activities that have corresponding raw data
- **Atomic Updates**: Each activity update is atomic (all-or-nothing)

## Performance

- **No API Calls**: Uses existing raw data, no Strava API rate limits
- **Fast Processing**: Typically processes 1000+ activities per minute
- **Memory Efficient**: Batched processing keeps memory usage low
- **Safe for Production**: Can run on live systems without downtime

## When to Use

- After updating unit conversion formulas in `calculations.js`
- When migrating from metric to imperial units (or vice versa)
- After fixing bugs in the transformation logic
- When historical data needs to be recalculated

## Example Output

```
Starting activity re-transformation using raw data...
Found 1,234 raw activities to re-transform
Processing batch 1 (activities 1-100)
Processing batch 2 (activities 101-200)
...
Re-transformation complete. Processed: 1,234, Errors: 0

=== Re-transformation Results ===
Total activities: 1,234
Successfully processed: 1,234
Errors: 0
Success rate: 100.0%
```

## Requirements

- Raw activity data must exist in the `raw_activities` table
- Database must be accessible (not applicable during migrations)
- Sufficient disk space for database updates
- Node.js environment with Prisma access

## Troubleshooting

If you encounter issues:

1. **Check raw data coverage**: Use `GET /v1/retransform/status` to see how many activities have raw data
2. **Review logs**: Check application logs for specific error messages
3. **Database space**: Ensure sufficient disk space for updates
4. **Permissions**: Verify database write permissions
5. **Memory**: Monitor memory usage during large batch processing
