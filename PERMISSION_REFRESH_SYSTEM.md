# Permission Refresh System - Security Fix

## The Problem ❌

When admin changes a user's permissions in the backend, the user doesn't see the changes until they logout and login again. This is because permissions are cached in localStorage.

**Example:**

1. Secretary has `create-patient` permission
2. Admin removes this permission
3. Secretary is still logged in
4. **Secretary can still access patient creation** ❌ (cached in localStorage)

---

## The Solution ✅

### 1. **Automatic Permission Refresh (Every 5 Minutes)**

```javascript
// In authNew.js store
function startPermissionRefresh() {
  permissionRefreshInterval.value = setInterval(async () => {
    console.log("🔄 Auto-refreshing user permissions...");
    await loadUser(); // Fetches fresh permissions from API
  }, 300000); // 5 minutes
}
```

**Started automatically** when user logs in or app initializes.

### 2. **Navigation-Based Refresh (Every 2 Minutes of Activity)**

```javascript
// In router/index.js
router.beforeEach(async (to, from, next) => {
  const lastRefresh = sessionStorage.getItem("last_permission_refresh");
  const now = Date.now();
  const twoMinutes = 2 * 60 * 1000;

  if (!lastRefresh || now - parseInt(lastRefresh) > twoMinutes) {
    console.log("🔄 Refreshing permissions on navigation...");
    await authStore.refreshPermissions();
    sessionStorage.setItem("last_permission_refresh", now.toString());
  }
});
```

**Refreshes permissions** when user navigates between pages (if 2+ minutes passed since last refresh).

### 3. **Manual Refresh**

```javascript
const authStore = useAuthStore();

// Manually refresh permissions anytime
await authStore.refreshPermissions();
```

### 4. **User Notification**

When permissions change, user sees a notification:

```
🔔 "تم تحديث صلاحياتك. يرجى إعادة تحميل الصفحة."
    [تحديث] [إغلاق]
```

User can click "تحديث" to reload the page with new permissions.

---

## How It Works

```
┌─────────────────────────────────────────────────────────┐
│ User Login                                               │
│ ├─ Permissions fetched from API                         │
│ ├─ Saved to localStorage (for quick access)             │
│ └─ Auto-refresh started (every 5 minutes)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Every 5 Minutes (Background)                            │
│ ├─ Call GET /api/auth/me                                │
│ ├─ Compare with current permissions                     │
│ └─ Update localStorage if changed                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ On Every Navigation (if 2+ minutes passed)              │
│ ├─ Refresh permissions before route access             │
│ ├─ Check new permissions against route requirements    │
│ └─ Block access if permission removed                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Permission Watcher (Real-time)                          │
│ ├─ Detects when permissions array changes              │
│ ├─ Shows notification to user                          │
│ └─ Suggests page reload                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Timeline Example

**10:00 AM** - Secretary logs in with `create-patient` permission

**10:02 AM** - Admin removes `create-patient` permission

**10:05 AM** - Auto-refresh runs → Detects change → Updates localStorage → Shows notification

**10:05:30 AM** - Secretary clicks "تحديث" → Page reloads → Patient creation button disappears ✅

---

## Configuration

### Change Refresh Intervals

**Background refresh (default: 5 minutes):**

```javascript
// In authNew.js - line 207
permissionRefreshInterval.value = setInterval(async () => {
  await loadUser();
}, 300000); // Change this: 300000ms = 5 minutes
```

**Navigation refresh (default: 2 minutes):**

```javascript
// In router/index.js - line 273
const twoMinutes = 2 * 60 * 1000; // Change this
```

### Disable Auto-Refresh

```javascript
const authStore = useAuthStore();

// Stop auto-refresh
authStore.stopPermissionRefresh();
```

---

## Benefits

✅ **Security:** Permissions are refreshed automatically  
✅ **User Experience:** Minimal disruption (background refresh)  
✅ **Real-time:** Changes detected within 2-5 minutes  
✅ **Notification:** User is informed when permissions change  
✅ **No Logout Required:** User stays logged in

---

## API Calls

The system calls `GET /api/auth/me`:

- **On login:** 1 time
- **Every 5 minutes:** Automatic background
- **On navigation (if needed):** Every 2+ minutes of activity
- **Manual refresh:** When explicitly called

**Average:** ~15-20 API calls per hour for active user (very reasonable!)

---

## Testing

### Test Permission Removal:

1. Login as secretary
2. Navigate to patients page (has access)
3. Admin removes `create-patient` permission in backend
4. Wait 2 minutes
5. Navigate to another page (triggers refresh)
6. **Expected:** Access denied / notification shown

### Test Permission Addition:

1. Login as secretary (no bill permission)
2. Try to access /bills (access denied)
3. Admin adds `create-bill` permission
4. Wait 5 minutes (or navigate after 2 minutes)
5. **Expected:** Bills menu item appears / can access bills

---

## Summary

**Problem:** Permissions cached in localStorage become stale  
**Solution:** Auto-refresh every 5 minutes + refresh on navigation  
**Result:** Permissions always up-to-date within 2-5 minutes maximum

No user logout required! 🎉
