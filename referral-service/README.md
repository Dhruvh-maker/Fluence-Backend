# Referral Service

**Port**: 4006  
**Purpose**: Referral code generation, tracking, and reward management

## API Endpoints

### Referral Code Management

#### Get Referral Code
```http
GET /api/referral/code
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC123",
    "isNew": false,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Validate Referral Code
```http
POST /api/referral/validate
Content-Type: application/json

{
  "referralCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "referrerId": "uuid",
    "referralCode": "ABC123",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Process Referral
```http
POST /api/referral/process
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "referralCode": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rewardId": "uuid",
    "pointsAmount": 100
  },
  "message": "Referral processed successfully"
}
```

### Referral Statistics

#### Get Referral Stats
```http
GET /api/referral/stats
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 25,
    "successfulReferrals": 20,
    "totalPointsEarned": 2000,
    "totalRewards": 20,
    "awardedRewards": 18,
    "pendingRewards": 2
  }
}
```

#### Get Referral Links
```http
GET /api/referral/links?page=1&limit=20
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "links": [
      {
        "id": "uuid",
        "referralCode": "ABC123",
        "status": "completed",
        "pointsAwarded": 100,
        "createdAt": "2024-01-01T00:00:00Z",
        "completedAt": "2024-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25
    }
  }
}
```

#### Get Referral Leaderboard
```http
GET /api/referral/leaderboard?limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "referrerId": "uuid",
      "totalReferrals": 50,
      "successfulReferrals": 45,
      "totalPointsEarned": 4500
    }
  ]
}
```

### Referral Rewards

#### Get Referral Rewards
```http
GET /api/referral/rewards
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signup": 100,
    "firstPurchase": 200,
    "milestone": 500,
    "bonus": 1000
  }
}
```

#### Get Referral Campaigns
```http
GET /api/referral/campaigns
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Summer Referral Campaign",
      "description": "Earn extra points for referrals",
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z",
      "isActive": true,
      "bonusMultiplier": 1.5
    }
  ]
}
```

#### Get Referral Analytics
```http
GET /api/referral/analytics?startDate=2024-01-01&endDate=2024-01-31
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
    "analytics": {
      "totalReferrals": 15,
      "successfulReferrals": 12,
      "conversionRate": 0.8,
      "totalPointsAwarded": 1200,
      "averagePointsPerReferral": 100
    }
  }
}
```

### Referral Rewards Management

#### Get User Referral Rewards
```http
GET /api/referral/rewards/user?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rewardType": "signup",
      "pointsAmount": 100,
      "status": "awarded",
      "description": "Referral signup reward",
      "createdAt": "2024-01-01T00:00:00Z",
      "awardedAt": "2024-01-01T01:00:00Z"
    }
  ]
}
```

#### Get Referral Rewards by Type
```http
GET /api/referral/rewards/type/signup?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "referrerId": "uuid",
      "referredUserId": "uuid",
      "rewardType": "signup",
      "pointsAmount": 100,
      "status": "awarded",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Pending Referral Rewards
```http
GET /api/referral/rewards/pending?limit=100
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "referrerId": "uuid",
      "referredUserId": "uuid",
      "rewardType": "signup",
      "pointsAmount": 100,
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Update Referral Reward Status
```http
PUT /api/referral/rewards/:rewardId/status
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "awarded"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Referral reward status updated successfully",
  "data": {
    "id": "uuid",
    "status": "awarded",
    "awardedAt": "2024-01-01T00:00:00Z"
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
- `400` - Bad Request (e.g., invalid referral code)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (e.g., self-referral)
- `500` - Internal Server Error
