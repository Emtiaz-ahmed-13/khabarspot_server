# KhabarSpot API (Server)

A production-ready REST API for KhabarSpot — a Bangladesh-first content platform built with Express.js, TypeScript, PostgreSQL, and Prisma. It provides user authentication, role-based access control, premium content subscriptions, admin moderation, rich post discovery (search, filters, price range), comments with ratings, and vote-based popularity.

<p align="center">
  <img src="docs/screenshots/overview.png" alt="KhabarSpot API overview" width="720"/>
</p>

## Highlights (Unique Features)

- Premium content gating with subscriptions
  - Seamless premium gating for both single-post reads and list results
  - Support for multiple providers (Stripe integration + a local MOCK provider)
  - Token-claim refresh model: subscription -> re-login -> access premium
- Admin moderation workflow for content
  - Post lifecycle: PENDING → APPROVED/REJECTED with rejectReason
  - Admin-only approval/rejection endpoints (with option to mark posts as premium)
- Popularity and rating-driven discovery
  - sortBy=new|popular|rating|price + order=asc|desc
  - Aggregated vote score and average rating (computed via Prisma groupBy) for lists
  - Text search (q) on title/description, categorySlug and price range filters
- Clean modular architecture with nested resources
  - Posts → nested Comments and Votes routes
  - Strict input validation with Zod, JWT auth, and role-based route guards
- Stripe ready (webhook-first design)
  - Stripe Checkout session creation (when environment variables are set)
  - Webhook route declared before body parsing to verify signatures safely

## Core Capabilities

- Authentication & Authorization
  - Register, Login, Register Admin
  - JWT access/refresh tokens, role enforcement (ADMIN/USER)
- Categories
  - Public list, Admin create/update/delete with unique slug handling
- Posts
  - Create post (auth, enters PENDING)
  - Get post (auth; premium gated)
  - List posts with search, filters, sorting, and premium gating awareness
  - Admin approve/reject (with rejectReason on REJECTED)
- Comments & Ratings (nested under a post)
  - Add comment with rating (1–5) to approved posts
  - List comments, Admin delete comment
- Votes (nested under a post)
  - Upvote, Downvote, Unvote — only allowed on approved posts
- Subscriptions
  - Checkout (MOCK or STRIPE), Status check, user premium flag
- Payments
  - Generic checkout route (MOCK or STRIPE)

## Screenshots

Add real images at the paths below to render them in GitHub:

- docs/screenshots/overview.png — Architecture/Module overview
- docs/screenshots/prisma-studio.png — Browsing data in Prisma Studio
- docs/screenshots/api-auth.png — Auth flow in Postman/Insomnia
- docs/screenshots/posts-list.png — Posts listing with filters shown
- docs/screenshots/premium-gating.png — Premium access (403 vs 200) example
- docs/screenshots/moderation.png — Admin approval/rejection flow

```
server/
└── docs/
    └── screenshots/
        ├── overview.png
        ├── prisma-studio.png
        ├── api-auth.png
        ├── posts-list.png
        ├── premium-gating.png
        └── moderation.png
```

## API Overview

Base URL (local): http://localhost:5000/api/v1

- Auth: /auth
  - POST /register
  - POST /register-admin
  - POST /login
- Categories: /categories
  - GET /
  - POST / (ADMIN)
  - PATCH /:id (ADMIN)
  - DELETE /:id (ADMIN)
- Posts: /posts
  - POST / (auth)
  - GET / (auth)
    - Query: q, categoryId, categorySlug, minPrice, maxPrice, onlyPremium, sortBy=new|popular|rating|price, order=asc|desc, page, limit
  - GET /:id (auth; premium gated)
  - PATCH /:id/approve (ADMIN)
  - PATCH /:id/reject (ADMIN)
  - Nested:
    - Comments: POST /:postId/comments (auth), GET /:postId/comments, DELETE /:postId/comments/:commentId (ADMIN)
    - Votes: POST /:postId/votes/upvote|downvote|unvote (auth)
- Subscriptions: /subscriptions
  - POST /checkout (auth; provider=MOCK|STRIPE)
  - GET /status (auth)
- Payments: /payments
  - POST /checkout (auth; provider=MOCK|STRIPE)
- Stripe Webhook
  - POST /payments/stripe/webhook (raw body; configure secrets first)

## Data Model (Prisma)

- User: id, name, email, password, role (ADMIN|USER), isPremium
- Category: id, name, slug
- Post: id, title, description, location, imageUrl, priceMin, priceMax, status (PENDING|APPROVED|REJECTED), isPremium, rejectReason, authorId, categoryId
- Comment: id, content, rating (1–5), userId, postId
- Vote: id, value (-1|1), userId, postId
- Subscription: id, userId, provider (MOCK|SSLCOMMERZ|SHURJOPAY|STRIPE), status (PENDING|SUCCEEDED|FAILED)

