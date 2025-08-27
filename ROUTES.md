# KhabarSpot API Routes

Base URL

- Local: http://localhost:5050
- All endpoints are prefixed with /api/v1
- Authenticated endpoints require: Authorization: Bearer <accessToken>

Authentication

- POST /api/v1/auth/register

  - Body:
    {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123!"
    }

- POST /api/v1/auth/register-admin

  - Body:
    {
    "name": "Site Admin",
    "email": "admin@example.com",
    "password": "Admin123!"
    }

- POST /api/v1/auth/login
  - Body:
    {
    "email": "john@example.com",
    "password": "Password123!"
    }

Categories

- GET /api/v1/categories

  - Public. No body

- POST /api/v1/categories

  - Admin only
  - Body:
    {
    "name": "Snacks",
    "slug": "snacks" // optional; auto-generated from name if omitted
    }

- PATCH /api/v1/categories/:id

  - Admin only
  - Body (any subset):
    {
    "name": "Sweet Snacks",
    "slug": "sweet-snacks"
    }

- DELETE /api/v1/categories/:id
  - Admin only; no body

Posts

- POST /api/v1/posts

  - Auth required
  - Body:
    {
    "title": "Best Fuchka at Dhanmondi",
    "description": "Crispy fuchka with tangy tamarind water.",
    "location": "Dhanmondi Lake Road",
    "imageUrl": "https://example.com/fuchka.jpg",
    "categoryId": "<category-uuid>",
    "priceMin": 50, // optional
    "priceMax": 120 // optional
    }

- GET /api/v1/posts

  - Auth required
  - Query parameters (all optional):
    - q: string (search within title/description)
    - categoryId: uuid
    - categorySlug: string
    - minPrice: number (as string)
    - maxPrice: number (as string)
    - onlyPremium: "1" | "true" to show only premium posts (user must be premium)
    - sortBy: "new" | "popular" | "rating" | "price" (default: new)
    - order: "asc" | "desc" (default: desc)
    - page: number (default: 1)
    - limit: number (default: 10, max: 50)

- GET /api/v1/posts/:id

  - Auth required; respects premium access
  - No body

- PATCH /api/v1/posts/:id/approve

  - Admin only
  - Body:
    {
    "isPremium": true // optional; defaults to current value (false if unset)
    }

- PATCH /api/v1/posts/:id/reject
  - Admin only
  - Body:
    {
    "reason": "Not enough details provided"
    }

Votes (nested under a post)

- POST /api/v1/posts/:postId/votes/upvote

  - Auth required; no body

- POST /api/v1/posts/:postId/votes/downvote

  - Auth required; no body

- POST /api/v1/posts/:postId/votes/unvote
  - Auth required; no body

Comments (nested under a post)

- POST /api/v1/posts/:postId/comments

  - Auth required
  - Body:
    {
    "content": "Really tasty and fresh!",
    "rating": 5 // integer 1-5
    }

- GET /api/v1/posts/:postId/comments

  - Public; no body

- DELETE /api/v1/posts/:postId/comments/:commentId
  - Admin only; no body

Payments

- POST /api/v1/payments/checkout

  - Auth required
  - Body:
    {
    "provider": "STRIPE" // STRIPE | MOCK (SSLCOMMERZ/SHURJOPAY not implemented yet)
    }
  - Response (provider=STRIPE):
    {
    "checkoutUrl": "https://checkout.stripe.com/c/session_id..."
    }
  - For MOCK, subscription is activated immediately.

- GET /api/v1/subscriptions/status

  - Auth required; no body

- POST /api/v1/payments/stripe/webhook
  - Public (Stripe calls this). Sends Stripe signatures.
  - No body you send directly; Stripe sends the payload. Configure your webhook in Stripe to this URL.
  - Note: This endpoint uses raw body for signature verification.
  - Auth required; no body
