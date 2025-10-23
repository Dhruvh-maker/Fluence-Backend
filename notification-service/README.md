# Notification Service

**Port**: 4004  
**Purpose**: Notification management and delivery

## API Endpoints

### Notification Management

#### Get Notifications
```http
GET /api/notifications?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "points_available",
        "title": "Points Available!",
        "message": "You've earned 100 points: Purchase reward",
        "data": {
          "pointsAmount": 100,
          "description": "Purchase reward"
        },
        "readAt": null,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCount": 5,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

#### Get Notifications by Type
```http
GET /api/notifications/type/points_available?limit=20
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "points_available",
      "title": "Points Available!",
      "message": "You've earned 100 points: Purchase reward",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Get Notifications by Date Range
```http
GET /api/notifications/date-range?startDate=2024-01-01&endDate=2024-01-31&limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "points_available",
      "title": "Points Available!",
      "message": "You've earned 100 points: Purchase reward",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "count": 25
  }
}
```

### Notification Actions

#### Mark Notification as Read
```http
PUT /api/notifications/:notificationId/read
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "uuid",
    "readAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Mark All Notifications as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "5 notifications marked as read",
  "data": {
    "count": 5
  }
}
```

#### Delete Notification
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "id": "uuid"
  }
}
```

### Notification Statistics

#### Get Notification Stats
```http
GET /api/notifications/stats
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalNotifications": 100,
    "unreadNotifications": 5,
    "readNotifications": 95,
    "socialReminders": 20,
    "pointsNotifications": 50,
    "expirationNotifications": 10
  }
}
```

### Notification Settings

#### Get Notification Settings
```http
GET /api/notifications/settings
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
    "pointsExpiring": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Notification Settings
```http
PUT /api/notifications/settings
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
    "pointsExpiring": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

## Notification Types

The service supports the following notification types:

- **`social_post_reminder`**: Reminders to post on social media
- **`points_available`**: Notifications when points are earned
- **`points_expiring`**: Warnings when points are about to expire

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
- `500` - Internal Server Error
