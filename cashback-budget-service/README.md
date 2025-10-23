# Cashback Budget Service

**Port**: 4003  
**Purpose**: Cashback campaigns and budget management

## API Endpoints

### Budget Management

#### Create Budget
```http
POST /api/budget
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "merchantId": "uuid",
  "budgetAmount": 10000,
  "budgetPeriod": "monthly",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z",
  "description": "Monthly cashback budget"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Budget created successfully",
  "data": {
    "id": "uuid",
    "merchantId": "uuid",
    "budgetAmount": 10000,
    "budgetPeriod": "monthly",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Budgets
```http
GET /api/budget?merchantId=uuid&status=active&limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "merchantId": "uuid",
      "budgetAmount": 10000,
      "budgetPeriod": "monthly",
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-01-31T23:59:59Z",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

#### Update Budget
```http
PUT /api/budget/:budgetId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "budgetAmount": 15000,
  "description": "Updated monthly cashback budget"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Budget updated successfully",
  "data": {
    "id": "uuid",
    "budgetAmount": 15000,
    "description": "Updated monthly cashback budget",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Campaign Management

#### Create Campaign
```http
POST /api/campaigns
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "merchantId": "uuid",
  "budgetId": "uuid",
  "name": "Summer Sale Campaign",
  "description": "20% cashback on all purchases",
  "cashbackRate": 0.20,
  "minPurchaseAmount": 50,
  "maxCashbackAmount": 100,
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign created successfully",
  "data": {
    "id": "uuid",
    "merchantId": "uuid",
    "budgetId": "uuid",
    "name": "Summer Sale Campaign",
    "description": "20% cashback on all purchases",
    "cashbackRate": 0.20,
    "minPurchaseAmount": 50,
    "maxCashbackAmount": 100,
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Campaigns
```http
GET /api/campaigns?merchantId=uuid&isActive=true&limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "merchantId": "uuid",
      "budgetId": "uuid",
      "name": "Summer Sale Campaign",
      "description": "20% cashback on all purchases",
      "cashbackRate": 0.20,
      "minPurchaseAmount": 50,
      "maxCashbackAmount": 100,
      "startDate": "2024-06-01T00:00:00Z",
      "endDate": "2024-08-31T23:59:59Z",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

#### Update Campaign
```http
PUT /api/campaigns/:campaignId
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "name": "Updated Summer Sale Campaign",
  "cashbackRate": 0.25,
  "maxCashbackAmount": 150
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Summer Sale Campaign",
    "cashbackRate": 0.25,
    "maxCashbackAmount": 150,
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Transaction Management

#### Process Cashback Transaction
```http
POST /api/transactions
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "userId": "uuid",
  "merchantId": "uuid",
  "campaignId": "uuid",
  "purchaseAmount": 100,
  "transactionId": "txn_123456",
  "description": "Purchase at ABC Store"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cashback transaction processed successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "merchantId": "uuid",
    "campaignId": "uuid",
    "purchaseAmount": 100,
    "cashbackAmount": 20,
    "transactionId": "txn_123456",
    "status": "pending",
    "processedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Transactions
```http
GET /api/transactions?merchantId=uuid&status=pending&limit=50&offset=0
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
      "merchantId": "uuid",
      "campaignId": "uuid",
      "purchaseAmount": 100,
      "cashbackAmount": 20,
      "transactionId": "txn_123456",
      "status": "pending",
      "processedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

#### Update Transaction Status
```http
PUT /api/transactions/:transactionId/status
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Transaction approved after verification"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction status updated successfully",
  "data": {
    "id": "uuid",
    "status": "approved",
    "adminNotes": "Transaction approved after verification",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Dispute Management

#### Create Dispute
```http
POST /api/disputes
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "transactionId": "uuid",
  "disputeType": "cashback_not_received",
  "description": "Cashback was not credited to my account",
  "evidence": ["receipt.pdf", "screenshot.jpg"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute created successfully",
  "data": {
    "id": "uuid",
    "transactionId": "uuid",
    "disputeType": "cashback_not_received",
    "description": "Cashback was not credited to my account",
    "status": "open",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Disputes
```http
GET /api/disputes?status=open&limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "transactionId": "uuid",
      "disputeType": "cashback_not_received",
      "description": "Cashback was not credited to my account",
      "status": "open",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

#### Resolve Dispute
```http
PUT /api/disputes/:disputeId/resolve
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "resolved",
  "resolution": "Cashback credited to user account",
  "adminNotes": "Issue resolved by crediting missing cashback"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Dispute resolved successfully",
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": "Cashback credited to user account",
    "adminNotes": "Issue resolved by crediting missing cashback",
    "resolvedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Analytics and Reporting

#### Get Budget Analytics
```http
GET /api/analytics/budget/:budgetId?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "budgetId": "uuid",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "analytics": {
      "totalBudget": 10000,
      "usedBudget": 7500,
      "remainingBudget": 2500,
      "totalTransactions": 150,
      "totalCashbackPaid": 7500,
      "averageCashbackPerTransaction": 50
    }
  }
}
```

#### Get Campaign Performance
```http
GET /api/analytics/campaign/:campaignId?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "campaignId": "uuid",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "performance": {
      "totalTransactions": 100,
      "totalCashbackPaid": 2000,
      "averageCashbackRate": 0.20,
      "conversionRate": 0.15,
      "roi": 2.5
    }
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
