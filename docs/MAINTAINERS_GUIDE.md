# Lifestream API Maintainers Guide

Welcome to the Lifestream API codebase! This guide links all essential documentation and provides a high-level overview for maintainers.

## Project Structure
- `src/` — Main API code (services, routes, utils, middleware)
- `prisma/` — Database schema and migrations
- `tests/` — Unit and integration tests
- `docs/` — Documentation
- `scripts/` — Operational scripts

## Documentation Index
- [API Reference](./API_REFERENCE.md)
- [Data Model](./DATA_MODEL.md)
- [Operations Guide](./OPERATIONS.md)
- [Testing Guide](./TESTING.md)
- [Changelog](../CHANGELOG.md)

## Key Conventions
- ES modules only
- Zod for input validation
- Prisma for DB access
- Custom logger for all important operations
- All times in Pacific Time (UTC-8)
- Unit conversions: meters→miles, meters→feet, m/s→mph, Celsius→Fahrenheit

## Getting Started
See [Operations Guide](./OPERATIONS.md) for setup, Strava integration, and monitoring.

---

For questions, see the linked docs or contact the project owner.
