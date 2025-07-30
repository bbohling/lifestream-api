<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Lifestream API Copilot Instructions

## Project Overview

This is a modern Node.js API for Strava fitness activity tracking and cycling analytics. The API integrates with Strava's OAuth 2.0 system to sync cycling activities and generate comprehensive reports.

## Tech Stack

- **Runtime**: Node.js 22.x with ES modules
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Prisma 6.x ORM
- **Validation**: Zod for schema validation
- **Testing**: Vitest for unit and integration tests
- **HTTP Client**: Native Fetch API (no external libraries)
- **Date/Time**: date-fns for date operations
- **Logging**: Custom logger utility

## Code Style Guidelines

- Use ES modules (import/export) exclusively
- Follow the existing Prettier configuration
- Use meaningful variable names and JSDoc comments
- Prefer async/await over Promises
- Use Zod schemas for all input validation
- Log important operations with the custom logger

## API Patterns

- All endpoints must preserve exact compatibility with the original API
- Use proper HTTP status codes (400 for bad requests, 404 for not found, 500 for server errors)
- Return `{ msg: "success" }` for successful operations
- Return `{ error: "Error message" }` for errors
- Handle Strava token expiration automatically with refresh logic

## Database Patterns

- Use Prisma for all database operations
- Use upsert operations for activity data (update if exists, create if not)
- Include proper indexes for performance (athleteId, startDate, activityType)
- Use BigInt for Strava IDs (they exceed JavaScript's number precision)

## Unit Conversions (Must Use Exact Formulas)

- Distance: meters to miles = `meters / 1609.34`
- Elevation: meters to feet = `meters / 0.3048`
- Speed: m/s to mph = `mps * 25 / 11`
- Temperature: Celsius to Fahrenheit = `celsius * 9 / 5 + 32`

## Date/Time Handling

- Always use Pacific Time (UTC-8) for calculations
- Use date-fns for date operations
- Calculate day-of-year for progress comparisons
- Remove 'Z' suffix from Strava date strings before storage

## Strava Integration

- Check token expiration before API calls
- Automatically refresh expired tokens
- Handle rate limits (100 requests per 15 minutes, 1000 per day)
- Use concurrency control (max 5 simultaneous operations)
- Map all Strava activity fields to database schema

## Error Handling

- Use try/catch blocks in all async functions
- Log errors with context (user, operation, error details)
- Return user-friendly error messages
- Don't expose internal error details in production

## Testing

- Write unit tests for all utility functions
- Mock external dependencies (Strava API, database)
- Test error scenarios and edge cases
- Maintain high code coverage (90%+)

## Security

- Validate all inputs with Zod schemas
- Use rate limiting for API endpoints
- Implement CORS and security headers
- Never log sensitive data (tokens, passwords)
