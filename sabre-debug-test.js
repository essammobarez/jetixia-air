const axios = require('axios');

// Test Sabre authentication with your exact credentials
async function testSabreAuth() {
    const clientId = "V1:xq3lzxku0rkguczn:DEVCENTER:EXT";
    const clientSecret = "67hwpTLR";
    const baseUrl = "https://api-crt.cert.havail.sabre.com";

    console.log("🔐 Testing Sabre Authentication...");
    console.log("📍 Base URL:", baseUrl);
    console.log("🔑 Client ID:", clientId);
    console.log("🔑 Client Secret:", clientSecret);

    try {
        // Method 1: Basic Auth with URLSearchParams
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        console.log("🔐 Base64 Credentials:", credentials.substring(0, 20) + "...");

        const requestData = new URLSearchParams();
        requestData.append('grant_type', 'client_credentials');

        console.log("🌐 Making request to:", `${baseUrl}/v2/auth/token`);

        const response = await axios.post(
            `${baseUrl}/v2/auth/token`,
            requestData,
            {
                headers: {
                    "Authorization": `Basic ${credentials}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                },
                timeout: 30000,
            }
        );

        console.log("✅ SUCCESS! Token received:");
        console.log("📊 Response status:", response.status);
        console.log("🎫 Token preview:", response.data.access_token?.substring(0, 50) + "...");
        console.log("⏱️  Expires in:", response.data.expires_in, "seconds");

    } catch (error) {
        console.error("❌ FAILED:");
        if (error.response) {
            console.error("📊 Status:", error.response.status);
            console.error("📝 Status Text:", error.response.statusText);
            console.error("📄 Response Data:", JSON.stringify(error.response.data, null, 2));
            console.error("📋 Response Headers:", error.response.headers);
        } else {
            console.error("🚨 Error:", error.message);
        }
    }
}

testSabreAuth();