const axios = require('axios');

// Test both production and certification environments
async function testBothEnvironments() {
    const clientId = "V1:xq3lzxku0rkguczn:DEVCENTER:EXT";
    const clientSecret = "67hwpTLR";

    const environments = [
        {
            name: "Production",
            url: "https://api.havail.sabre.com"
        },
        {
            name: "Certification/Test",
            url: "https://api-crt.cert.havail.sabre.com"
        }
    ];

    console.log("🔐 Testing Sabre Authentication - Both Environments");
    console.log("📋 Credentials Status: ACTIVE & APPROVED (from screenshot)");
    console.log("=".repeat(60));

    for (const env of environments) {
        console.log(`\n🌐 Testing ${env.name} Environment`);
        console.log(`📍 URL: ${env.url}`);

        try {
            const authString = `${clientId}:${clientSecret}`;
            const base64Credentials = Buffer.from(authString).toString('base64');

            const response = await axios({
                method: 'POST',
                url: `${env.url}/v2/auth/token`,
                headers: {
                    'Authorization': `Basic ${base64Credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: 'grant_type=client_credentials',
                timeout: 30000
            });

            console.log(`✅ ${env.name} SUCCESS!`);
            console.log("📊 Status:", response.status);
            console.log("🎫 Token received:", !!response.data.access_token);
            console.log("⏰ Expires in:", response.data.expires_in, "seconds");

            if (response.data.access_token) {
                console.log("🎫 Token preview:", response.data.access_token.substring(0, 50) + "...");

                // Test a simple API call with the token
                await testApiCall(env.url, response.data.access_token);
            }

            return { success: true, environment: env.name, token: response.data.access_token };

        } catch (error) {
            console.log(`❌ ${env.name} Failed:`);
            if (error.response) {
                console.log("   Status:", error.response.status);
                console.log("   Error:", error.response.data?.error || error.response.statusText);
                console.log("   Description:", error.response.data?.error_description);
            } else {
                console.log("   Network Error:", error.message);
            }
        }
    }
}

// Test a simple API call to verify token works
async function testApiCall(baseUrl, token) {
    console.log("🧪 Testing API call with token...");

    try {
        // Test the supported countries endpoint (simple read-only call)
        const response = await axios({
            method: 'GET',
            url: `${baseUrl}/v1/lists/supported/countries`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            timeout: 15000
        });

        console.log("✅ API Call Success! Token is working");
        console.log("📊 Countries returned:", response.data?.Countries?.length || 0);

    } catch (error) {
        console.log("⚠️  API Call failed (but token might still be valid):");
        if (error.response) {
            console.log("   Status:", error.response.status);
            console.log("   Error:", error.response.data?.error || error.response.statusText);
        }
    }
}

testBothEnvironments().catch(console.error);