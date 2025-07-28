# Lifestream API - Product Requirements Document (PRD)

## 1. Executive Summary

### 1.1 Project Overview
Lifestream API is a fitness activity tracking platform that integrates with Strava to provide comprehensive cycling analytics and reporting capabilities. The system automatically ingests activity data from Strava and presents meaningful insights through RESTful APIs, supporting applications like desktop widgets and dashboards.

### 1.2 Current State
- **Framework**: Sails.js v1.2.3 (Node.js web framework)
- **Database**: MySQL with ORM integration
- **Primary Use Case**: Strava data ingestion and cycling analytics
- **Deployment**: Self-hosted with production configuration
- **API Consumers**: Desktop widgets (uebersicht), custom dashboards

### 1.3 Business Value
- Centralized fitness data aggregation
- Automated activity tracking and analysis
- Year-over-year progress comparison
- Customizable reporting for various fitness applications
- Real-time data synchronization with Strava

## 2. Product Vision & Goals

### 2.1 Vision Statement
To provide a robust, modern, and scalable API platform for fitness data aggregation and analytics that enables developers to build compelling fitness applications and personal tracking solutions.

### 2.2 Primary Goals
1. **Data Integration**: Seamlessly ingest and synchronize fitness data from multiple sources
2. **Analytics**: Provide comprehensive reporting and trend analysis
3. **Extensibility**: Support multiple activity types beyond cycling
4. **Performance**: Deliver fast, reliable API responses
5. **Scalability**: Handle growing user base and data volume

### 2.3 Success Metrics
- API response times < 200ms for standard queries
- 99.9% uptime for data ingestion services
- Support for 10+ activity types
- Zero data loss during synchronization
- Developer-friendly API documentation

## 3. Functional Requirements

### 3.1 Core Features

#### 3.1.1 Data Ingestion
- **Strava Integration**: Automated OAuth flow and activity synchronization
- **Incremental Sync**: Fetch only new activities since last sync
- **Full Sync**: Complete historical data import on demand
- **Error Handling**: Robust retry mechanisms and error logging
- **Rate Limiting**: Respect Strava API rate limits

#### 3.1.2 Activity Management
- **Storage**: Persist activity data with full detail preservation
- **Deduplication**: Prevent duplicate activity entries
- **Updates**: Handle activity modifications and deletions
- **Categories**: Support all Strava activity types (cycling, running, swimming, etc.)

#### 3.1.3 Reporting & Analytics
- **Yearly Statistics**: Annual summaries by activity type
- **Progress Tracking**: Year-over-year comparisons
- **Trend Analysis**: Monthly/weekly progression analysis
- **Custom Metrics**: Distance, elevation, power, heart rate analytics
- **Filtering**: By date range, activity type, and custom criteria

#### 3.1.4 User Management
- **Authentication**: OAuth token management and refresh
- **Profiles**: User-specific configuration and preferences
- **Privacy**: Data access controls and sharing preferences

### 3.2 API Endpoints

#### 3.2.1 Data Ingestion
```
GET /v1/ingest/:userId?getAll=true
- Trigger activity synchronization
- Optional full historical sync
- Returns: Sync status and activity count
```

#### 3.2.2 Reporting
```
GET /v1/reports/cycling/yearly/:userId
- Annual cycling statistics
- Returns: Aggregated metrics by year

GET /v1/reports/cycling/progress/:userId
- Year-over-year progress comparison
- Returns: Current vs previous year metrics

GET /v1/activities/:userId?type=&startDate=&endDate=
- Raw activity data with filtering
- Returns: Paginated activity list

GET /v1/stats/:userId/summary
- Overall user statistics
- Returns: Lifetime totals and averages
```

#### 3.2.3 Health & Status
```
GET /health
- Service health check
- Returns: Service status and dependencies

GET /v1/sync/status/:userId
- Last sync information
- Returns: Sync timestamp and status
```

### 3.3 Data Models

#### 3.3.1 Activity
```javascript
{
  id: Number,           // Strava activity ID
  athleteId: Number,    // Strava athlete ID
  name: String,         // Activity name
  distance: Number,     // Distance in meters
  movingTime: Number,   // Moving time in seconds
  elapsedTime: Number,  // Total elapsed time
  totalElevationGain: Number, // Elevation gain in meters
  activityType: String, // Activity type (Ride, Run, etc.)
  startDate: Date,      // Activity start timestamp
  averageSpeed: Number, // Average speed in m/s
  maxSpeed: Number,     // Maximum speed in m/s
  averageWatts: Number, // Average power output
  kilojoules: Number,   // Energy expenditure
  averageHeartRate: Number, // Average HR
  maxHeartRate: Number, // Maximum HR
  sufferScore: Number,  // Strava suffer score
  gear: String,         // Equipment used
  trainer: Boolean,     // Indoor trainer activity
  commute: Boolean      // Commute flag
}
```

