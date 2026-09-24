# Authentication & Session Architecture

## 1. Authentication Mechanism

- **Password Hashing**: Salted bcrypt hashing (10 rounds).
- **Tokens**:
  - Short-lived Access Token (JWT, 15m expiration, signed with `JWT_ACCESS_SECRET`).
  - Refresh Token (JWT, 7d expiration, stored in secure httpOnly cookie with rotation upon refresh).
- **Login Rate Limiting**: `express-rate-limit` prevents brute-force attempts.
- **CSRF & Security Headers**: Helmet middleware, strict CORS origin whitelisting, and sanitized outputs (password hashes are omitted from all DTO responses).
