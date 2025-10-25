# Backend Changes Archive

This document contains historical changes from previous development sessions.

---

## January 2025 Changes

### Change #1: Added Role Field to Firebase Authentication Response
**Date:** 2025-01-25  
**File:** `auth-service/src/controllers/social.controller.js`  
**Type:** Bug Fix - Missing Field in API Response

### Problem:
The Flutter admin panel authentication was failing with "Access denied. Admin privileges required" even though the user had admin role in the database.

### Root Cause:
The backend's Firebase authentication endpoint (`POST /api/auth/firebase`) was returning user data without the `role` field:

```javascript
// BEFORE (Missing role field)
user: { id: user.id, name: user.name, email: user.email }
```

The database had `role: 'admin'` but it wasn't being sent to the Flutter app, causing the app to receive `role: null`.

### Solution:
Added the `role` field to the user object in the API response:

```javascript
// AFTER (Includes role field)
user: { id: user.id, name: user.name, email: user.email, role: user.role }
```

### Impact:
- ✅ Admin users can now successfully authenticate
- ✅ Role-based access control works properly
- ✅ Flutter app receives complete user information
- ✅ No breaking changes to existing functionality

### Files Modified:
- `Fluence-Backend-Private/auth-service/src/controllers/social.controller.js` (Lines 56-67)

---

### Change #2: Created Admin Role Update Script
**Date:** 2025-01-25  
**File:** `auth-service/update-admin-role.js`  
**Type:** Utility Script

### Purpose:
Created a utility script to update existing users to admin role in the PostgreSQL database.

### Why This Was Needed:
When users first authenticate via Firebase, they are created in the database with default role (null or 'user'). This script updates their role to 'admin' for admin panel access.

### Usage:
```bash
cd auth-service
node update-admin-role.js
```

### What It Does:
- Connects to PostgreSQL database
- Finds user with email: admin@gmail.com
- Updates their role to 'admin'
- Verifies the update was successful

---

### Change #3: Port Configuration Issues - Services Running on Wrong Ports
**Date:** 2025-01-25  
**Type:** Configuration Issue

### Problem Discovered:
Multiple backend services are running on incorrect ports, causing Flutter app to fail connecting to them.

### Services Affected:

#### 1. Merchant Onboarding Service
**Expected Port (per README):** 4003  
**Actual Port (running on):** 4002  
**Root Cause:** `merchant-onboarding-service/src/config/index.js` line 7

#### 2. Cashback Budget Service
**Expected Port (per README):** 4002  
**Actual Port (default):** 4003  
**Root Cause:** `cashback-budget-service/src/config/index.js` line 7

### Status: ✅ COMPLETED

### Changes Made:

#### 1. Fixed Merchant Service Default Port
**File:** `merchant-onboarding-service/src/config/index.js` (Line 7)
```javascript
// BEFORE
const port = Number(process.env.MERCHANT_ONBOARDING_PORT || 4002);

// AFTER
const port = Number(process.env.MERCHANT_ONBOARDING_PORT || 4003);
```

#### 2. Fixed Cashback Service Default Port
**File:** `cashback-budget-service/src/config/index.js` (Line 7)
```javascript
// BEFORE
const port = Number(process.env.CASHBACK_BUDGET_PORT || 4003);

// AFTER
const port = Number(process.env.CASHBACK_BUDGET_PORT || 4002);
```

#### 3. Created .env Files (Optional - defaults now correct)
- `merchant-onboarding-service/.env` with PORT=4003
- `cashback-budget-service/.env` with PORT=4002

#### 4. Reverted Flutter App
- `FluenceApp/lib/services/api_service.dart` back to port 4003 for merchant

### Summary of Port Issues:
| Service | Expected Port | Actual Default | Status |
|---------|--------------|----------------|--------|
| Auth Service | 4001 | 4001 | ✅ CORRECT |
| Merchant Onboarding | 4003 | 4002 → 4003 | ✅ FIXED |
| Cashback Budget | 4002 | 4003 → 4002 | ✅ FIXED |
| Notification | 4004 | 4004 | ✅ CORRECT |
| Points Wallet | 4005 | 4005 | ✅ CORRECT |
| Referral | 4006 | 4006 | ✅ CORRECT |
| Social Features | 4007 | 4007 | ✅ CORRECT |