#### 3.3.2 User
```javascript
{
  id: Number,           // Internal user ID
  name: String,         // User identifier
  athleteId: Number,    // Strava athlete ID
  accessToken: String,  // OAuth access token
  refreshToken: String, // OAuth refresh token
  expiresAt: Number,    // Token expiration timestamp
  lastSync: Date,       // Last successful sync
  preferences: Object   // User preferences
}
```

## 4. Technical Requirements

### 4.1 Modern JavaScript Technology Stack (2025)

#### 4.1.1 Runtime & Framework
- **Node.js**: LTS version 22.x (latest stable)
- **Framework**: Express.js 5.x or Fastify 5.x
  - Express.js: Mature, extensive ecosystem, middleware support
  - Fastify: High performance, TypeScript-first (JS compatible), built-in validation
- **Alternative**: Next.js 15+ API routes for full-stack approach

#### 4.1.2 Database & ORM
- **Primary Option**: PostgreSQL 16+ with Prisma 6.x
  - Better JSON support, ACID compliance, performance
  - Prisma: Type-safe, excellent migration system, modern ORM
- **Alternative**: MongoDB 8.x with Mongoose 8.x
  - Document-based storage, flexible schema
  - Mongoose: Mature ODM with validation and middleware

#### 4.1.3 HTTP Client & External APIs
- **Primary**: Native Fetch API (Node.js 18+)
  - Built-in, no additional dependencies
  - Modern Promise-based interface
- **Alternative**: Axios 1.7.x
  - Request/response interceptors
  - Advanced configuration options

#### 4.1.4 Date & Time Handling
- **Primary**: date-fns 4.x
  - Modular, tree-shakeable
  - Immutable date objects
  - Extensive locale support
- **Alternative**: Day.js 1.11.x
  - Lightweight (2kB)
  - Moment.js compatible API

#### 4.1.5 Validation & Schema
- **Primary**: Zod 3.x
  - TypeScript-first (JS compatible)
  - Runtime validation
  - Schema inference
- **Alternative**: Joi 17.x
  - Mature validation library
  - Extensive validation rules

#### 4.1.6 Authentication & Security
- **Primary**: jsonwebtoken 9.x + bcrypt 5.x
  - Standard JWT implementation
  - Secure password hashing
- **OAuth**: @fastify/oauth2 or passport.js 0.7.x
- **Alternative**: Auth0 SDK or Clerk for managed auth

#### 4.1.7 Testing Framework
- **Primary**: Vitest 2.x
  - Fast, modern testing framework
  - Vite-powered, ESM support
  - Jest-compatible API
- **Alternative**: Jest 29.x with ESM support

#### 4.1.8 Build Tools & Development
- **Primary**: Vite 6.x
  - Fast development server
  - Optimized production builds
  - Plugin ecosystem
- **Alternative**: esbuild 0.24.x for ultra-fast builds
- **Process Manager**: PM2 5.x for production

#### 4.1.9 Documentation
- **API Docs**: OpenAPI 3.1 with Swagger UI
- **Code Docs**: JSDoc 4.x
- **Interactive Testing**: Insomnia or Postman collections

#### 4.1.10 Monitoring & Logging
- **Logging**: pino 9.x (high-performance JSON logger)
- **Monitoring**: Prometheus metrics + Grafana
- **Error Tracking**: Sentry SDK 8.x
- **Health Checks**: @fastify/health or custom middleware

### 4.2 Architecture Principles

