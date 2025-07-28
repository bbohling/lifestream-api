# How to Use the AI Prompt

## Quick Start

1. **Copy the entire content** of [`AI_PROMPT.md`](./AI_PROMPT.md)
2. **Paste into any AI tool** (Claude, ChatGPT, Gemini, etc.)
3. **Add this instruction**: "Implement this complete solution using the modern tech stack specified"

## What the AI Prompt Contains

### ✅ Complete Functional Requirements
- All current API endpoints with exact behavior
- Strava OAuth integration workflow
- Data synchronization patterns (incremental vs full)
- Complex cycling analytics calculations

### ✅ Technical Specifications
- Modern technology stack (Node.js 22, Express/Fastify, PostgreSQL/Prisma)
- Database schemas with all 25+ activity fields
- Unit conversion formulas (meters↔miles, meters↔feet, etc.)
- Pacific timezone handling

### ✅ Implementation Guidance
- Project structure recommendations
- Error handling patterns
- Performance requirements (< 200ms response times)
- Security considerations (JWT, OAuth 2.0)

### ✅ Validation Examples
- Complete API request/response examples
- Expected data transformations
- Test scenarios and edge cases

## Expected AI Output

The AI should generate:

1. **Complete Node.js application** with modern dependencies
2. **Database migrations** for PostgreSQL/Prisma
3. **API controllers** for all 3 endpoints
4. **Strava service** with OAuth token management
5. **Report services** with calculations
6. **Tests** for critical functionality
7. **Configuration** and environment setup
8. **Documentation** for deployment

## Verification Steps

After AI generates the solution:

1. **Test API endpoints** match exact response formats
2. **Verify calculations** produce same results as current system
3. **Check security** - no vulnerabilities from dependencies
4. **Validate performance** - responses under 200ms
5. **Ensure compatibility** - existing clients work unchanged

## Benefits of Using This Prompt

- **🔥 Eliminates 140+ security vulnerabilities** from outdated packages
- **⚡ Modern performance** with Node.js 22 and native Fetch API
- **🛡️ Enhanced security** with JWT authentication and input validation
- **🧪 Comprehensive testing** with Vitest and high coverage
- **📈 Better maintainability** with TypeScript-compatible modern code
- **🚀 Production-ready** with Docker, CI/CD, and monitoring

## Customization Options

You can modify the prompt to:
- Choose different frameworks (Express vs Fastify)
- Select alternative ORMs (Prisma vs TypeORM)
- Add new features or endpoints
- Modify performance requirements
- Include additional integrations

---

**⚠️ Important**: The AI prompt preserves 100% backward compatibility - all existing API consumers will continue working without changes while benefiting from improved security and performance.