# User Settings API Documentation

This document describes the API endpoints for managing user settings including notifications, security, and preferences.

## Authentication

All settings endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Notification Settings

### GET /api/users/settings/notifications
Retrieve the current user's notification settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "clk1234567890",
    "userId": "user123",
    "contestAlerts": true,
    "leaderboardUpdates": true,
    "streakAlerts": true,
    "emailNotifications": true,
    "digestFrequency": "weekly",
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T09:45:56.000Z"
  }
}
```

### PUT /api/users/settings/notifications
Update the current user's notification settings.

**Request Body:**
```json
{
  "contestAlerts": true,
  "leaderboardUpdates": false,
  "streakAlerts": true,
  "emailNotifications": true,
  "digestFrequency": "daily"
}
```

**Valid values:**
- `contestAlerts`, `leaderboardUpdates`, `streakAlerts`, `emailNotifications`: boolean
- `digestFrequency`: "daily", "weekly", "monthly"

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "settings": {
    "id": "clk1234567890",
    "userId": "user123",
    "contestAlerts": true,
    "leaderboardUpdates": false,
    "streakAlerts": true,
    "emailNotifications": true,
    "digestFrequency": "daily",
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T10:15:30.000Z"
  }
}
```

## Security Settings

### GET /api/users/settings/security
Retrieve the current user's security settings.

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "cls1234567890",
    "userId": "user123",
    "twoFactorEnabled": false,
    "lastPasswordChange": null,
    "passwordChangeRequired": false,
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T09:45:56.000Z"
  }
}
```

**Note:** Sensitive fields like `loginAttempts` and `lockedUntil` are not included in the response for security reasons.

### PUT /api/users/settings/security
Update the current user's security settings.

**Request Body:**
```json
{
  "twoFactorEnabled": true
}
```

**Valid values:**
- `twoFactorEnabled`: boolean

**Response:**
```json
{
  "success": true,
  "message": "Security settings updated successfully",
  "settings": {
    "id": "cls1234567890",
    "userId": "user123",
    "twoFactorEnabled": true,
    "lastPasswordChange": null,
    "passwordChangeRequired": false,
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T10:20:15.000Z"
  }
}
```

## User Preferences

### GET /api/users/settings/preferences
Retrieve the current user's preferences.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "id": "clp1234567890",
    "userId": "user123",
    "theme": "system",
    "language": "en",
    "codeEditor": "vs-dark",
    "timezone": "UTC",
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T09:45:56.000Z"
  }
}
```

### PUT /api/users/settings/preferences
Update the current user's preferences.

**Request Body:**
```json
{
  "theme": "dark",
  "language": "en",
  "codeEditor": "vs-light",
  "timezone": "America/New_York"
}
```

**Valid values:**
- `theme`: "light", "dark", "system"
- `language`: Any ISO language code (e.g., "en", "es", "fr")
- `codeEditor`: "vs-dark", "vs-light", "hc-black", "hc-light"
- `timezone`: Any valid timezone string

**Response:**
```json
{
  "success": true,
  "message": "User preferences updated successfully",
  "preferences": {
    "id": "clp1234567890",
    "userId": "user123",
    "theme": "dark",
    "language": "en",
    "codeEditor": "vs-light",
    "timezone": "America/New_York",
    "createdAt": "2025-11-09T09:45:56.000Z",
    "updatedAt": "2025-11-09T10:25:42.000Z"
  }
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Not authenticated"
}
```

### 400 Bad Request
```json
{
  "message": "Invalid digest frequency. Must be daily, weekly, or monthly."
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "error": "..."
}
```

## Database Schema

The settings are stored in separate tables:

### NotificationSettings
- `id`: String (Primary Key)
- `userId`: String (Foreign Key to User)
- `contestAlerts`: Boolean (default: true)
- `leaderboardUpdates`: Boolean (default: true)
- `streakAlerts`: Boolean (default: true)
- `emailNotifications`: Boolean (default: true)
- `digestFrequency`: String (default: "weekly")

### SecuritySettings
- `id`: String (Primary Key)
- `userId`: String (Foreign Key to User)
- `twoFactorEnabled`: Boolean (default: false)
- `lastPasswordChange`: DateTime (nullable)
- `passwordChangeRequired`: Boolean (default: false)
- `loginAttempts`: Integer (default: 0)
- `lockedUntil`: DateTime (nullable)

### UserPreferences
- `id`: String (Primary Key)
- `userId`: String (Foreign Key to User)
- `theme`: String (default: "system")
- `language`: String (default: "en")
- `codeEditor`: String (default: "vs-dark")
- `timezone`: String (default: "UTC")

## Implementation Notes

1. **Auto-creation**: If a user doesn't have settings/preferences records, they are automatically created with default values when first accessed.

2. **Partial Updates**: All PUT endpoints support partial updates - you only need to include the fields you want to change.

3. **Validation**: The API validates enum values (theme, digestFrequency, codeEditor) and returns appropriate error messages for invalid values.

4. **Security**: Security-sensitive fields like login attempts and lock status are not exposed through the API for security reasons.

5. **Cascading Deletes**: All settings tables have `onDelete: Cascade` relationships with the User table, so settings are automatically deleted when a user is deleted.