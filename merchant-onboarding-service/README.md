# Merchant Onboarding Service

**Port**: 4002  
**Purpose**: Merchant application and profile management

## API Endpoints

### Merchant Applications

#### Submit Merchant Application
```http
POST /api/merchant/applications
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "businessName": "ABC Store",
  "businessType": "retail",
  "businessDescription": "A retail store selling electronics",
  "businessAddress": "123 Main St, City, State 12345",
  "businessPhone": "+1234567890",
  "businessEmail": "contact@abcstore.com",
  "businessWebsite": "https://abcstore.com",
  "taxId": "12-3456789",
  "businessLicense": "BL123456",
  "bankAccountNumber": "1234567890",
  "routingNumber": "123456789",
  "documents": [
    {
      "type": "business_license",
      "url": "https://example.com/license.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant application submitted successfully",
  "data": {
    "id": "uuid",
    "businessName": "ABC Store",
    "status": "pending",
    "submittedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Merchant Applications
```http
GET /api/merchant/applications?status=pending&limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "businessName": "ABC Store",
      "businessType": "retail",
      "status": "pending",
      "submittedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 25
  }
}
```

#### Get Merchant Application by ID
```http
GET /api/merchant/applications/:applicationId
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "ABC Store",
    "businessType": "retail",
    "businessDescription": "A retail store selling electronics",
    "businessAddress": "123 Main St, City, State 12345",
    "businessPhone": "+1234567890",
    "businessEmail": "contact@abcstore.com",
    "businessWebsite": "https://abcstore.com",
    "taxId": "12-3456789",
    "businessLicense": "BL123456",
    "status": "pending",
    "submittedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Admin Management

#### Review Merchant Application
```http
PUT /api/admin/applications/:applicationId/review
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Application approved after verification",
  "reviewedBy": "admin_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant application reviewed successfully",
  "data": {
    "id": "uuid",
    "status": "approved",
    "adminNotes": "Application approved after verification",
    "reviewedAt": "2024-01-01T00:00:00Z",
    "reviewedBy": "admin_user_id"
  }
}
```

#### Get Pending Applications
```http
GET /api/admin/applications/pending?limit=50&offset=0
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "businessName": "ABC Store",
      "businessType": "retail",
      "status": "pending",
      "submittedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Merchant Profiles

#### Get Merchant Profile
```http
GET /api/merchant/profile
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "businessName": "ABC Store",
    "businessType": "retail",
    "businessDescription": "A retail store selling electronics",
    "businessAddress": "123 Main St, City, State 12345",
    "businessPhone": "+1234567890",
    "businessEmail": "contact@abcstore.com",
    "businessWebsite": "https://abcstore.com",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update Merchant Profile
```http
PUT /api/merchant/profile
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "businessName": "ABC Electronics Store",
  "businessDescription": "An electronics store selling the latest gadgets",
  "businessPhone": "+1234567891",
  "businessEmail": "info@abcelectronics.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Merchant profile updated successfully",
  "data": {
    "id": "uuid",
    "businessName": "ABC Electronics Store",
    "businessDescription": "An electronics store selling the latest gadgets",
    "businessPhone": "+1234567891",
    "businessEmail": "info@abcelectronics.com",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Document Management

#### Upload Document
```http
POST /api/merchant/documents
Authorization: Bearer jwt_token_here
Content-Type: multipart/form-data

{
  "type": "business_license",
  "file": "document.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid",
    "type": "business_license",
    "url": "https://example.com/documents/uuid.pdf",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Documents
```http
GET /api/merchant/documents
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "business_license",
      "url": "https://example.com/documents/uuid.pdf",
      "uploadedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Delete Document
```http
DELETE /api/merchant/documents/:documentId
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

### Application Status

#### Get Application Status
```http
GET /api/merchant/application-status
Authorization: Bearer jwt_token_here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "pending",
    "submittedAt": "2024-01-01T00:00:00Z",
    "reviewedAt": null,
    "adminNotes": null
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
- `403` - Forbidden (admin access required)
- `404` - Not Found
- `409` - Conflict (application already exists)
- `500` - Internal Server Error
