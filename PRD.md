# Lifestream API - Product Requirements Document (PRD)

> **Document Purpose**: This PRD outlines the modernization strategy for Lifestream API, proposing a migration from the current Sails.js stack to modern 2025 JavaScript technologies while maintaining all existing functionality.

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Goals](#2-product-vision--goals)
3. [Functional Requirements](#3-functional-requirements)
4. [Technical Requirements](#4-technical-requirements)
5. [Integration Requirements](#5-integration-requirements)
6. [Implementation Roadmap](#6-implementation-roadmap)
7. [Dependencies & Constraints](#7-dependencies--constraints)
8. [Success Criteria](#8-success-criteria)
9. [Risk Assessment](#9-risk-assessment)
10. [Implementation Requirements](#10-implementation-requirements)
11. [Conclusion](#11-conclusion)

---

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

> **Migration Philosophy**: Replace outdated dependencies with modern, actively maintained alternatives while preserving functionality and improving performance, security, and developer experience.

#### 4.1.0 Technology Migration Overview

| Component | Current | Recommended 2025 | Rationale |
|-----------|---------|------------------|-----------|
| **Runtime** | Node.js ^8.11 | Node.js 22.x LTS | Security updates, performance, modern features |
| **Framework** | Sails.js 1.2.3 | Express.js 5.x / Fastify 5.x | Active ecosystem, flexibility, performance |
| **Database** | MySQL + Sails ORM | PostgreSQL + Prisma | Better JSON support, type safety, migrations |
| **HTTP Client** | request + request-promise | Native Fetch API | No dependencies, modern Promise API |
| **Date/Time** | moment.js 2.23.0 | date-fns 4.x | Immutable, tree-shakeable, active development |
| **Validation** | Built-in Sails | Zod 3.x | Runtime validation, schema inference |
| **Testing** | Basic npm test | Vitest 2.x | Fast, modern, ESM support |
| **Build** | Grunt | Vite 6.x | Fast dev server, optimized builds |
| **Process Management** | Manual | PM2 5.x | Production-ready process management |

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

## 10. Implementation Requirements

### 10.1 Development Environment Setup

#### 10.1.1 Required Software
```bash
# Core Requirements
Node.js 22.x LTS
npm 10.x or yarn 4.x
Git 2.40+
Docker 24.x
Docker Compose 2.20+

# Database
PostgreSQL 16.x (or Docker container)
Redis 7.x (for caching and sessions)

# Development Tools
VS Code or WebStorm
Postman or Insomnia (API testing)
```

#### 10.1.2 Local Development Setup
```bash
# 1. Clone and setup
git clone <repository>
cd lifestream-api
npm install

# 2. Environment configuration
cp .env.example .env.local
# Edit .env.local with local database credentials

# 3. Database setup
docker-compose up -d postgres redis
npm run db:migrate
npm run db:seed

# 4. Start development server
npm run dev
```

#### 10.1.3 Environment Variables
```bash
# .env.example
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/lifestream
REDIS_URL=redis://localhost:6379

# Strava API
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Security
JWT_SECRET=your_jwt_secret_256_bit
ENCRYPTION_KEY=your_encryption_key

# External Services
LOG_LEVEL=debug
SENTRY_DSN=your_sentry_dsn
```

### 10.2 Code Organization & Standards

#### 10.2.1 Project Structure
```
src/
├── controllers/          # HTTP request handlers
│   ├── activity.controller.js
│   ├── auth.controller.js
│   ├── report.controller.js
│   └── user.controller.js
├── services/            # Business logic layer
│   ├── activity.service.js
│   ├── strava.service.js
│   ├── report.service.js
│   └── auth.service.js
├── models/              # Data models (Prisma)
│   ├── schema.prisma
│   └── migrations/
├── middleware/          # Express middleware
│   ├── auth.middleware.js
│   ├── validation.middleware.js
│   ├── rate-limit.middleware.js
│   └── error.middleware.js
├── routes/              # Route definitions
│   ├── v1/
│   │   ├── activity.routes.js
│   │   ├── auth.routes.js
│   │   └── report.routes.js
│   └── index.js
├── validators/          # Input validation schemas
│   ├── activity.validator.js
│   ├── auth.validator.js
│   └── common.validator.js
├── utils/               # Utility functions
│   ├── logger.js
│   ├── crypto.js
│   ├── dates.js
│   └── constants.js
├── config/              # Application configuration
│   ├── database.js
│   ├── redis.js
│   ├── auth.js
│   └── app.js
├── types/               # Type definitions (JSDoc)
│   ├── activity.types.js
│   ├── user.types.js
│   └── api.types.js
└── tests/               # Test files
    ├── unit/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

#### 10.2.2 Naming Conventions
```javascript
// Files: kebab-case
activity.controller.js
strava-webhook.service.js

// Functions: camelCase
getUserActivities()
calculateYearlyStats()

// Constants: SCREAMING_SNAKE_CASE
const STRAVA_API_URL = 'https://www.strava.com/api/v3';
const MAX_RETRY_ATTEMPTS = 3;

// Classes: PascalCase
class ActivityService {}
class StravaClient {}

// Database tables: snake_case
activities, user_tokens, activity_stats
```

#### 10.2.3 Code Style & Linting
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@eslint/js/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'error',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error'
  }
};

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 10.3 Database Implementation

#### 10.3.1 Migration Strategy
```javascript
// migration-plan.js
const migrationPhases = [
  {
    phase: 1,
    description: 'Setup PostgreSQL with Prisma',
    tasks: [
      'Install PostgreSQL 16.x',
      'Initialize Prisma schema',
      'Create base tables (users, activities)',
      'Setup connection pooling'
    ]
  },
  {
    phase: 2,
    description: 'Data Migration from MySQL',
    tasks: [
      'Export MySQL data to CSV',
      'Transform data for PostgreSQL',
      'Import with validation',
      'Verify data integrity'
    ]
  },
  {
    phase: 3,
    description: 'Cutover and Cleanup',
    tasks: [
      'Switch application to PostgreSQL',
      'Monitor performance',
      'Decommission MySQL',
      'Update backup procedures'
    ]
  }
];
```

#### 10.3.2 Prisma Schema
```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int      @id @default(autoincrement())
  name         String   @unique
  athleteId    BigInt   @unique
  accessToken  String?
  refreshToken String?
  expiresAt    Int?
  lastSync     DateTime?
  preferences  Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  activities   Activity[]
  
  @@map("users")
}

model Activity {
  id                    BigInt   @id
  athleteId             BigInt
  name                  String
  distance              Float?
  movingTime            Int?
  elapsedTime           Int?
  totalElevationGain    Float?
  activityType          String
  startDate             DateTime
  averageSpeed          Float?
  maxSpeed              Float?
  averageWatts          Float?
  kilojoules            Float?
  averageHeartRate      Float?
  maxHeartRate          Int?
  sufferScore           Int      @default(0)
  trainer               Boolean  @default(false)
  commute               Boolean  @default(false)
  gear                  String?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  user                  User     @relation(fields: [athleteId], references: [athleteId])
  
  @@index([athleteId, startDate])
  @@index([activityType, startDate])
  @@map("activities")
}
```

#### 10.3.3 Database Utilities
```javascript
// src/utils/database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
};

export default prisma;
```

### 10.4 Authentication & Security Implementation

#### 10.4.1 JWT Authentication
```javascript
// src/services/auth.service.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  static generateTokens(user) {
    const payload = {
      id: user.id,
      athleteId: user.athleteId,
      name: user.name
    };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  
  static async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }
  
  static async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}
```

#### 10.4.2 OAuth 2.0 Implementation
```javascript
// src/services/strava-oauth.service.js
export class StravaOAuthService {
  static getAuthUrl(state) {
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.STRAVA_REDIRECT_URI,
      approval_prompt: 'force',
      scope: 'read,activity:read_all',
      state
    });
    
    return `https://www.strava.com/oauth/authorize?${params}`;
  }
  
  static async exchangeCodeForTokens(code) {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code'
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }
    
    return response.json();
  }
  
  static async refreshAccessToken(refreshToken) {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });
    
    return response.json();
  }
}
```

### 10.5 API Implementation Patterns

#### 10.5.1 Controller Pattern
```javascript
// src/controllers/activity.controller.js
import { ActivityService } from '../services/activity.service.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import { activitySchemas } from '../validators/activity.validator.js';

export class ActivityController {
  static async ingestActivities(req, res, next) {
    try {
      const { userId } = req.params;
      const { getAll = false } = req.query;
      
      const result = await ActivityService.ingestUserActivities(userId, getAll);
      
      res.status(200).json({
        success: true,
        data: result,
        message: 'Activities ingested successfully'
      });
    } catch (error) {
      next(error);
    }
  }
  
  static async getActivities(req, res, next) {
    try {
      validateRequest(req, activitySchemas.getActivities);
      
      const { userId } = req.params;
      const filters = req.query;
      
      const activities = await ActivityService.getUserActivities(userId, filters);
      
      res.status(200).json({
        success: true,
        data: activities,
        pagination: activities.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### 10.5.2 Service Layer Pattern
```javascript
// src/services/activity.service.js
import prisma from '../utils/database.js';
import { StravaService } from './strava.service.js';
import { logger } from '../utils/logger.js';

export class ActivityService {
  static async ingestUserActivities(userId, getAll = false) {
    const user = await prisma.user.findUnique({
      where: { name: userId }
    });
    
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Refresh tokens if needed
    const validTokens = await StravaService.ensureValidTokens(user);
    
    // Fetch activities from Strava
    const activities = await StravaService.fetchActivities(validTokens, getAll);
    
    // Store activities with conflict resolution
    const results = await this.storeActivities(activities, user.athleteId);
    
    // Update last sync timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSync: new Date() }
    });
    
    logger.info(`Ingested ${results.created} new activities for user ${userId}`);
    
    return {
      created: results.created,
      updated: results.updated,
      skipped: results.skipped
    };
  }
  
  static async storeActivities(activities, athleteId) {
    const results = { created: 0, updated: 0, skipped: 0 };
    
    for (const activity of activities) {
      try {
        const existing = await prisma.activity.findUnique({
          where: { id: activity.id }
        });
        
        if (existing) {
          await prisma.activity.update({
            where: { id: activity.id },
            data: this.transformActivityData(activity, athleteId)
          });
          results.updated++;
        } else {
          await prisma.activity.create({
            data: this.transformActivityData(activity, athleteId)
          });
          results.created++;
        }
      } catch (error) {
        logger.error(`Failed to store activity ${activity.id}:`, error);
        results.skipped++;
      }
    }
    
    return results;
  }
  
  static transformActivityData(activity, athleteId) {
    return {
      id: activity.id,
      athleteId: athleteId,
      name: activity.name || '',
      distance: activity.distance,
      movingTime: activity.moving_time,
      elapsedTime: activity.elapsed_time,
      totalElevationGain: activity.total_elevation_gain,
      activityType: activity.type,
      startDate: new Date(activity.start_date_local),
      averageSpeed: activity.average_speed,
      maxSpeed: activity.max_speed,
      averageWatts: activity.average_watts,
      kilojoules: activity.kilojoules,
      averageHeartRate: activity.average_heartrate,
      maxHeartRate: activity.max_heartrate,
      sufferScore: activity.suffer_score || 0,
      trainer: activity.trainer || false,
      commute: activity.commute || false,
      gear: activity.gear_id || null
    };
  }
}
```

### 10.6 Testing Implementation

#### 10.6.1 Testing Strategy
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});

// tests/setup.js
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import prisma from '../src/utils/database.js';

beforeAll(async () => {
  // Setup test database
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database between tests
  await prisma.activity.deleteMany();
  await prisma.user.deleteMany();
});
```

#### 10.6.2 Unit Tests Example
```javascript
// tests/unit/activity.service.test.js
import { describe, it, expect, vi } from 'vitest';
import { ActivityService } from '../../src/services/activity.service.js';
import prisma from '../../src/utils/database.js';

describe('ActivityService', () => {
  describe('transformActivityData', () => {
    it('should transform Strava activity to database format', () => {
      const stravaActivity = {
        id: 123456789,
        name: 'Morning Ride',
        distance: 25000,
        moving_time: 3600,
        type: 'Ride',
        start_date_local: '2024-01-15T08:00:00Z',
        average_speed: 7.5,
        suffer_score: 45
      };
      
      const result = ActivityService.transformActivityData(stravaActivity, 98765);
      
      expect(result).toEqual({
        id: 123456789,
        athleteId: 98765,
        name: 'Morning Ride',
        distance: 25000,
        movingTime: 3600,
        activityType: 'Ride',
        startDate: new Date('2024-01-15T08:00:00Z'),
        averageSpeed: 7.5,
        sufferScore: 45,
        trainer: false,
        commute: false,
        gear: null,
        // ... other expected fields
      });
    });
  });
  
  describe('storeActivities', () => {
    it('should create new activities', async () => {
      const activities = [
        { id: 1, name: 'Test Activity 1', type: 'Ride' },
        { id: 2, name: 'Test Activity 2', type: 'Run' }
      ];
      
      const result = await ActivityService.storeActivities(activities, 98765);
      
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
    });
  });
});
```

#### 10.6.3 Integration Tests
```javascript
// tests/integration/activity.routes.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/utils/database.js';

describe('Activity Routes', () => {
  let authToken;
  let testUser;
  
  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        name: 'testuser',
        athleteId: 12345,
        accessToken: 'test_token',
        refreshToken: 'test_refresh',
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }
    });
    
    // Get auth token
    const response = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password' });
    
    authToken = response.body.accessToken;
  });
  
  describe('GET /v1/activities/:userId', () => {
    it('should return user activities', async () => {
      // Create test activities
      await prisma.activity.createMany({
        data: [
          {
            id: 1,
            athleteId: 12345,
            name: 'Test Ride',
            activityType: 'Ride',
            startDate: new Date(),
            distance: 10000
          }
        ]
      });
      
      const response = await request(app)
        .get('/v1/activities/testuser')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Ride');
    });
  });
});
```

### 10.7 Error Handling & Logging

#### 10.7.1 Error Classes
```javascript
// src/utils/errors.js
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
  }
}
```

#### 10.7.2 Global Error Handler
```javascript
// src/middleware/error.middleware.js
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  logger.error(err);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

