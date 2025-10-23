# 🔐 Sabre Official Authentication Guide

Based on: https://developer.sabre.com/guides/travel-agency/developer-guides/rest-apis-token-credentials

## 📋 Official Sabre Authentication Process

### Step 1: Credentials Format
Sabre uses **Client Credentials** in this format:
```
Client ID: V1:username:organization:domain
Client Secret: password
```

**Your credentials:**
```
SABRE_CLIENT_ID=V1:xq3lzxku0rkguczn:DEVCENTER:EXT
SABRE_CLIENT_SECRET=67hwpTLR
```

### Step 2: Authentication Method
**Endpoint:** `POST /v2/auth/token`

**Headers:**
```
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
Accept: application/json
```

**Body:**
```
grant_type=client_credentials
```

### Step 3: Implementation
```typescript
const clientId = 'V1:xq3lzxku0rkguczn:DEVCENTER:EXT';
const clientSecret = '67hwpTLR';
const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

const response = await axios.post(
  'https://api-crt.cert.havail.sabre.com/v2/auth/token',
  'grant_type=client_credentials',
  {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    }
  }
);
```

---

## 🔍 Credential Verification Process

### Check 1: Credential Format
✅ **Client ID Format:** `V1:username:organization:domain`
- Your format: `V1:xq3lzxku0rkguczn:DEVCENTER:EXT` ✅ Correct

✅ **Client Secret:** Simple password string
- Your format: `67hwpTLR` ✅ Correct

### Check 2: Environment
✅ **Test Environment:** `https://api-crt.cert.havail.sabre.com`
- Your setting: Correct ✅

### Check 3: Account Status
❓ **Account Activation:** This is likely the issue
- Credentials may need activation in Sabre Developer Portal
- Account may need approval process

---

## 🛠️ Troubleshooting Steps

### Step 1: Verify Account Status
1. **Login to Sabre Developer Portal**
   - Go to https://developer.sabre.com/
   - Login with your account
   - Check application status

2. **Check Application Approval**
   - Look for "Application Status"
   - Verify if it's "Active" or "Pending"
   - Check for any required actions

### Step 2: Verify Credentials
1. **In Developer Portal:**
   - Go to "My Applications"
   - Click on your application
   - Verify Client ID and Secret match your .env

2. **Check Environment:**
   - Ensure credentials are for "Certification" environment
   - Not "Production" environment

### Step 3: Contact Sabre Support
If credentials look correct but still failing:
1. **Email:** developer.support@sabre.com
2. **Subject:** "Authentication Issue - Client Credentials Grant"
3. **Include:**
   - Your Client ID (V1:xq3lzxku0rkguczn:DEVCENTER:EXT)
   - Error message (401 invalid_client)
   - Request for account verification

---

## 🧪 Test Current Implementation

Let's test with the updated authentication method:

```bash
# Start your server
npm run dev

# Test authentication
curl -X GET http://localhost:5001/api/v1/sabre-test/auth
```

**Expected Results:**

**If Successful:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sabre authentication successful! ✅",
  "data": {
    "authenticated": true,
    "tokenReceived": true,
    "tokenLength": 1234,
    "tokenPreview": "eyJ0eXAiOiJKV1QiLCJ..."
  }
}
```

**If Still Failing:**
```json
{
  "statusCode": 500,
  "success": false,
  "message": "Sabre Authentication Failed: Credentials are missing or the syntax is not correct"
}
```

---

## 📞 Next Steps Based on Results

### If Authentication Works ✅
1. **Complete Sabre integration** (2-3 days)
2. **Add to main price-list API**
3. **Test flight search functionality**

### If Still Failing ❌
1. **Contact Sabre Developer Support**
2. **Meanwhile, start Travelport integration**
3. **Or enhance Amadeus features**

---

## 🎯 Parallel Development Strategy

While resolving Sabre credentials:

### Option 1: Contact Travelport for PCC
- Request development PCC from Travelport
- Start JSON API integration
- Timeline: 1 week for PCC + 3-4 days integration

### Option 2: Enhance Amadeus
- Add multi-city flights
- Implement fare rules
- Add seat selection
- Timeline: 1-2 weeks

### Option 3: Wait for Sabre Resolution
- Focus on Sabre credential issue
- Simpler integration once resolved
- Timeline: Unknown (depends on support)

---

## 📊 Current Status Summary

| Provider | Status | Next Action | Timeline |
|----------|--------|-------------|----------|
| **Amadeus** | ✅ Working | Add features | 1-2 weeks |
| **Sabre** | ❌ Auth issue | Contact support | Unknown |
| **Travelport** | 🟡 Need PCC | Request access | 1 week + 3-4 days |

---

## 🚀 My Recommendation

1. **Test updated Sabre auth** (5 minutes)
2. **If still failing:** Contact Sabre support
3. **Parallel:** Request Travelport PCC
4. **Meanwhile:** Enhance Amadeus features

This gives you multiple paths forward without being blocked by any single supplier issue.

**Ready to test the updated Sabre authentication?** 🔐