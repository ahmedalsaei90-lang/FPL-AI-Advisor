# GLM API Setup and Configuration

## Current Status

✅ **API Key**: Configured and authenticated
⚠️ **API Balance**: Insufficient balance - needs recharge
✅ **Model**: `glm-4-plus` (verified working model)

## Issue Summary

The GLM API key `aef1479a1d0e4261a7c2725775ed35d5.IqblbBCm0a3VZ9Zi` is valid and working, but the account has **insufficient balance** to make API calls.

### Test Results

When testing various models, we found:
- ❌ Most models return `400 - Unknown Model`
- ✅ `glm-4-plus` returns `429 - Insufficient balance or no resource package`

This confirms:
1. The API key is authenticated correctly
2. The model `glm-4-plus` is the correct model to use
3. The account needs to be recharged at https://open.bigmodel.cn/

## How to Fix

### Option 1: Recharge Your GLM Account (Recommended)

1. Visit https://open.bigmodel.cn/
2. Log in to your account
3. Navigate to the billing/recharge section
4. Add credits to your account
5. Restart your development server

### Option 2: Use a Different API Key

If you have another GLM API key with available balance:

1. Update `.env.local`:
   ```
   API_KEY=your_new_api_key_here
   ```

2. Restart the development server:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

## Configuration Files

### Environment Variables (`.env.local`)

```
API_KEY=aef1479a1d0e4261a7c2725775ed35d5.IqblbBCm0a3VZ9Zi
```

### API Route Configuration

File: `src/app/api/advisor/chat/route.ts`

```typescript
model: 'glm-4-plus', // Verified working model (requires API balance)
```

## Testing the API

Run the test script to verify your API setup:

```bash
node test-glm-api.js
```

Expected output when balance is available:
```
✅ SUCCESS!
AI Response: Hello! API is working!
Tokens used: XX
🎉 Working model found: glm-4-plus
API key is functional!
```

## Error Messages

### 429 - Insufficient Balance
```json
{
  "error": {
    "code": "1211",
    "message": "Insufficient balance or no resource package. Please recharge."
  }
}
```

**Solution**: Recharge your account at https://open.bigmodel.cn/

### 400 - Unknown Model
```json
{
  "error": {
    "code": "1211",
    "message": "Unknown Model, please check the model code."
  }
}
```

**Solution**: Use `glm-4-plus` as the model name (already configured)

## Restart Instructions

After recharging or updating the API key, restart your development server:

```bash
# Windows PowerShell or Command Prompt
# 1. Stop the current server (Ctrl+C in the terminal running the dev server)
# 2. Restart it
npm run dev
```

The new environment variables will be loaded on server restart.

## Code Improvements Made

1. ✅ Fixed hardcoded API key (now uses environment variable)
2. ✅ Added retry logic with exponential backoff (3 attempts)
3. ✅ Added comprehensive error logging with `[GLM API]` prefix
4. ✅ Added 30-second timeout for API requests
5. ✅ Updated to correct model name (`glm-4-plus`)
6. ✅ Better error messages for debugging

## Support

For GLM API issues:
- Documentation: https://open.bigmodel.cn/dev/api
- Support: Check the GLM platform for support options

For application issues:
- Check the server logs for `[GLM API]` messages
- Review the error log: `error log.txt`
