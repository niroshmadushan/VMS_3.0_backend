# 🔧 Fix: crypto.randomUUID is not a function

## Problem
The error `TypeError: crypto.randomUUID is not a function` occurs when:
- Using an older browser that doesn't support `crypto.randomUUID()`
- Running on HTTP instead of HTTPS (browsers require secure context)
- Using an older version of Node.js (< 15.6.0)

## Solution

### Option 1: Use the UUID Helper (Recommended)

I've created a helper file that works in all environments. Use it in your `booking-management.tsx`:

**1. Import the helper:**
```typescript
import { generateUUID } from './uuid-helper'; // or wherever you place the file
```

**2. Replace `crypto.randomUUID()` with `generateUUID()`:**
```typescript
// Before (causing error):
const id = crypto.randomUUID();

// After (works everywhere):
const id = generateUUID();
```

### Option 2: Install uuid package (Alternative)

If you prefer using a library:

**1. Install the package:**
```bash
npm install uuid
npm install --save-dev @types/uuid
```

**2. Use it in your code:**
```typescript
import { v4 as uuidv4 } from 'uuid';

// In your function:
const id = uuidv4();
```

### Option 3: Inline Fallback Function

If you don't want to create a separate file, add this function directly in your component:

```typescript
// Add this helper function in your component file
function generateUUID(): string {
    // Try crypto.randomUUID() first
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (error) {
            // Fall through to fallback
        }
    }

    // Fallback for older browsers/environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Then use it:
const id = generateUUID();
```

## Quick Fix for booking-management.tsx

In your `handleConfirmCancellation` function around line 1828, replace:

```typescript
// ❌ This causes the error:
const cancellationId = crypto.randomUUID();

// ✅ Use this instead:
import { generateUUID } from './uuid-helper'; // Add at top of file
const cancellationId = generateUUID();
```

Or if you want to keep it inline:

```typescript
// Add this function in your component
const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        try {
            return crypto.randomUUID();
        } catch (error) {
            // Fall through
        }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Then in handleConfirmCancellation:
const cancellationId = generateUUID();
```

## Browser Compatibility

| Method | Chrome | Firefox | Safari | Edge | IE |
|--------|--------|---------|--------|------|-----|
| `crypto.randomUUID()` | 92+ | 95+ | 15.4+ | 92+ | ❌ |
| `generateUUID()` (fallback) | ✅ All | ✅ All | ✅ All | ✅ All | ✅ All |

## Notes

- The helper function automatically detects if `crypto.randomUUID()` is available
- Falls back to a manual UUID v4 generator if not available
- Works in all browsers and environments (HTTP, HTTPS, Node.js)
- No dependencies required