#### 4.2.1 Code Organization
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Data models
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── config/          # Configuration files
├── routes/          # Route definitions
├── validators/      # Input validation schemas
├── migrations/      # Database migrations
└── tests/           # Test files
```

#### 4.2.2 Configuration Management
- **Environment Variables**: dotenv 16.x
- **Configuration Schema**: Environment-specific configs
- **Secrets Management**: Secure environment variable handling

#### 4.2.3 Error Handling
- **Global Error Handler**: Centralized error processing
- **Custom Error Classes**: Structured error responses
- **Logging Integration**: Error tracking and alerting

### 4.3 Performance Requirements
- **API Response Time**: < 200ms for 95th percentile
- **Database Queries**: Optimized indexing, < 100ms
- **Memory Usage**: < 512MB under normal load
- **Concurrent Users**: Support 1000+ concurrent requests
- **Data Sync**: Complete sync < 30 seconds for 1000 activities

### 4.4 Security Requirements
- **Authentication**: OAuth 2.0 + JWT tokens
- **Authorization**: Role-based access control
- **Data Encryption**: TLS 1.3 in transit, encrypted at rest
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting and DDoS protection
- **CORS**: Configurable cross-origin policies

### 4.5 Scalability & Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose or Kubernetes
- **Load Balancing**: Nginx or cloud load balancer
- **Database**: Connection pooling, read replicas
- **Caching**: Redis 7.x for session and query caching
- **CDN**: Static asset delivery optimization

## 5. Integration Requirements

### 5.1 External APIs
- **Strava API v3**: Primary data source
- **Future Integrations**: Garmin Connect, Wahoo, TrainingPeaks
- **Webhook Support**: Real-time activity notifications

### 5.2 Consumer Applications
- **REST API**: JSON responses, OpenAPI specification
- **Real-time Updates**: WebSocket or Server-Sent Events
- **Batch Operations**: Bulk data export capabilities

### 5.3 Data Export
- **Formats**: JSON, CSV, GPX
- **APIs**: RESTful endpoints for data retrieval
- **Backup**: Automated data backup and recovery

## 6. Implementation Roadmap

### 6.1 Phase 1: Foundation (Weeks 1-4)
- [ ] Modern Node.js setup with chosen framework
- [ ] Database migration from MySQL to PostgreSQL
- [ ] Core API structure and routing
- [ ] Authentication and user management
- [ ] Basic testing framework setup

### 6.2 Phase 2: Core Features (Weeks 5-8)
- [ ] Strava OAuth integration
- [ ] Activity data ingestion service
- [ ] Data validation and storage
- [ ] Error handling and logging
- [ ] API documentation

### 6.3 Phase 3: Analytics & Reporting (Weeks 9-12)
- [ ] Reporting endpoints implementation
- [ ] Data aggregation and statistics
- [ ] Performance optimization
- [ ] Caching implementation
- [ ] Comprehensive testing

### 6.4 Phase 4: Enhancement & Deployment (Weeks 13-16)
- [ ] Production deployment setup
- [ ] Monitoring and alerting
- [ ] Performance tuning
- [ ] Security hardening
- [ ] Documentation finalization

### 6.5 Phase 5: Extended Features (Future)
- [ ] Additional fitness platform integrations
- [ ] Real-time data updates
- [ ] Advanced analytics and machine learning
- [ ] Mobile app support
- [ ] Multi-tenant architecture

## 7. Dependencies & Constraints

### 7.1 External Dependencies
- **Strava API**: Rate limits, availability, API changes
- **Database**: PostgreSQL or MongoDB hosting
- **Infrastructure**: Server hosting and scaling

### 7.2 Technical Constraints
- **Node.js Ecosystem**: JavaScript-only requirement
- **Backward Compatibility**: Migration from existing system
- **Data Integrity**: Zero data loss during migration

### 7.3 Operational Constraints
- **Budget**: Open-source technologies preferred
- **Timeline**: Incremental delivery approach
- **Maintenance**: Sustainable long-term maintenance

## 8. Success Criteria

### 8.1 Technical Success
- [ ] Zero-downtime deployment capability
- [ ] 99.9% API availability
- [ ] < 200ms average response time
- [ ] Comprehensive test coverage (>90%)
- [ ] Security vulnerability free

### 8.2 Business Success
- [ ] Successful migration of existing users
- [ ] Improved developer experience
- [ ] Reduced maintenance overhead
- [ ] Enhanced feature capability
- [ ] Future-proof technology stack

## 9. Risk Assessment

### 9.1 Technical Risks
- **Database Migration**: Data integrity during transition
- **API Compatibility**: Breaking changes for existing consumers
- **Performance**: Maintaining response times during migration

### 9.2 Mitigation Strategies
- **Gradual Migration**: Phased rollout approach
- **Comprehensive Testing**: Automated testing at all levels
- **Monitoring**: Real-time performance monitoring
- **Rollback Plan**: Quick rollback capabilities

## 10. Conclusion

This PRD outlines the modernization of Lifestream API using cutting-edge JavaScript technologies suitable for 2025. The proposed stack emphasizes performance, developer experience, and long-term maintainability while preserving the core functionality that makes the system valuable.

The modern technology choices provide:
- **Better Performance**: Native fetch, optimized frameworks
- **Enhanced Security**: Modern authentication and validation
- **Improved DX**: Better tooling and development experience
- **Future-Proof**: Latest LTS versions and active ecosystems
- **Scalability**: Architecture ready for growth

By following this PRD, the Lifestream API will evolve into a robust, modern platform capable of serving the fitness tracking needs of users and developers for years to come.