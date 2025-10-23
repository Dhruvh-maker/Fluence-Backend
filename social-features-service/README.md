# Social Features Service

**Port**: 4007  
**Purpose**: Social media integration and social features management

## API Endpoints

### Social Account Management

#### Get Social Accounts
```http
GET /api/social/accounts
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "platformId": "1",
      "platformName": "Facebook",
      "username": "john_doe",
      "displayName": "John Doe",
      "profilePictureUrl": "https://example.com/avatar.jpg",
      "isConnected": true,
      "lastSyncAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Connect Social Account
```http
POST /api/social/connect
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "platformId": "1",
  "platformUserId": "facebook_user_123",
  "username": "john_doe",
  "displayName": "John Doe",
  "profilePictureUrl": "https://example.com/avatar.jpg",
  "accessToken": "facebook_access_token",
  "refreshToken": "facebook_refresh_token",
  "tokenExpiresAt": "2024-02-01T00:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social account connected successfully",
  "data": {
    "id": "uuid",
    "platformId": "1",
    "username": "john_doe",
    "displayName": "John Doe",
    "isConnected": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Disconnect Social Account
```http
DELETE /api/social/disconnect/:accountId
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Social account disconnected successfully",
  "data": {
    "id": "uuid",
    "isConnected": false
  }
}
```

### Social Post Management

#### Get Social Posts
```http
GET /api/social/posts?limit=50&offset=0&status=published&postType=text
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "socialAccountId": "uuid",
      "content": "Check out this amazing product!",
      "mediaUrls": ["https://example.com/image.jpg"],
      "postType": "text",
      "status": "published",
      "likesCount": 25,
      "sharesCount": 5,
      "commentsCount": 3,
      "createdAt": "2024-01-01T00:00:00Z",
      "publishedAt": "2024-01-01T00:05:00Z"
    }
  ]
}
```

#### Create Social Post
```http
POST /api/social/posts
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "socialAccountId": "uuid",
  "content": "Check out this amazing product!",
  "mediaUrls": ["https://example.com/image.jpg"],
  "postType": "text",
  "scheduledAt": "2024-01-01T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social post created successfully",
  "data": {
    "id": "uuid",
    "content": "Check out this amazing product!",
    "postType": "text",
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Social Post
```http
PUT /api/social/posts/:postId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "content": "Updated post content",
  "mediaUrls": ["https://example.com/new-image.jpg"],
  "postType": "text",
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social post updated successfully",
  "data": {
    "id": "uuid",
    "content": "Updated post content",
    "status": "published",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Delete Social Post
```http
DELETE /api/social/posts/:postId
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Social post deleted successfully",
  "data": {
    "id": "uuid",
    "status": "deleted"
  }
}
```

### Social Analytics

#### Get Social Analytics
```http
GET /api/social/analytics?startDate=2024-01-01&endDate=2024-01-31&platformId=1
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": {
      "totalPosts": 25,
      "publishedPosts": 20,
      "draftPosts": 3,
      "scheduledPosts": 2,
      "totalLikes": 500,
      "totalShares": 100,
      "totalComments": 75
    },
    "accounts": {
      "totalAccounts": 3,
      "connectedAccounts": 2,
      "disconnectedAccounts": 1
    },
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "platformId": "1"
    }
  }
}
```

### Social Rewards

#### Get Social Rewards
```http
GET /api/social/rewards?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "rewardType": "post_engagement",
      "pointsAmount": 50,
      "description": "Reward for high engagement post",
      "status": "awarded",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Social Campaigns

#### Get Social Campaigns
```http
GET /api/social/campaigns
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Summer Social Campaign",
      "description": "Earn points for social media posts",
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z",
      "isActive": true,
      "pointsPerPost": 100,
      "bonusMultiplier": 1.5
    }
  ]
}
```

### Social Platforms

#### Get Social Platforms
```http
GET /api/social/platforms
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "facebook",
      "displayName": "Facebook",
      "isActive": true
    },
    {
      "id": "2",
      "name": "twitter",
      "displayName": "Twitter",
      "isActive": true
    },
    {
      "id": "3",
      "name": "instagram",
      "displayName": "Instagram",
      "isActive": true
    }
  ]
}
```

### Social Settings

#### Get Social Settings
```http
GET /api/social/settings
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "autoPostEnabled": false,
    "autoShareEnabled": false,
    "notificationEnabled": true,
    "privacyLevel": "public",
    "contentFilters": [],
    "preferredPlatforms": ["facebook", "twitter"]
  }
}
```

#### Update Social Settings
```http
PUT /api/social/settings
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "autoPostEnabled": true,
  "autoShareEnabled": false,
  "notificationEnabled": true,
  "privacyLevel": "friends",
  "preferredPlatforms": ["facebook", "instagram"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Social settings updated successfully",
  "data": {
    "userId": "uuid",
    "autoPostEnabled": true,
    "autoShareEnabled": false,
    "notificationEnabled": true,
    "privacyLevel": "friends",
    "preferredPlatforms": ["facebook", "instagram"],
    "updatedAt": "2024-01-01T00:00:00Z"
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
- `404` - Not Found
- `409` - Conflict (e.g., account already connected)
- `500` - Internal Server Error
