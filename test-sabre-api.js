const axios = require('axios');

// Test the new Sabre API endpoints
async function testSabreAPI() {
    const baseUrl = 'http://localhost:5001/api/v1/sabre-test';

    console.log('🧪 Testing Sabre API Endpoints');
    console.log('='.repeat(50));

    try {
        // Test 1: Authentication
        console.log('\n1️⃣ Testing Authentication...');
        const authResponse = await axios.get(`${baseUrl}/auth`);
        console.log('✅ Auth Success:', authResponse.data.message);
        console.log('   Token received:', authResponse.data.data.tokenReceived);

        // Test 2: Connection Test
        console.log('\n2️⃣ Testing Connection...');
        const connectionResponse = await axios.get(`${baseUrl}/connection`);
        console.log('✅ Connection Success:', connectionResponse.data.message);
        console.log('   Countries found:', connectionResponse.data.data.apiTest.countriesCount);

        // Test 3: Get Countries
        console.log('\n3️⃣ Testing Get Countries...');
        const countriesResponse = await axios.get(`${baseUrl}/countries`);
        console.log('✅ Countries Success:', countriesResponse.data.message);
        console.log('   Total countries:', countriesResponse.data.data?.length || 0);

        // Test 4: Flight Search
        console.log('\n4️⃣ Testing Flight Search...');
        const flightSearchData = {
            origin: 'NYC',
            destination: 'LAX',
            departureDate: '2025-12-01',
            adults: 1,
            cabinClass: 'Economy'
        };

        const flightResponse = await axios.post(`${baseUrl}/flights/search`, flightSearchData);
        console.log('✅ Flight Search Success:', flightResponse.data.message);
        console.log('   Flights found:', flightResponse.data.data?.flights?.length || 0);

        console.log('\n🎉 All Sabre API tests passed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure your server is running on port 5001');
            console.log('   Run: npm run dev');
        }
    }
}

testSabreAPI();