const axios = require('axios');

// Test Sabre v2 authentication method (User ID + Password format)
async function testSabreV2Auth() {
    // From the screenshot - these are shown as User ID and Password
    const userId = "V1:xq3lzxku0rkguczn:DEVCENTER:EXT";
    const password = "67hwpTLR";

    console.log("🔐 Testing Sabre v2 Authentication Method");
    console.log("📋 Using User ID + Password format from screenshot");
    console.log("=".repeat(60));
    console.log("👤 User ID:", userId);
    console.log("🔑 Password:", password);
    console.log("");

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

    for (const env of environments) {
        console.log(`\n🌐 Testing ${env.name} Environment`);
        console.log(`📍 URL: ${env.url}`);

        // Method 1: v2 Authentication with User ID and Password in body
        try {
            console.log("🔧 Method 1: v2 Auth with credentials in body");

            const response = await axios({
                method: 'POST',
                url: `${env.url}/v2/auth/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: new URLSearchParams({
                    'grant_type': 'client_credentials',
                    'client_id': userId,
                    'client_secret': password
                }).toString(),
                timeout: 30000
            });

            console.log(`✅ ${env.name} SUCCESS with v2 method!`);
            console.log("📊 Status:", response.status);
            console.log("🎫 Token received:", !!response.data.access_token);
            console.log("⏰ Expires in:", response.data.expires_in, "seconds");

            if (response.data.access_token) {
                console.log("🎫 Token preview:", response.data.access_token.substring(0, 50) + "...");
            }

            return { success: true, environment: env.name, token: response.data.access_token };

        } catch (error) {
            console.log(`❌ Method 1 failed for ${env.name}:`);
            if (error.response) {
                console.log("   Status:", error.response.status);
                console.log("   Error:", error.response.data?.error || error.response.statusText);
            }
        }

        // Method 2: Try with different parameter names
        try {
            console.log("🔧 Method 2: Alternative parameter format");

            const response = await axios({
                method: 'POST',
                url: `${env.url}/v2/auth/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: new URLSearchParams({
                    'grant_type': 'client_credentials',
                    'username': userId,
                    'password': password
                }).toString(),
                timeout: 30000
            });

            console.log(`✅ ${env.name} SUCCESS with alternative method!`);
            console.log("📊 Status:", response.status);
            console.log("🎫 Token received:", !!response.data.access_token);

            return { success: true, environment: env.name, token: response.data.access_token };

        } catch (error) {
            console.log(`❌ Method 2 failed for ${env.name}:`);
            if (error.response) {
                console.log("   Status:", error.response.status);
                console.log("   Error:", error.response.data?.error || error.response.statusText);
            }
        }

        // Method 3: Try the double base64 encoding method from documentation
        try {
            console.log("🔧 Method 3: Double Base64 encoding (v2 format)");

            // Step 1: Base64 encode User ID
            const encodedUserId = Buffer.from(userId).toString('base64');
            console.log("   Encoded User ID:", encodedUserId.substring(0, 30) + "...");

            // Step 2: Base64 encode Password  
            const encodedPassword = Buffer.from(password).toString('base64');
            console.log("   Encoded Password:", encodedPassword.substring(0, 20) + "...");

            // Step 3: Concatenate with colon
            const concatenated = `${encodedUserId}:${encodedPassword}`;
            console.log("   Concatenated:", concatenated.substring(0, 40) + "...");

            // Step 4: Final Base64 encoding
            const finalEncoded = Buffer.from(concatenated).toString('base64');
            console.log("   Final encoded:", finalEncoded.substring(0, 30) + "...");

            const response = await axios({
                method: 'POST',
                url: `${env.url}/v2/auth/token`,
                headers: {
                    'Authorization': `Basic ${finalEncoded}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: 'grant_type=client_credentials',
                timeout: 30000
            });

            console.log(`✅ ${env.name} SUCCESS with double encoding!`);
            console.log("📊 Status:", response.status);
            console.log("🎫 Token received:", !!response.data.access_token);

            return { success: true, environment: env.name, token: response.data.access_token };

        } catch (error) {
            console.log(`❌ Method 3 failed for ${env.name}:`);
            if (error.response) {
                console.log("   Status:", error.response.status);
                console.log("   Error:", error.response.data?.error || error.response.statusText);
            }
        }
    }

    console.log("\n📋 SUMMARY:");
    console.log("• Application Status: ACTIVE & APPROVED ✅");
    console.log("• Credentials Format: Correct ✅");
    console.log("• Authentication: Still failing ❌");
    console.log("\n🔍 Possible issues:");
    console.log("1. Credentials might need activation time (created Oct 14)");
    console.log("2. Account might need additional setup");
    console.log("3. Different endpoint might be required");
    console.log("4. Contact Sabre support for activation");
}

testSabreV2Auth().catch(console.error);