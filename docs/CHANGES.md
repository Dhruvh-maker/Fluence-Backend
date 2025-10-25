# Backend Changes Log

This document tracks all modifications made to the Fluence Pay backend for admin panel integration.

---

## Current Session - October 25, 2025

### Notification Service - Admin Notification Broadcasting

**Feature:** Admin notification broadcasting system for Settings Tab

#### New Files Created:
1. **`src/routes/admin.routes.js`**
   - Admin-only notification routes
   - Requires authentication + admin role
   - Endpoints:
     - `POST /api/admin/notifications/send` - Send notification to all users
     - `GET /api/admin/notifications/user-count` - Get total user count

2. **`src/controllers/admin.controller.js`**
   - `sendBulkNotification()` - Sends notification to all users in database
   - `getUserCount()` - Returns total user count for UI display
   - Uses existing `NotificationService.sendBulkNotifications()`

#### Modified Files:
1. **`src/app.js`**
   - Added import: `import adminRoutes from './routes/admin.routes.js'`
   - Mounted admin routes: `app.use('/api/admin/notifications', adminRoutes)`

2. **`src/models/notification.model.js`**
   - Fixed `createNotification()` method to match database schema
   - Changed: `title` → `subject` (column name)
   - Added required fields: `recipient`, `status`, `metadata`
   - Now inserts: `(user_id, type, recipient, subject, message, metadata, sent_at, status)`

3. **`src/controllers/admin.controller.js`** (implementation details)
   - Removed `WHERE is_active = true` (column doesn't exist in users table)
   - Changed default type from `'general'` to `'in_app'` (matches DB constraint)
   - Query: `SELECT id FROM users` (gets all users)

#### Database Schema Compliance:
- Notifications table requires: `type IN ('email', 'sms', 'push', 'in_app')`
- All admin notifications use `type = 'in_app'`
- Required fields: `user_id`, `type`, `recipient`, `subject`, `message`, `status`

#### Security:
- All admin routes protected by `verifyAuthToken()` + `requireAdmin()`
- Only users with `role: 'admin'` in JWT can access
- Validates title and message are not empty

#### API Endpoints Added:
```
POST /api/admin/notifications/send
Body: { title, message, type }
Response: { success, message, data: { recipientsCount } }

GET /api/admin/notifications/user-count
Response: { success, data: { count } }
```

---

## Archive

All previous changes have been moved to [CHANGES_ARCHIVE.md](./CHANGES_ARCHIVE.md) to keep this file clean and manageable.

### Quick Links to Archived Changes:
- **January 2025**: Role field fixes, port configurations
- **October 2025**: JWT role in token, merchant suspend, social posts review

---

**Last Updated:** October 25, 2025 - 15:10 IST