## Getting Started

Prerequisites
- Node.js 18+
- PostgreSQL 13+ (local or cloud)

Environment Variables (.env)

```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public

# JWT
JWT_SECRET=replace_me
JWT_EXPIRES_IN=7d
JWT_REFRESH_TOKEN_SECRET=replace_me
JWT_REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe (optional for STRIPE flows)
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_SUCCESS_URL=http://localhost:3000/success
STRIPE_CANCEL_URL=http://localhost:3000/cancel
STRIPE_WEBHOOK_SECRET=
```

Install and run

```sh
npm install
npx prisma migrate deploy
npm run dev
```

Verify server

```sh
curl -s http://localhost:5000/ | jq
# { "Message": "Backend is running successfully 🏃🏻‍♂️‍➡️" }
```

Open Prisma Studio (browse data visually)

```sh
npx prisma studio
# Opens http://localhost:5555
```

## Example Flows (cURL)

Admin setup

```sh
# Register admin
curl -s -X POST http://localhost:5000/api/v1/auth/register-admin \
  -H 'Content-Type: application/json' \
  -d '{"name":"Emtiaz Ahmed","email":"emtiaz.ahmed@khabarspot.bd","password":"ea12345"}' | jq

# Login admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"emtiaz.ahmed@khabarspot.bd","password":"ea12345"}' | jq -r '.data.accessToken')
```

Categories

```sh
# Create a category (ADMIN)
curl -s -X POST http://localhost:5000/api/v1/categories \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"name":"Dhaka City","slug":"dhaka-city"}' | jq

# List categories
curl -s http://localhost:5000/api/v1/categories | jq
```

Posts, comments, votes

```sh
# Create a post (auth)
POST_ID=$(curl -s -X POST http://localhost:5000/api/v1/posts \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title":"Best Fuchka Spots in Dhanmondi",
    "description":"A curated list of the tastiest fuchka stalls across Dhanmondi.",
    "location":"Dhanmondi, Dhaka, Bangladesh",
    "imageUrl":"https://example.com/images/fuchka.jpg",
    "categoryId":"<dhaka-city-id>",
    "priceMin":50,
    "priceMax":120
  }' | jq -r '.data.id')

# Approve it (ADMIN)
curl -s -X PATCH http://localhost:5000/api/v1/posts/$POST_ID/approve \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"isPremium":false}' | jq

# Comment + rating
curl -s -X POST http://localhost:5000/api/v1/posts/$POST_ID/comments \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"content":"Asthar fuchka is a must-try!","rating":5}' | jq

# Votes
curl -s -X POST http://localhost:5000/api/v1/posts/$POST_ID/votes/upvote \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

Premium subscription flow (MOCK provider)

```sh
# Register & login as a normal user
curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Rahim Uddin","email":"rahim.uddin@khabarspot.bd","password":"bdUser123"}' | jq
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"rahim.uddin@khabarspot.bd","password":"bdUser123"}' | jq -r '.data.accessToken')

# Approve a premium post (ADMIN)
curl -s -X PATCH http://localhost:5000/api/v1/posts/<premium-post-id>/approve \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"isPremium":true}' | jq

# Try to read premium post as non-premium user (will be gated)
curl -s -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:5000/api/v1/posts/<premium-post-id> | jq

# Activate subscription (MOCK)
curl -s -X POST http://localhost:5000/api/v1/subscriptions/checkout \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"provider":"MOCK"}' | jq

# Re-login to refresh token claims
USER_TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"rahim.uddin@khabarspot.bd","password":"bdUser123"}' | jq -r '.data.accessToken')

# Now the premium post is accessible
curl -s -H "Authorization: Bearer $USER_TOKEN" \
  http://localhost:5000/api/v1/posts/<premium-post-id> | jq
```

## Stripe Setup (optional)

- Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_SUCCESS_URL, STRIPE_CANCEL_URL, STRIPE_WEBHOOK_SECRET in .env
- Webhook endpoint: POST /api/v1/payments/stripe/webhook
  - Note: The webhook route is registered with raw body parsing; keep it before generic JSON parsers.

## Project Structure

```
src/
  ├── app/
  │   ├── errors/
  │   ├── middleware/
  │   ├── modules/
  │   ├── routes/
  │   └── shared/
  ├── config/
  ├── helpers/
  ├── app.ts
  └── server.ts
```

## Tech Stack

- Express.js + TypeScript
- PostgreSQL + Prisma ORM
- Zod validation, JSON Web Tokens (JWT)
- Stripe SDK (optional), CORS, cookie-parser

## Notes

- The API includes a centralized error handler and custom ApiError class. You may tailor status codes and response format as needed.
- For production, ensure strong JWT secrets, hardened CORS, and HTTPS termination.

## License

MIT