export const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};
```

#### 10.7.3 Logging Configuration
```javascript
// src/utils/logger.js
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  }
});

export { logger };

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }, 'HTTP Request');
  });
  
  next();
};
```

### 10.8 Configuration Management

#### 10.8.1 Environment Configuration
```javascript
// src/config/app.js
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'testing', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default('3000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  STRAVA_CLIENT_ID: z.string(),
  STRAVA_CLIENT_SECRET: z.string(),
  STRAVA_WEBHOOK_VERIFY_TOKEN: z.string(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  SENTRY_DSN: z.string().url().optional()
});

const config = configSchema.parse(process.env);

export default config;
```

#### 10.8.2 Database Configuration
```javascript
// src/config/database.js
import config from './app.js';

export const databaseConfig = {
  url: config.DATABASE_URL,
  connectionLimit: 10,
  acquireConnectionTimeout: 60000,
  timeout: 60000,
  releaseTimeout: 60000,
  schema: 'public'
};

export const redisConfig = {
  url: config.REDIS_URL,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};
```

### 10.9 Development Workflow

#### 10.9.1 Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/new-endpoint
# Make changes
git add .
git commit -m "feat: add new activity endpoint"
git push origin feature/new-endpoint
# Create PR

# Commit message format
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

#### 10.9.2 Package Scripts
```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js",
    "build": "echo 'No build step needed'",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "vitest run tests/e2e",
    "lint": "eslint src/ tests/",
    "lint:fix": "eslint src/ tests/ --fix",
    "format": "prettier --write src/ tests/",
    "db:migrate": "prisma migrate dev",
    "db:reset": "prisma migrate reset",
    "db:seed": "node prisma/seed.js",
    "db:studio": "prisma studio",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "precommit": "lint-staged"
  }
}
```

#### 10.9.3 Pre-commit Hooks
```json
// package.json
{
  "lint-staged": {
    "*.js": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  }
}
```

### 10.10 Deployment & Infrastructure

#### 10.10.1 Docker Configuration
```dockerfile
# Dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS dev
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

