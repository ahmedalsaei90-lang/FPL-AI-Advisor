# Input Validation Implementation Guide
**Date:** November 5, 2025
**Status:** Ready for Implementation

---

## Overview

Created comprehensive Zod validation schemas in [src/lib/validation.ts](src/lib/validation.ts) to prevent security vulnerabilities like:
- Invalid UUID injection
- SQL injection via malformed inputs
- XSS attacks via unvalidated strings
- Type confusion attacks

---

## Files Created

### 1. Validation Schema Library
**File:** [src/lib/validation.ts](src/lib/validation.ts) (350+ lines)

**Contents:**
- ✅ Common validators (UUID, email, FPL IDs, pagination)
- ✅ Auth schemas (signup, login, guest)
- ✅ Team schemas (import, data query)
- ✅ League schemas (import, list, detail)
- ✅ Notification schemas (create, mark read, delete, list)
- ✅ Advisor schemas (AI chat)
- ✅ Helper functions for validation and error formatting

---

## Implementation Pattern

### Basic Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { validateData, teamImportSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request
    const auth = await authenticateRequest(request)
    if (!auth.success || !auth.user) {
      return NextResponse.json(
        { error: auth.error ||'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()

    // 3. Validate input
    const validation = validateData(teamImportSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: formatValidationErrors(validation.errors!)
        },
        { status: 400 }
      )
    }

    // 4. Use validated data
    const { teamId } = validation.data!
    const userId = auth.user.id  // From JWT, not request body

    // ... rest of logic

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## API Routes to Update

### Priority 1: Critical Auth Endpoints

#### 1. `/api/auth/signup`
**Current:** No validation
**Need:** Email and password validation

```typescript
import { validateData, signupSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate input
  const validation = validateData(signupSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
    )
  }

  const { email, password, displayName } = validation.data!
  // ... rest of signup logic
}
```

#### 2. `/api/auth/login`
**Current:** No validation
**Need:** Email and password validation

```typescript
import { validateData, loginSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const validation = validateData(loginSchema, body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
      )
  }

  const { email, password } = validation.data!
  // ... rest of login logic
}
```

### Priority 2: User Data Endpoints

#### 3. `/api/team/import`
**Current:** No UUID validation
**Need:** Validate userId and teamId

```typescript
import { validateData, teamImportSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validateData(teamImportSchema, {
    userId: auth.user.id,  // From JWT
    teamId: body.teamId
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
    )
  }

  const { teamId } = validation.data!
  // ... rest of import logic
}
```

#### 4. `/api/leagues/import`
**Current:** No UUID validation
**Need:** Validate userId and leagueId

```typescript
import { validateData, leagueImportSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validateData(leagueImportSchema, {
    userId: auth.user.id,
    leagueId: body.leagueId
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
    )
  }

  const { leagueId } = validation.data!
  // ... rest of import logic
}
```

#### 5. `/api/advisor/chat`
**Current:** No message validation
**Need:** Validate message length and format

```typescript
import { validateData, aiChatSchema, formatValidationErrors } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const validation = validateData(aiChatSchema, {
    userId: auth.user.id,
    message: body.message
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
    )
  }

  const { message } = validation.data!
  // ... rest of chat logic
}
```

### Priority 3: Notification Endpoints

#### 6. `/api/notifications` (POST - Create)
```typescript
import { validateData, notificationCreateSchema, formatValidationErrors } from '@/lib/validation'

// Add validation for notification creation
const validation = validateData(notificationCreateSchema, body)
```

#### 7. `/api/notifications` (POST - Mark Read)
```typescript
import { validateData, notificationMarkReadSchema, formatValidationErrors } from '@/lib/validation'

// Add validation for mark as read
const validation = validateData(notificationMarkReadSchema, body)
```

#### 8. `/api/notifications` (DELETE)
```typescript
import { validateData, notificationDeleteSchema, formatValidationErrors } from '@/lib/validation'

// Add validation for delete
const validation = validateData(notificationDeleteSchema, body)
```

---

## Query Parameter Validation

For GET endpoints with query parameters, validate using URLSearchParams:

```typescript
import { validateData, leagueListQuerySchema, formatValidationErrors } from '@/lib/validation'

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Extract query params
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page')
  const limit = searchParams.get('limit')

  // Validate query params
  const validation = validateData(leagueListQuerySchema, {
    userId: auth.user.id,
    page: page ? parseInt(page) : undefined,
    limit: limit ? parseInt(limit) : undefined
  })

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid query parameters',
        details: formatValidationErrors(validation.errors!)
      },
      { status: 400 }
    )
  }

  const { page: validPage, limit: validLimit } = validation.data!
  // ... rest of logic
}
```

---

## Testing Validation

### Test Invalid UUID
```bash
curl -X POST http://localhost:3000/api/team/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"teamId": "not-a-number"}'

# Expected: 400 Bad Request
# {
#   "error": "Validation failed",
#   "details": {
#     "teamId": ["FPL Team ID must be a positive integer"]
#   }
# }
```

### Test Invalid Email
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email", "password": "test1234"}'

# Expected: 400 Bad Request
# {
#   "error": "Validation failed",
#   "details": {
#     "email": ["Invalid email format"]
#   }
# }
```

### Test Short Password
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "short"}'

# Expected: 400 Bad Request
# {
#   "error": "Validation failed",
#   "details": {
#     "password": ["Password must be at least 8 characters"]
#   }
# }
```

### Test Message Too Long
```bash
curl -X POST http://localhost:3000/api/advisor/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "<2001 characters>"}'

# Expected: 400 Bad Request
# {
#   "error": "Validation failed",
#   "details": {
#     "message": ["Message is too long (max 2000 characters)"]
#   }
# }
```

---

## Security Benefits

### Before Validation
```typescript
// Vulnerable code
const userId = searchParams.get('userId')  // Could be any string!
const data = await db.query('SELECT * FROM users WHERE id = ?', [userId])
// If userId = "' OR '1'='1", potential SQL injection
// If userId = "not-a-uuid", database error
```

### After Validation
```typescript
// Secure code
const validation = validateData(uuidSchema, userId)
if (!validation.success) {
  return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
}

const data = await db.query('SELECT * FROM users WHERE id = ?', [validation.data])
// Only valid UUIDs pass through
// Invalid inputs rejected with 400 Bad Request
```

---

## Implementation Checklist

### Phase 1: Auth Endpoints (Highest Priority)
- [ ] `/api/auth/signup` - Add signupSchema validation
- [ ] `/api/auth/login` - Add loginSchema validation

### Phase 2: User Data Endpoints
- [ ] `/api/team/import` - Add teamImportSchema validation
- [ ] `/api/leagues/import` - Add leagueImportSchema validation
- [ ] `/api/advisor/chat` - Add aiChatSchema validation

### Phase 3: Query Parameter Endpoints
- [ ] `/api/leagues` GET - Add leagueListQuerySchema validation
- [ ] `/api/leagues/[id]` GET - Add leagueDetailQuerySchema validation
- [ ] `/api/notifications` GET - Add notificationListQuerySchema validation

### Phase 4: Notification Endpoints
- [ ] `/api/notifications` POST (create) - Add notificationCreateSchema
- [ ] `/api/notifications` POST (mark read) - Add notificationMarkReadSchema
- [ ] `/api/notifications` DELETE - Add notificationDeleteSchema

### Phase 5: Testing
- [ ] Test all endpoints with invalid inputs
- [ ] Verify proper 400 error responses
- [ ] Verify error messages are helpful
- [ ] Check that valid inputs still work

---

## Benefits Summary

✅ **Security**
- Prevents UUID injection attacks
- Stops malformed input from reaching database
- Validates data types before processing

✅ **User Experience**
- Clear, helpful error messages
- Faster feedback on invalid inputs
- Consistent error response format

✅ **Developer Experience**
- Type-safe validated data
- Centralized validation logic
- Easy to test and maintain

✅ **Code Quality**
- Single source of truth for validation rules
- Reduces code duplication
- Self-documenting schemas

---

## Next Steps

1. **Immediate:** Implement validation in auth endpoints (signup, login)
2. **Short-term:** Add validation to all user data endpoints
3. **Medium-term:** Add validation to query parameters
4. **Long-term:** Create automated tests for all validation scenarios

---

**Implementation Ready:** All schemas are defined and ready to use
**Estimated Time:** 2-3 hours to implement across all endpoints
**Priority:** HIGH - Critical security improvement

