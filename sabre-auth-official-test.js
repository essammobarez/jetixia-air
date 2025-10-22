const axios = require('axios');

// Official Sabre Authentication Test based on documentation
async function testSabreAuthOfficial() {
    // Your credentials from .env
    const clientId = "V1:xq3lzxku0rkguczn:DEVCENTER:EXT";
    const clientSecret = "67hwpTLR";
    const baseUrl = "https://api-crt.cert.havail.sabre.com";

    console.log("🔐 Official Sabre Authentication Test");
    console.log("📋 Based on Sabre REST API Token Credentials Documentation");
    console.log("=".repeat(60));

    console.log("📍 Environment: Test/Certification");
    console.log("🌐 Base URL:", baseUrl);
    console.log("🔑 Client ID:", clientId);
    console.log("🔑 Client Secret:", clientSecret);
    console.log("");

    // Step 1: Build clientId:clientSecret pair
    const authString = `${clientId}:${clientSecret}`;
    console.log("🔧 Step 1: Built auth string:", authString.substring(0, 30) + "...");

    // Step 2: Base64 encode the pair
    const base64Credentials = Buffer.from(authString).toString('base64');
    console.log("🔐 Step 2: Base64 encoded:", base64Credentials.substring(0, 30) + "...");

    // Step 3: Make the token request
    console.log("🌐 Step 3: Making token request...");

    try {
        const response = await axios({
            method: 'POST',
            url: `${baseUrl}/v2/auth/token`,
            headers: {
                'Authorization': `Basic ${base64Credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            data: 'grant_type=client_credentials',
            timeout: 30000
        });

        console.log("✅ SUCCESS! Authentication working!");
        console.log("=".repeat(60));
        console.log("📊 Response Status:", response.status);
        console.log("🎫 Access Token:", response.data.access_token ? "✓ Received" : "✗ Missing");
        console.log("⏱️  Token Type:", response.data.token_type);
        console.log("⏰ Expires In:", response.data.expires_in, "seconds");
        console.log("🔄 Refresh Token:", response.data.refresh_token ? "✓ Available" : "✗ Not provided");

        if (response.data.access_token) {
            console.log("🎫 Token Preview:", response.data.access_token.substring(0, 50) + "...");
        }

        return {
            success: true,
            token: response.data.access_token,
            expiresIn: response.data.expires_in
        };

    } catch (error) {
        console.log("❌ AUTHENTICATION FAILED!");
        console.log("=".repeat(60));

        if (error.response) {
            console.log("📊 HTTP Status:", error.response.status);
            console.log("📝 Status Text:", error.response.statusText);
            console.log("📄 Error Response:", JSON.stringify(error.response.data, null, 2));

            // Specific error analysis
            if (error.response.status === 401) {
                console.log("\n🔍 DIAGNOSIS: 401 Unauthorized");
                console.log("   Possible causes:");
                console.log("   • Invalid Client ID or Client Secret");
                console.log("   • Credentials expired or deactivated");
                console.log("   • Wrong environment (test vs production)");
                console.log("   • Account not properly configured");
            }

            if (error.response.data?.error === 'invalid_client') {
                console.log("\n🚨 SPECIFIC ERROR: invalid_client");
                console.log("   This typically means:");
                console.log("   • Client ID format is incorrect");
                console.log("   • Client Secret is wrong");
                console.log("   • Credentials are not active in Sabre system");
            }

        } else if (error.request) {
            console.log("🌐 Network Error:", error.message);
            console.log("   Check your internet connection and firewall settings");
        } else {
            console.log("🚨 Unexpected Error:", error.message);
        }

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Test with alternative endpoints if main fails
async function testAlternativeEndpoints() {
    console.log("\n🔄 Testing Alternative Sabre Endpoints...");

    const endpoints = [
        "https://api-crt.cert.havail.sabre.com/v2/auth/token",
        "https://api.cert.sabre.com/v2/auth/token",
        "https://api-crt.cert.sabre.com/v2/auth/token"
    ];

    for (const endpoint of endpoints) {
        console.log(`\n🌐 Testing: ${endpoint}`);
        try {
            const response = await axios.get(endpoint, { timeout: 5000 });
            console.log(`✅ Endpoint reachable: ${response.status}`);
        } catch (error) {
            if (error.response) {
                console.log(`📊 Endpoint responds: ${error.response.status} (${error.response.statusText})`);
            } else {
                console.log(`❌ Endpoint unreachable: ${error.message}`);
            }
        }
    }
}

// Main execution
async function main() {
    const result = await testSabreAuthOfficial();

    if (!result.success) {
        await testAlternativeEndpoints();

        console.log("\n📋 NEXT STEPS:");
        console.log("1. Verify credentials with your Sabre account manager");
        console.log("2. Check if credentials are active in Sabre developer portal");
        console.log("3. Confirm you're using the correct environment");
        console.log("4. Try regenerating credentials if available");
    }
}

main().catch(console.error);