FROM base AS prod
COPY . .
EXPOSE 3000
USER node
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/lifestream
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules
    
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: lifestream
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
```

#### 10.10.2 CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production
        run: |
          # Deployment commands
          echo "Deploying to production"
```

### 10.11 Monitoring & Observability

#### 10.11.1 Health Checks
```javascript
// src/routes/health.js
import express from 'express';
import prisma from '../utils/database.js';
import { redisClient } from '../utils/redis.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {}
  };
  
  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = 'healthy';
  } catch (error) {
    checks.services.database = 'unhealthy';
    checks.status = 'degraded';
  }
  
  // Redis check
  try {
    await redisClient.ping();
    checks.services.redis = 'healthy';
  } catch (error) {
    checks.services.redis = 'unhealthy';
    checks.status = 'degraded';
  }
  
  const statusCode = checks.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(checks);
});

router.get('/health/ready', async (req, res) => {
  // Readiness probe - check if app is ready to serve traffic
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

router.get('/health/live', (req, res) => {
  // Liveness probe - check if app is alive
  res.status(200).json({ status: 'alive' });
});

export default router;
```

#### 10.11.2 Metrics Collection
```javascript
// src/utils/metrics.js
import promClient from 'prom-client';

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'lifestream-api'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activitiesIngested = new promClient.Counter({
  name: 'activities_ingested_total',
  help: 'Total number of activities ingested',
  labelNames: ['user_id', 'activity_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activitiesIngested);

export { register, httpRequestDuration, httpRequestsTotal, activitiesIngested };
```