---

## Summary of January 2025 Changes:

| Date | Change | Type | Status | Impact |
|------|--------|------|--------|--------|
| 2025-01-25 | Added role field to auth response | Bug Fix | ✅ DONE | Critical - Enables admin authentication |
| 2025-01-25 | Created update-admin-role.js script | Utility | ✅ DONE | Helper script for admin setup |
| 2025-01-25 | Fixed port configuration issues | Config Fix | ✅ DONE | Critical - Services now reachable |

---

**Note:** These changes were necessary to enable the Flutter admin panel to properly authenticate and verify admin users.


---

## October 2025 Changes

### Change #4: Fixed JWT Token Missing Role Field
**Date:** 2025-10-25  
**File:** `auth-service/src/controllers/social.controller.js`  
**Type:** Bug Fix - JWT Token Missing Role
**Status:** ✅ COMPLETED & VERIFIED

### Problem:
The merchant service was rejecting admin requests with "Access denied. Admin privileges required" because the JWT token didn't include the `role` field.

### Solution:
Modified JWT signing to include role field:
```javascript
const jwt = signToken({ sub: user.id, email: user.email, role: user.role });
```

### Impact:
- ✅ JWT tokens now include user role
- ✅ Merchant service accepts admin requests
- ✅ Role-based authorization works across all microservices

---

### Change #5: Added Merchant Suspend Functionality
**Date:** 2025-10-25  
**Type:** Feature Enhancement
**Status:** ✅ COMPLETED & VERIFIED

### Problem:
Admin panel couldn't suspend approved merchants - database constraint and API validation didn't support suspended status.

### Solution:
1. Updated database constraint to include 'suspended' status
2. Updated API validation schema
3. Added business logic to only allow suspending approved merchants
4. Added extensive debug logging

### Business Rules:
- Suspend: Only approved merchants
- Approve/Reject: Only pending applications
- Status Flow: `pending` → `approved` → `suspended`

### Impact:
- ✅ Admins can suspend approved merchants
- ✅ Proper status transition enforcement
- ✅ Comprehensive audit logging

---

### Change #6: Implemented Social Posts Admin Review Functionality
**Date:** 2025-10-25  
**Services:** `social-features-service`, Flutter Admin Panel
**Type:** Feature Implementation
**Status:** ✅ COMPLETED & VERIFIED

### Problem:
Posts tab non-functional - missing service, incorrect endpoints, model mismatches.

### Solution:
1. Fixed package dependencies (multer version)
2. Migrated database schema (added missing columns)
3. Fixed microservices architecture (removed cross-database JOIN)
4. Removed express-validator dependency
5. Fixed Flutter API integration (correct service and endpoints)
6. Fixed Flutter data model with null safety
7. Added comprehensive debug logging

### API Endpoints:
- `GET /api/admin/social/posts/pending` - Get pending posts
- `POST /api/admin/social/posts/:postId/approve` - Approve post
- `POST /api/admin/social/posts/:postId/reject` - Reject post

### Impact:
- ✅ Social features service running on port 4007
- ✅ Admin can view/approve/reject posts
- ✅ Proper microservices architecture
- ✅ Flutter app correctly integrated

### Files Modified:
**Backend:**
- `social-features-service/package.json`
- `social-features-service/src/controllers/admin-social.controller.js`
- `social-features-service/src/routes/admin-social.routes.js`
- `social-features-service/README.md`

**Flutter:**
- `FluenceApp/lib/repositories/posts_repository.dart`
- `FluenceApp/lib/models/post.dart`
- `FluenceApp/lib/blocs/posts_bloc.dart`

---

## Summary of October 2025 Changes:

| Date | Change | Type | Status | Impact |
|------|--------|------|--------|--------|
| 2025-10-25 | JWT role field fix | Bug Fix | ✅ DONE | Critical - Enables admin authorization |
| 2025-10-25 | Merchant suspend functionality | Feature | ✅ DONE | Enables merchant suspension |
| 2025-10-25 | Social posts review system | Feature | ✅ DONE | Complete posts management |

---

**Note:** All changes follow microservices best practices with proper service boundaries and no cross-database queries.
