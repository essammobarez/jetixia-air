const axios = require('axios');

// Test Sabre credentials directly
async function testSabreAuth() {
    const clientId = 'V1:xq3lzxku0rkguczn:DEVCENTER:EXT';
    const clientSecret = '67hwpTLR';
    const baseUrl = 'https://api-crt.cert.havail.sabre.com';

    console.log('🧪 Testing Sabre Authentication...');
    console.log('📍 Base URL:', baseUrl);
    console.log('🔑 Client ID:', clientId);
    console.log('🔑 Client Secret:', clientSecret);

    // Method 1: Basic Auth with URLSearchParams
    try {
        console.log('\n🔐 Method 1: Basic Auth with URLSearchParams');
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        console.log('🔐 Encoded credentials:', credentials.substring(0, 20) + '...');

        const requestData = new URLSearchParams();
        requestData.append('grant_type', 'client_credentials');

        const response = await axios.post(
            `${baseUrl}/v2/auth/token`,
            requestData,
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            }
        );

        console.log('✅ Method 1 SUCCESS!');
        console.log('📊 Response:', {
            status: response.status,
            tokenReceived: !!response.data.access_token,
            expiresIn: response.data.expires_in
        });
        return;

    } catch (error) {
        console.log('❌ Method 1 failed:', error.response?.status, error.response?.data);
    }

    // Method 2: Form string
    try {
        console.log('\n🔐 Method 2: Basic Auth with form string');
        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const response = await axios.post(
            `${baseUrl}/v2/auth/token`,
            'grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            }
        );

        console.log('✅ Method 2 SUCCESS!');
        console.log('📊 Response:', {
            status: response.status,
            tokenReceived: !!response.data.access_token,
            expiresIn: response.data.expires_in
        });
        return;

    } catch (error) {
        console.log('❌ Method 2 failed:', error.response?.status, error.response?.data);
    }

    // Method 3: JSON body
    try {
        console.log('\n🔐 Method 3: JSON body with credentials');

        const response = await axios.post(
            `${baseUrl}/v2/auth/token`,
            {
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                timeout: 30000,
            }
        );

        console.log('✅ Method 3 SUCCESS!');
        console.log('📊 Response:', {
            status: response.status,
            tokenReceived: !!response.data.access_token,
            expiresIn: response.data.expires_in
        });
        return;

    } catch (error) {
        console.log('❌ Method 3 failed:', error.response?.status, error.response?.data);
    }

    console.log('\n❌ All authentication methods failed!');
    console.log('🔍 Please check:');
    console.log('   - Credentials are correct');
    console.log('   - Credentials are active');
    console.log('   - Network connectivity');
    console.log('   - Sabre API endpoint is correct');
}

testSabreAuth().catch(console.error);