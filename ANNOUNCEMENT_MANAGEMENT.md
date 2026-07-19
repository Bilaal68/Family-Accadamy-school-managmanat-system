# Announcement Management - Full Implementation

## Overview
Admins can now create, view, edit, and delete announcements. Teachers can create and manage announcements for their classes. The system includes proper permission checks to ensure only the creator or an admin can edit/delete announcements.

## Implementation Details

### Backend Changes

#### 1. Updated `AnnouncementDetailView` (views.py)
- **Permission Check**: Changed from `[IsAuthenticated, IsAdmin]` to `[IsAuthenticated]`
- **New Method**: Added `_can_modify()` helper method that checks:
  - Admin (SUPER_ADMIN) can modify any announcement
  - Creator can modify their own announcement
  - Others get 403 Forbidden

**Available Endpoints:**
- `GET /api/v1/notifications/announcements/<id>/` - View announcement details
- `PUT /api/v1/notifications/announcements/<id>/` - Edit announcement (requires permission)
- `DELETE /api/v1/notifications/announcements/<id>/` - Delete announcement (requires permission)

#### 2. Updated `AnnouncementListView` (views.py)
- **Permission Check**: Changed from `[IsAuthenticated, IsAdmin]` to `[IsAuthenticated]`
- **Filtering Logic**:
  - Admins see all announcements
  - Non-admins see only announcements they created
- Returns up to 100 announcements ordered by most recent first

**Available Endpoint:**
- `GET /api/v1/notifications/announcements/` - List announcements (filtered based on user role)

#### 3. `AnnouncementCreateView` Unchanged
- Admins can create announcements for "All School"
- Teachers can only create class-specific announcements
- Automatically sets `sent_by` to the authenticated user
- Creates notifications for all relevant recipients

### Frontend Implementation

#### Already Implemented in `AnnouncementsPage.jsx`
The frontend already has all necessary functionality:

1. **List Announcements** - Table view with:
   - Title, sent to, sent at, sent by columns
   - Edit and Delete action buttons for each announcement

2. **Create New Announcement** - Dialog form with:
   - Title and Message fields
   - Audience selector (All School / Specific Class)
   - Class selection (if specific class chosen)
   - Send button

3. **Edit Announcement** - Dialog form with:
   - Pre-filled title, message, audience, class
   - Update button
   - Same fields as create form

4. **Delete Announcement** - Confirmation dialog with:
   - Clear warning message
   - Cancel/Delete buttons
   - Loading state during deletion

#### API Functions in `notifications.js`
- `fetchAnnouncements()` - GET list of announcements
- `sendAnnouncement(payload)` - POST new announcement
- `updateAnnouncement(id, payload)` - PUT to update announcement
- `deleteAnnouncement(id)` - DELETE announcement

### User Workflows

#### Admin Workflow
1. Admin logs in
2. Opens "Announcements" page (in admin dashboard)
3. Can:
   - **Create** new announcement for "All School" or specific class
   - **View** all announcements they've created (or any admin has created)
   - **Edit** their own announcements or any admin's announcements
   - **Delete** their own announcements or any admin's announcements

#### Teacher Workflow
1. Teacher logs in
2. Opens "Announcements" page (in teacher dashboard)
3. Can:
   - **Create** class-specific announcement (automatically scoped to their class)
   - **View** announcements they've created
   - **Edit** their own announcements
   - **Delete** their own announcements

### Error Handling

1. **Permission Denied (403)**:
   - When non-creator tries to edit/delete someone else's announcement
   - User gets toast notification: "You don't have permission to edit/delete this announcement."

2. **Not Found (404)**:
   - When trying to access non-existent announcement
   - User gets toast notification: "Could not load announcements."

3. **Validation Error (400)**:
   - Invalid class ID
   - Missing required fields
   - User gets specific error message in toast

4. **Server Error (500)**:
   - Generic error handling
   - User gets toast notification: "Could not [action] announcement."

### Data Structure

#### Announcement Model
```python
{
    "id": "uuid",
    "title": "string",
    "message": "string",
    "audience": "ALL" | "CLASS",
    "school_class_id": "uuid (nullable)",
    "sent_by_id": "uuid",
    "created_at": "datetime",
    "sent_to": "All School" | "Class Name",
    "sent_by_name": "Full Name"
}
```

#### API Request Payloads

**Create/Update:**
```json
{
    "title": "Announcement Title",
    "message": "Announcement message content",
    "audience": "ALL" | "CLASS",
    "class_id": "uuid (required if audience=CLASS, optional otherwise)"
}
```

### Permission Matrix

| Action | Admin | Teacher | Parent |
|--------|-------|---------|--------|
| Create "All School" announcement | ✅ | ❌ | ❌ |
| Create class announcement | ❌ | ✅ (own class only) | ❌ |
| View own announcements | ✅ | ✅ | ❌ |
| View other admin announcements | ✅ | ❌ | ❌ |
| Edit own announcement | ✅ | ✅ | ❌ |
| Edit other's announcement | ✅ (any) | ❌ | ❌ |
| Delete own announcement | ✅ | ✅ | ❌ |
| Delete other's announcement | ✅ (any) | ❌ | ❌ |

### Testing Checklist

- [x] Backend system checks pass
- [x] Frontend builds successfully  
- [x] Create announcement as admin
- [x] Create announcement as teacher
- [x] Edit own announcement
- [x] Try to edit other's announcement (should fail with 403)
- [x] Delete own announcement
- [x] Try to delete other's announcement (should fail with 403)
- [x] Verify notifications are sent to recipients
- [x] List view filters correctly for non-admins

### Files Modified

1. `backend/apps/notifications/views.py`
   - Updated `AnnouncementListView` - filtering by user role
   - Updated `AnnouncementDetailView` - permission checks for edit/delete

2. `family-sms-frontend/src/features/admin/pages/AnnouncementsPage.jsx`
   - Already implemented with full edit/delete UI

3. `family-sms-frontend/src/api/notifications.js`
   - Already implemented with all required API functions

## Summary

✅ **COMPLETE** - Admins and teachers can now:
- Create announcements
- View their announcements
- Edit their own announcements
- Delete their own announcements
- See proper permission errors when trying to modify others' announcements

The implementation is secure, user-friendly, and follows Django/React best practices.
