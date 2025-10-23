# Points & Wallet Service

**Port**: 4005  
**Purpose**: Points earning, redemption, and wallet management

## API Endpoints

### Wallet Management

#### Get Wallet Balance
```http
GET /api/wallet/balance
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "availableBalance": 1500,
    "pendingBalance": 200,
    "totalEarned": 2000,
    "totalRedeemed": 300,
    "totalExpired": 0,
    "lastUpdated": "2024-01-01T00:00:00Z"
  }
}
```

#### Award Points
```http
POST /api/wallet/award-points
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "amount": 100,
  "transactionType": "purchase",
  "description": "Points for purchase",
  "referenceId": "order_123",
  "socialPostRequired": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points awarded successfully",
  "data": {
    "id": "uuid",
    "amount": 100,
    "transactionType": "purchase",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Redeem Points
```http
POST /api/wallet/redeem-points
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "amount": 50,
  "description": "Points redemption",
  "referenceId": "redemption_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Points redeemed successfully",
  "data": {
    "id": "uuid",
    "amount": -50,
    "transactionType": "redemption",
    "status": "available",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Transaction History
```http
GET /api/wallet/transactions?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "amount": 100,
        "transactionType": "purchase",
        "status": "available",
        "description": "Points for purchase",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Social Media Integration

#### Submit Social Post
```http
POST /api/wallet/social-post
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "transactionId": "uuid",
  "socialPostUrl": "https://twitter.com/user/status/123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social media post submitted successfully",
  "data": {
    "id": "uuid",
    "socialPostMade": true,
    "socialPostUrl": "https://twitter.com/user/status/123456789",
    "socialPostVerified": false
  }
}
```

### Points Management

#### Get Total Points Earned
```http
GET /api/points/earned
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarned": 2000
  }
}
```

#### Get Total Points Redeemed
```http
GET /api/points/redeemed
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRedeemed": 300
  }
}
```

#### Get Expiring Points
```http
GET /api/points/expiring
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 100,
      "expiresAt": "2024-02-01T00:00:00Z",
      "description": "Points expiring soon"
    }
  ]
}
```

#### Get Points Statistics
```http
GET /api/points/statistics
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarned": 2000,
    "totalRedeemed": 300,
    "totalExpired": 0,
    "availableBalance": 1500,
    "pendingBalance": 200
  }
}
```

#### Get Daily Summary
```http
GET /api/points/daily-summary?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "summary": {
      "totalEarned": 500,
      "totalRedeemed": 100,
      "netPoints": 400
    }
  }
}
```

#### Get Time Buffer Transactions
```http
GET /api/points/time-buffer
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 100,
      "timeBufferEndsAt": "2024-01-02T00:00:00Z",
      "description": "Points in time buffer"
    }
  ]
}
```

### Social Post Verification

#### Verify Social Post
```http
POST /api/points/verify-social
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "transactionId": "uuid",
  "verified": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social media post verified successfully",
  "data": {
    "id": "uuid",
    "socialPostVerified": true
  }
}
```

#### Get Pending Social Posts
```http
GET /api/points/pending-social
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "socialPostUrl": "https://twitter.com/user/status/123456789",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Notification Settings

#### Get Notification Settings
```http
GET /api/wallet/settings
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "socialPostReminders": true,
    "pointsAvailable": true,
    "pointsExpiring": true
  }
}
```

#### Update Notification Settings
```http
PUT /api/wallet/settings
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "socialPostReminders": false,
  "pointsAvailable": true,
  "pointsExpiring": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "data": {
    "userId": "uuid",
    "socialPostReminders": false,
    "pointsAvailable": true,
    "pointsExpiring": true
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
- `400` - Bad Request (e.g., insufficient balance)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error
