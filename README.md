# LinkedOut — Backend API

REST API server for the LinkedOut job application tracker. Handles auth, data persistence, and Gmail OAuth token management.

## Tech Stack

- **Node.js** (ES modules)
- **Express 4** — HTTP server + routing
- **Mongoose 8** — MongoDB ODM
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT auth
- **express-rate-limit** — API rate limiting
- **dotenv** — environment config

## Getting Started

```bash
npm install
npm run dev        # starts with --watch (auto-restart on changes)
npm start          # production start
```

Create a `.env` file in the project root:

```
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
PORT=4000
```

> **Security:** Never commit `.env` — it contains database credentials and secrets.

## Project Structure

```
linkedout-backend/
├── server.js             # Express app entry — middleware, routes, DB connection
├── models/               # Mongoose schemas
│   ├── Application.js        # Job applications
│   ├── Contact.js            # Recruiter/hiring manager contacts
│   ├── Email.js              # Tracked emails (with body)
│   ├── EmailTemplate.js      # Cold email templates
│   ├── Note.js               # Per-application notes
│   ├── ProcessedEmail.js     # Gmail message IDs already processed (skip/track)
│   ├── ProfileField.js       # Quick Apply answer bank fields
│   ├── Resume.js             # Resume metadata
│   └── User.js               # User accounts (email + hashed password)
├── routes/
│   ├── auth.js               # POST /register, /login — JWT issuance
│   ├── crud.js               # Generic CRUD router factory
│   └── gmail.js              # Gmail OAuth — connect, disconnect, token refresh
└── .env                  # (not committed) MongoDB URI + JWT secret
```

## API Overview

### Authentication

All routes except `/api/auth/*` require a JWT in the `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |

### Generic CRUD Routes

The `crud.js` router factory generates standard REST endpoints for each model. All CRUD routes are scoped to the authenticated user (`userId` filter).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/<resource>` | List all (for current user) |
| POST | `/api/<resource>` | Create one |
| PUT | `/api/<resource>/:id` | Update by ID |
| DELETE | `/api/<resource>/:id` | Delete by ID |

Resources using the generic CRUD router:

| Endpoint | Model |
|----------|-------|
| `/api/applications` | Application |
| `/api/contacts` | Contact |
| `/api/emails` | Email |
| `/api/emailtemplates` | EmailTemplate |
| `/api/notes` | Note |
| `/api/processedemails` | ProcessedEmail |
| `/api/profilefields` | ProfileField |
| `/api/resumes` | Resume |

### Gmail OAuth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gmail/connect` | Exchange auth code for tokens, store refresh token |
| POST | `/api/gmail/disconnect` | Remove stored refresh token |
| GET | `/api/gmail/token` | Get fresh access token using stored refresh token |

## Data Flow

1. Client authenticates via `/api/auth/login` → receives JWT
2. Client uses JWT for all subsequent API calls
3. Each Zustand store syncs with its CRUD endpoint (IndexedDB as offline cache)
4. Gmail OAuth tokens are stored server-side per user; only short-lived access tokens are sent to the client
5. Processed email IDs are persisted in MongoDB so tracking state is cross-browser

## MongoDB Indexes

Key indexes for performance:
- All models: `{ userId: 1 }` — user scoping
- ProcessedEmail: `{ id: 1, userId: 1 }` unique, `{ userId: 1, gmailId: 1 }` unique
- ProfileField: `{ userId: 1, fieldKey: 1 }` unique
