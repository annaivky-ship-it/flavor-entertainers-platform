# API Endpoints Documentation

Complete reference for all 32 backend API endpoints.

## Base URL

```
Production: https://booking-system-lrkd.vercel.app/api
Local: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT token:

```bash
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

---

## Authentication Endpoints

### 1. POST /api/auth/signup
Register a new user account.

**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "displayName": "John Doe",
  "role": "client",
  "agreeToTerms": true
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CLIENT",
      "firstName": "John Doe"
    }
  }
}
```

### 2. POST /api/auth/login
Log in existing user.

**Auth Required**: No

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

### 3. GET /api/me
Get current user profile.

**Auth Required**: Yes

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CLIENT",
    "firstName": "John",
    "lastName": "Doe",
    "performer": null
  }
}
```

---

## Services & Performers

### 4. GET /api/services
List all active services.

**Auth Required**: No

**Query Params**:
- `category` (optional): Filter by category

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Premium Massage",
      "description": "...",
      "category": "MASSAGE",
      "basePrice": 150,
      "duration": 60,
      "isActive": true
    }
  ]
}
```

### 5. GET /api/performers
List performers with filters.

**Auth Required**: No

**Query Params**:
- `page` (default: 1)
- `limit` (default: 10)
- `category` (optional)
- `isVerified` (optional)
- `availabilityStatus` (optional)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6. GET /api/performers/[id]
Get performer details.

**Auth Required**: No

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "stageName": "Luna",
    "bio": "...",
    "profileImageUrl": "...",
    "galleryImages": [ ... ],
    "availabilityStatus": "AVAILABLE",
    "isVerified": true,
    "rating": 4.8,
    "services": [ ... ]
  }
}
```

### 7. GET /api/performers/[id]/availability
Get performer availability.

**Auth Required**: No

**Query Params**:
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-15",
      "startTime": "18:00",
      "endTime": "23:00",
      "isAvailable": true
    }
  ]
}
```

### 8. POST /api/me/availability/toggle
Toggle performer availability status.

**Auth Required**: Yes (Performer only)

**Request Body**:
```json
{
  "status": "AVAILABLE"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "availabilityStatus": "AVAILABLE"
  }
}
```

### 9. POST /api/me/availability/blocks
Create availability time blocks.

**Auth Required**: Yes (Performer only)

**Request Body**:
```json
{
  "date": "2025-01-15",
  "startTime": "18:00",
  "endTime": "23:00",
  "isRecurring": false
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2025-01-15T00:00:00Z",
    "startTime": "18:00",
    "endTime": "23:00"
  }
}
```

---

## Bookings

### 10. POST /api/bookings
Create new booking.

**Auth Required**: Yes (Client)

**Request Body**:
```json
{
  "performerId": "uuid",
  "serviceId": "uuid",
  "scheduledDate": "2025-01-20",
  "scheduledTime": "19:00",
  "duration": 120,
  "location": "123 Main St, Sydney NSW",
  "specialRequests": "..."
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingRef": "BK-ABC123",
    "status": "PENDING_DEPOSIT",
    "totalAmount": 300,
    "depositAmount": 150,
    "scheduledDate": "2025-01-20",
    "scheduledTime": "19:00"
  }
}
```

### 11. GET /api/bookings
List user's bookings.

**Auth Required**: Yes

**Query Params**:
- `status` (optional)
- `page`, `limit`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": { ... }
  }
}
```

### 12. GET /api/bookings/[id]
Get booking details.

**Auth Required**: Yes (Owner or Admin)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingRef": "BK-ABC123",
    "status": "APPROVED",
    "client": { ... },
    "performer": { ... },
    "service": { ... },
    "paymentTransaction": { ... }
  }
}
```

### 13. POST /api/bookings/[id]/admin-approve
Admin approve booking.

**Auth Required**: Yes (Admin only)

**Request Body**:
```json
{
  "approved": true,
  "notes": "Approved"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "APPROVED",
    "approvedByAdminAt": "2025-01-10T12:00:00Z"
  }
}
```

### 14. POST /api/bookings/[id]/performer-respond
Performer accept/reject booking.

**Auth Required**: Yes (Performer)

**Request Body**:
```json
{
  "action": "accept",
  "notes": "Looking forward to it!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "confirmedByPerformerAt": "2025-01-10T14:00:00Z"
  }
}
```

---

## Payments

### 15. GET /api/payments/config
Get PayID payment configuration.

**Auth Required**: Yes

**Response** (200):
```json
{
  "success": true,
  "data": {
    "payidAlias": "annaivky@gmail.com",
    "accountName": "Flavor Entertainers",
    "referencePrefix": "BK"
  }
}
```

### 16. POST /api/payments/[bookingId]/deposit/upload
Upload deposit receipt.

**Auth Required**: Yes (Client)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `receiptImage`: File
- `payidReference`: String
- `amount`: Number

**Response** (200):
```json
{
  "success": true,
  "data": {
    "receiptImageUrl": "https://...",
    "paymentStatus": "PENDING"
  }
}
```

### 17. POST /api/payments/deposit/verify
Admin verify deposit.

**Auth Required**: Yes (Admin only)

**Request Body**:
```json
{
  "bookingId": "uuid",
  "verified": true,
  "notes": "Payment verified"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "paymentStatus": "VERIFIED",
    "verifiedAt": "2025-01-10T15:00:00Z"
  }
}
```

---

## Vetting

### 18. POST /api/vetting
Submit performer vetting application.

**Auth Required**: Yes (Performer)

**Content-Type**: `multipart/form-data`

**Form Data**:
- `fullLegalName`: String
- `idType`: String
- `idNumber`: String
- `idDocument`: File
- `selfieWithId`: File
- `contactNumber`: String
- `emergencyContact`: String
- `emergencyPhone`: String
- `consentAgreed`: Boolean

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "createdAt": "2025-01-10T10:00:00Z"
  }
}
```

### 19. GET /api/vetting/me
Get my vetting application status.

**Auth Required**: Yes (Performer)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "APPROVED",
    "reviewedAt": "2025-01-11T10:00:00Z",
    "reviewNotes": "Approved"
  }
}
```

---

## Admin Endpoints

### 20. GET /api/admin/overview
Dashboard statistics.

**Auth Required**: Yes (Admin)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "totalBookings": 150,
    "pendingApprovals": 5,
    "activePerformers": 12,
    "revenue": 45000,
    "recentActivity": [ ... ]
  }
}
```

### 21. GET /api/admin/audit
Audit log with pagination.

**Auth Required**: Yes (Admin)

**Query Params**: `page`, `limit`, `action`, `entity`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "action": "USER_SIGNUP",
        "entity": "user",
        "userId": "uuid",
        "createdAt": "2025-01-10T10:00:00Z"
      }
    ],
    "pagination": { ... }
  }
}
```

### 22-31. Other Admin Endpoints

Refer to BACKEND_DEPLOY.md for complete admin endpoint documentation.

---

## Webhooks & Cron

### 32. POST /api/webhooks/twilio/whatsapp
Twilio WhatsApp webhook.

**Auth Required**: No (Twilio signature validation)

### 33. GET /api/cron/cleanup
Cleanup stale data (cron job).

**Auth Required**: CRON_SECRET header

### 34. GET /api/cron/reminders
Send booking reminders (cron job).

**Auth Required**: CRON_SECRET header

---

## Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute
- **File uploads**: 5 per minute

## Testing

```bash
# Test API locally
npm run test:api

# Test with curl
curl -X GET http://localhost:3000/api/services

# Test with auth
curl -X GET \
  http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```
