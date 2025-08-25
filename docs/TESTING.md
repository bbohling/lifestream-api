# Lifestream API Testing Guide

## Test Types
- Unit tests for all utility and service functions
- Integration tests for API endpoints
- Edge case and error scenario tests

## Running Tests
- Run all tests: `npm test`
- Test coverage: `npm run coverage`

## Mocking
- Strava API and DB are mocked in tests

## Coverage
- Target: 90%+
- Check `tests/` for coverage reports

## Adding Tests
- Place new tests in `tests/`
- Use Vitest for all test files
- Mock external dependencies

---
See [MAINTAINERS_GUIDE.md](./MAINTAINERS_GUIDE.md) for project conventions.
