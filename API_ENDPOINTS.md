# API Endpoints - HSC Admin Portal

Base URL: `http://localhost:5000`

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user. Returns accessToken, refreshToken, user. |
| POST | `/api/auth/login` | No | Login. Returns accessToken, refreshToken, user. If 2FA enabled: { requiresTwoFactor, tempToken }. |
| POST | `/api/auth/logout` | No | Invalidate refresh token, clear cookie. |
| POST | `/api/auth/refresh-token` | Cookie | Issue new access token. Uses httpOnly refreshToken cookie. |
| POST | `/api/auth/forgot-password` | No | Send password reset email. |
| POST | `/api/auth/reset-password/:token` | No | Reset password with token from email. |
| POST | `/api/auth/change-password` | JWT | Change password (requires current password). |
| GET | `/api/auth/verify-email/:token` | No | Verify email address. |
| POST | `/api/auth/resend-verification` | No | Resend verification email. Body: { email }. |
| POST | `/api/auth/2fa/setup` | JWT | Generate TOTP secret and QR code URL. |
| POST | `/api/auth/2fa/verify-setup` | JWT | Verify TOTP code and enable 2FA. Returns backup codes. |
| POST | `/api/auth/2fa/validate` | No | Validate TOTP during login. Body: { tempToken, totpCode }. |
| POST | `/api/auth/2fa/disable` | JWT | Disable 2FA. Body: { password }. |
| GET | `/api/auth/google` | No | Redirect to Google OAuth. |
| GET | `/api/auth/google/callback` | No | Google OAuth callback. |

## Admin Login (backward compatible)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | No | Admin login. Body: { username, password }. Returns { token, user } or { requiresTwoFactor, tempToken }. Admin role only. |

## Users (admin only except profile)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users` | JWT (admin) | List users (paginated). Query: page, limit. |
| GET | `/api/users/:id` | JWT (admin) | Get user by ID. |
| PUT | `/api/users/:id` | JWT (admin) | Update user. |
| DELETE | `/api/users/:id` | JWT (admin) | Soft delete user. |
| POST | `/api/users/:id/toggle-status` | JWT (admin) | Toggle user active status. |
| GET | `/api/users/profile` | JWT | Get own profile. |
| PUT | `/api/users/profile` | JWT | Update own profile. |

## Public

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/employees/:id` | No | Get employee card (public). |
| POST | `/api/analytics/track` | No | Track card view. Body: { employeeId, source }. |

## Protected (JWT required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/upload` | Upload avatar. |
| GET | `/api/employees` | List employees. |
| GET | `/api/employees/:id` | Get employee. |
| POST | `/api/employees` | Create employee. |
| PUT | `/api/employees/:id` | Update employee. |
| DELETE | `/api/employees/:id` | Delete employee. |
| PATCH | `/api/employees/:id/toggle` | Toggle employee active. |
| GET | `/api/analytics/summary` | Analytics summary. |

## Response Format

Success: `{ success: true, ...data }` or direct data for some endpoints.
Error: `{ success: false, message: string }` or `{ message: string }`.

## Auth Headers

`Authorization: Bearer <accessToken>`
