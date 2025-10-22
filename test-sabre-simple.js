const axios = require('axios');

// Test simple Sabre endpoints first
async function testSimpleSabre() {
    const baseUrl = 'http://localhost:5001/api/v1/sabre-test';

    console.log('🧪 Testing Simple Sabre Endpoints First');
    console.log('='.repeat(50));

    try {
        // Test 1: Authentication (working)
        console.log('\n1️⃣ Testing Authentication...');
        const authResponse = await axios.get(`${baseUrl}/auth`);
        console.log('✅ Auth Success:', authResponse.data.message);

        // Test 2: Connection (working)
        console.log('\n2️⃣ Testing Connection...');
        const connectionResponse = await axios.get(`${baseUrl}/connection`);
        console.log('✅ Connection Success:', connectionResponse.data.message);

        // Test 3: Countries (should work)
        console.log('\n3️⃣ Testing Countries...');
        const countriesResponse = await axios.get(`${baseUrl}/countries`);
        console.log('✅ Countries Result:', countriesResponse.data.message);
        console.log('   Countries found:', countriesResponse.data.data?.length || 0);

        console.log('\n📋 Basic endpoints working! Now let\'s debug BFM v5...');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);
    }
}

testSimpleSabre();