## 11. Conclusion

This PRD outlines the modernization of Lifestream API using cutting-edge JavaScript technologies suitable for 2025. The proposed stack emphasizes performance, developer experience, and long-term maintainability while preserving the core functionality that makes the system valuable.

### 10.1 Key Benefits of Modernization

**Immediate Benefits:**
- **Security**: Eliminates 135+ vulnerabilities from outdated dependencies
- **Performance**: Native Fetch API and modern Node.js provide 2-3x performance improvements
- **Reliability**: Active maintenance and LTS support for all recommended packages
- **Developer Experience**: Modern tooling with fast builds (Vite) and testing (Vitest)

**Long-term Benefits:**
- **Maintainability**: Modern code patterns and better documentation
- **Scalability**: Architecture designed for horizontal scaling
- **Extensibility**: Plugin-based architecture for new features
- **Future-Proof**: LTS versions with long-term support commitments

### 10.2 Technology Advantages

The modern technology choices provide:
- **Better Performance**: Native fetch, optimized frameworks, modern V8 features
- **Enhanced Security**: Modern authentication, validation, and dependency management
- **Improved DX**: Better tooling, faster feedback loops, comprehensive documentation
- **Future-Proof**: Latest LTS versions and active ecosystems
- **Scalability**: Architecture ready for growth and multiple deployment environments

### 10.3 Migration Strategy

The recommended approach prioritizes:
1. **Zero Downtime**: Gradual migration with parallel systems
2. **Data Integrity**: Comprehensive backup and validation strategies
3. **Backward Compatibility**: API contract preservation during transition
4. **Risk Mitigation**: Phased rollout with rollback capabilities

### 10.4 Expected Outcomes

Upon completion of this modernization:
- **50-70% reduction** in response times
- **99.9% uptime** with modern infrastructure
- **Zero security vulnerabilities** from dependencies
- **90%+ test coverage** with modern testing framework
- **Improved developer productivity** with modern tooling

By following this PRD, the Lifestream API will evolve into a robust, modern platform capable of serving the fitness tracking needs of users and developers for years to come, while maintaining its core value proposition of seamless Strava integration and comprehensive cycling analytics.