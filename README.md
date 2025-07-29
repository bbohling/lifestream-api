# Lifestream API

A [Sails v1](https://sailsjs.com) application. Currently just an app that ingests Strava data and provides an API to support stuff like [uebersicht](https://github.com/felixhageloh/uebersicht)).

## 📋 Product Requirements Document

**📄 [View the complete PRD](./PRD.md)** - Comprehensive modernization plan with 2025 JavaScript tech stack recommendations.

The PRD includes:
- Complete functional requirements based on existing features
- Modern JavaScript technology stack recommendations (Node.js 22+, Express/Fastify, PostgreSQL/Prisma, etc.)
- Migration strategy from current Sails.js implementation
- Security improvements and performance optimizations
- 16-week implementation roadmap

## 🤖 AI Modernization Prompt

**📄 [AI Prompt File](./AI_PROMPT.md)** - Concise, AI-ready specification for auto-generating a modernized solution.

This 1,358-word prompt contains:
- ✅ **All critical API endpoints** with exact request/response formats
- ✅ **Complete Strava integration** requirements (OAuth, data sync, token management)
- ✅ **Comprehensive data models** (25+ Activity fields, User model)
- ✅ **Essential calculations** (unit conversions, Pacific timezone, aggregations)
- ✅ **Modern tech stack** recommendations (Node.js 22, Express/Fastify, PostgreSQL/Prisma)
- ✅ **Security & performance** requirements (JWT, < 200ms responses, vulnerability fixes)
- ✅ **Real API examples** for validation

**Usage**: Copy the entire `AI_PROMPT.md` file content and paste it into any AI tool (Claude, ChatGPT, etc.) to generate a modern replacement that preserves all functionality while eliminating 140+ security vulnerabilities from the current outdated stack.

## API

* `/v1/ingest/:userId[?getAll=true]`
* `/v1/activities`
---

## Links

+ [Sails framework documentation](https://sailsjs.com/get-started)
+ [Version notes / upgrading](https://sailsjs.com/documentation/upgrading)
+ [Deployment tips](https://sailsjs.com/documentation/concepts/deployment)
+ [Community support options](https://sailsjs.com/support)
+ [Professional / enterprise options](https://sailsjs.com/enterprise)


## Version info

This app was originally generated on Fri Dec 28 2018 08:21:20 GMT-0800 (PST) using Sails v1.1.0.

## TODO

- [x] Partial vs. Full ingestion
- [ ] Cycling Progress
- [x] Ingest all activities (not just cycling)
- [ ] Error handling
- [ ] Proper logging
- [ ] Web page with basic reports

<!-- Internally, Sails used [`sails-generate@1.16.4`](https://github.com/balderdashy/sails-generate/tree/v1.16.4/lib/core-generators/new). -->



<!--
Note:  Generators are usually run using the globally-installed `sails` CLI (command-line interface).  This CLI version is _environment-specific_ rather than app-specific, thus over time, as a project's dependencies are upgraded or the project is worked on by different developers on different computers using different versions of Node.js, the Sails dependency in its package.json file may differ from the globally-installed Sails CLI release it was originally generated with.  (Be sure to always check out the relevant [upgrading guides](https://sailsjs.com/upgrading) before upgrading the version of Sails used by your app.  If you're stuck, [get help here](https://sailsjs.com/support).)
-->

