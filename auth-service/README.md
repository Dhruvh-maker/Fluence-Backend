# Auth Service

**Port**: 4001  
**Purpose**: User authentication and session management

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

#### Social Login
```http
POST /api/auth/social-login
Content-Type: application/json

{
  "idToken": "firebase_id_token",
  "referralCode": "ABC123" // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here",
  "needsProfileCompletion": false,
  "referralProcessed": true
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "token": "new_jwt_token_here"
}
```

### Password Management

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Password reset email sent"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successfully"
}
```

#### Change Password
```http
POST /api/auth/change-password
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Email Verification

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification_token"
}
```

**Response:**
```json
{
  "message": "Email verified successfully"
}
```

### Profile Management

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "John Smith",
  "email": "johnsmith@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Smith",
    "email": "johnsmith@example.com"
  },
  "token": "new_jwt_token_here"
}
```

#### Complete Profile
```http
POST /api/auth/complete-profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "jwt_token_here"
}
```

### Account Management

#### Update Account Status
```http
PUT /api/auth/account-status
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "paused"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "status": "paused"
  }
}
```

## Health Check

#### Service Health
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0"
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error
