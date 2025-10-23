# 🔐 Sabre Environment Variables - Multiple Options

## Option 1: Current Format (Pre-generated Client ID/Secret)
```env
# Current Sabre credentials
SABRE_CLIENT_ID=V1:xq3lzxku0rkguczn:DEVCENTER:EXT
SABRE_CLIENT_SECRET=67hwpTLR
SABRE_BASE_URL=https://api-crt.cert.havail.sabre.com
```

## Option 2: Separate Components (Alternative)
```env
# Alternative: Separate username/password components
SABRE_USERNAME=xq3lzxku0rkguczn
SABRE_PASSWORD=67hwpTLR
SABRE_ORGANIZATION=DEVCENTER
SABRE_DOMAIN=EXT
SABRE_BASE_URL=https://api-crt.cert.havail.sabre.com

# Keep the current format as fallback
SABRE_CLIENT_ID=V1:xq3lzxku0rkguczn:DEVCENTER:EXT
SABRE_CLIENT_SECRET=67hwpTLR
```

## 🧪 Test All Methods

The updated service will now try:

1. **Method 1:** Your current `SABRE_CLIENT_ID` and `SABRE_CLIENT_SECRET`
2. **Method 2:** Generate Client ID from components: `V1:username:org:domain`
3. **Method 3:** Direct username/password authentication

## 🚀 Test Command

```bash
# Start server
npm run dev

# Test all authentication methods
curl -X GET http://localhost:5001/api/v1/sabre-test/auth
```

## 📊 Expected Results

The service will try each method and report which one works:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sabre authentication successful! ✅",
  "data": {
    "authenticated": true,
    "method": "Method 2: Generated Client ID",
    "tokenReceived": true
  }
}
```

## 🔍 If All Methods Fail

Check the console logs for detailed error information from each method, then:

1. **Verify account status** in Sabre Developer Portal
2. **Contact Sabre support** with specific error details
3. **Request credential verification** from Sabre team

## 🎯 Next Steps

1. **Test updated authentication** (tries all methods)
2. **Check console logs** for detailed error info
3. **If successful:** Complete Sabre integration
4. **If still failing:** Contact Sabre support with logs