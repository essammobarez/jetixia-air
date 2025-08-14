# Jetixia Air

A Node.js/TypeScript backend application for air booking and supplier management.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## 📝 Commit Rules

We follow a structured commit message format to maintain clear project history and enable automated changelog generation.

### Commit Message Format

```
<type>: [<scope1>, <scope2>] - <description> [<ticket>]

[optional body]

[optional footer]
```

### Types

#### 🎯 **Feature** - New functionality

- **Format**: `feat: [<scope1>, <scope2>] - <description> [FEATURE]`
- **Examples**:
  - `feat: [auth, middleware] - add JWT authentication system [AUTH-001]`
  - `feat: [booking, api] - implement flight search API [BOOK-123]`
  - `feat: [supplier, integration] - add new supplier integration [SUP-456]`

#### 🐛 **Bug Fix** - Bug fixes and patches

- **Format**: `fix: [<scope1>, <scope2>] - <description> [BUG]`
- **Examples**:
  - `fix: [auth, token] - resolve token expiration issue [BUG-001]`
  - `fix: [api, middleware] - fix rate limiting middleware [BUG-002]`
  - `fix: [database, connection] - resolve connection timeout [BUG-003]`

#### 🔧 **Chore** - Maintenance tasks

- **Format**: `chore: [<scope1>, <scope2>] - <description> [CHORE]`
- **Examples**:
  - `chore: [deps, security] - update dependencies to latest versions [CHORE-001]`
  - `chore: [config, env] - update environment configuration [CHORE-002]`
  - `chore: [ci, workflow] - update GitHub Actions workflow [CHORE-003]`

#### 📚 **Documentation** - Documentation updates

- **Format**: `docs: [<scope1>, <scope2>] - <description> [DOCS]`
- **Examples**:
  - `docs: [api, swagger] - update API documentation [DOCS-001]`
  - `docs: [readme, deployment] - add deployment instructions [DOCS-002]`
  - `docs: [code, comments] - add inline code comments [DOCS-003]`

#### 🎨 **Style** - Code style changes

- **Format**: `style: [<scope1>, <scope2>] - <description> [STYLE]`
- **Examples**:
  - `style: [code, formatting] - format code according to prettier [STYLE-001]`
  - `style: [ui, components] - update button styling [STYLE-002]`
  - `style: [lint, rules] - fix ESLint warnings [STYLE-003]`

#### ♻️ **Refactor** - Code refactoring

- **Format**: `refactor: [<scope1>, <scope2>] - <description> [REFACTOR]`
- **Examples**:
  - `refactor: [auth, middleware] - restructure authentication middleware [REFACTOR-001]`
  - `refactor: [api, database] - optimize database queries [REFACTOR-002]`
  - `refactor: [utils, helpers] - improve error handling functions [REFACTOR-003]`

#### ⚡ **Performance** - Performance improvements

- **Format**: `perf: [<scope1>, <scope2>] - <description> [PERF]`
- **Examples**:
  - `perf: [api, database] - optimize database connection pooling [PERF-001]`
  - `perf: [cache, redis] - implement Redis caching [PERF-002]`
  - `perf: [query, indexes] - add database indexes [PERF-003]`

#### 🧪 **Test** - Adding or updating tests

- **Format**: `test: [<scope1>, <scope2>] - <description> [TEST]`
- **Examples**:
  - `test: [auth, helpers] - add unit tests for JWT helpers [TEST-001]`
  - `test: [api, integration] - add integration tests for booking API [TEST-002]`
  - `test: [middleware, handlers] - add tests for error handlers [TEST-003]`

#### 🚀 **Init** - Initial project setup

- **Format**: `init: [<scope1>, <scope2>] - <description> [INIT]`
- **Examples**:
  - `init: [project, setup] - initialize the codebase [INIT-001]`
  - `init: [config, basic] - setup basic configuration [INIT-002]`
  - `init: [structure, folders] - create project folder structure [INIT-003]`

#### 🔥 **Breaking** - Breaking changes

- **Format**: `breaking: [<scope1>, <scope2>] - <description> [BREAKING]`
- **Examples**:
  - `breaking: [api, endpoints] - change authentication endpoint structure [BREAKING-001]`
  - `breaking: [schema, database] - update database schema [BREAKING-002]`
  - `breaking: [config, env] - change environment variable names [BREAKING-003]`

### Scopes

Common scopes for this project:

- `auth` - Authentication and authorization
- `api` - API endpoints and routes
- `booking` - Flight booking functionality
- `supplier` - Supplier integrations
- `database` - Database operations
- `middleware` - Express middleware
- `config` - Configuration files
- `deps` - Dependencies
- `ci` - Continuous Integration
- `docs` - Documentation

### Examples of Good Commit Messages

```
feat: [auth, middleware] - implement JWT token refresh [AUTH-001]
fix: [api, rate-limit] - resolve rate limiting issue [BUG-001]
docs: [readme, guidelines] - add commit rules and guidelines [DOCS-001]
refactor: [middleware, error] - optimize error handling [REFACTOR-001]
test: [booking, search] - add unit tests for search function [TEST-001]
chore: [deps, express] - update Express to v4.18.2 [CHORE-001]
init: [project, typescript] - setup TypeScript configuration [INIT-001]
```

### Examples of Bad Commit Messages

```
❌ "fixed bug"
❌ "updated code"
❌ "added feature"
❌ "WIP"
❌ "quick fix"
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── builder/          # Query builders
│   ├── config/           # Configuration files
│   ├── errors/           # Error handling
│   ├── helpers/          # Utility functions
│   ├── interface/        # TypeScript interfaces
│   ├── middlewares/      # Express middlewares
│   ├── modules/          # Feature modules
│   ├── routes/           # API routes
│   └── shared/           # Shared utilities
├── app.ts                # Express app configuration
└── server.ts             # Server entry point
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 📋 Contributing

1. Follow the commit rules above
2. Create feature branches from `main`
3. Ensure all tests pass
4. Update documentation as needed
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
