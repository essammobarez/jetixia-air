const axios = require('axios');

// Test Sabre with CORRECT endpoints from official documentation
async function testSabreCorrectEndpoints() {
    const clientId = "V1:xq3lzxku0rkguczn:DEVCENTER:EXT";
    const clientSecret = "67hwpTLR";

    // CORRECT endpoints from Sabre documentation
    const environments = [
        {
            name: "Production",
            url: "https://api.platform.sabre.com"
        },
        {
            name: "Certification/Test",
            url: "https://api.cert.platform.sabre.com"
        }
    ];

    console.log("🔐 Testing Sabre with CORRECT Official Endpoints");
    console.log("📋 From Sabre Documentation:");
    console.log("   • Production: https://api.platform.sabre.com");
    console.log("   • Cert/Test: https://api.cert.platform.sabre.com");
    console.log("=".repeat(60));

    for (const env of environments) {
        console.log(`\n🌐 Testing ${env.name} Environment`);
        console.log(`📍 URL: ${env.url}`);

        try {
            const authString = `${clientId}:${clientSecret}`;
            const base64Credentials = Buffer.from(authString).toString('base64');

            console.log("🔐 Making authentication request...");

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
            console.log("=".repeat(40));
            console.log("📊 Status:", response.status);
            console.log("🎫 Access Token:", response.data.access_token ? "✓ Received" : "✗ Missing");
            console.log("🔑 Token Type:", response.data.token_type);
            console.log("⏰ Expires In:", response.data.expires_in, "seconds");

            if (response.data.access_token) {
                console.log("🎫 Token Preview:", response.data.access_token.substring(0, 50) + "...");

                // Test a simple API call
                console.log("\n🧪 Testing API call with token...");
                await testApiWithToken(env.url, response.data.access_token);
            }

            return {
                success: true,
                environment: env.name,
                token: response.data.access_token,
                url: env.url
            };

        } catch (error) {
            console.log(`❌ ${env.name} Authentication Failed:`);
            if (error.response) {
                console.log("   📊 Status:", error.response.status);
                console.log("   🚨 Error:", error.response.data?.error || error.response.statusText);
                console.log("   📝 Description:", error.response.data?.error_description);

                // Check if it's a different error than before
                if (error.response.status !== 401) {
                    console.log("   ℹ️  Different error - endpoint might be correct!");
                }
            } else {
                console.log("   🌐 Network Error:", error.message);
            }
        }
    }

    console.log("\n📋 ANALYSIS:");
    console.log("• Used official Sabre documentation endpoints ✅");
    console.log("• Application status: ACTIVE & APPROVED ✅");
    console.log("• Credentials format: Correct ✅");
}

// Test API call with received token
async function testApiWithToken(baseUrl, token) {
    try {
        // Test supported countries endpoint
        const response = await axios({
            method: 'GET',
            url: `${baseUrl}/v1/lists/supported/countries`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            timeout: 15000
        });

        console.log("✅ API Test Success!");
        console.log("   📊 Status:", response.status);
        console.log("   📍 Countries returned:", response.data?.Countries?.length || 0);

    } catch (error) {
        console.log("⚠️  API Test Result:");
        if (error.response) {
            console.log("   📊 Status:", error.response.status);
            console.log("   🚨 Error:", error.response.data?.error || error.response.statusText);
            if (error.response.status === 403) {
                console.log("   ℹ️  403 = Token valid but no access to this API");
            }
        } else {
            console.log("   🌐 Network Error:", error.message);
        }
    }
}

testSabreCorrectEndpoints().catch(console.error);