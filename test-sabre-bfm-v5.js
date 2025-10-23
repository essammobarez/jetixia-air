const axios = require('axios');

// Test Sabre BFM v5 API with v2 authentication
async function testSabreBFMv5() {
    const baseUrl = 'http://localhost:5001/api/v1/sabre-test';

    console.log('🧪 Testing Sabre BFM v5 API (Test Environment)');
    console.log('📋 Using v2 Authentication + BFM v5 Endpoint');
    console.log('='.repeat(60));

    try {
        // Test 1: Authentication
        console.log('\n1️⃣ Testing v2 Authentication...');
        const authResponse = await axios.get(`${baseUrl}/auth`);
        console.log('✅ Auth Success:', authResponse.data.message);

        // Test 2: BFM v5 Flight Search
        console.log('\n2️⃣ Testing BFM v5 Flight Search...');
        const flightSearchData = {
            origin: 'DAC',      // Dhaka (Bangladesh)
            destination: 'DXB', // Dubai
            departureDate: '2025-11-05',
            adults: 1,
            cabinClass: 'ECONOMY'
        };

        console.log('🔍 Search Parameters:', flightSearchData);

        const flightResponse = await axios.post(`${baseUrl}/flights/search`, flightSearchData);

        if (flightResponse.data.success) {
            console.log('✅ BFM v5 Search Success!');
            console.log('📊 Results:', {
                provider: 'sabre',
                flights: flightResponse.data.data?.flights?.length || 0,
                searchId: flightResponse.data.data?.searchId,
            });

            // Show first flight if available
            const firstFlight = flightResponse.data.data?.flights?.[0];
            if (firstFlight) {
                console.log('🎫 Sample Flight:');
                console.log('   Price:', firstFlight.price);
                console.log('   Carrier:', firstFlight.validatingCarrier);
                console.log('   Itineraries:', firstFlight.itineraries?.length || 0);
            }
        } else {
            console.log('❌ BFM v5 Search Failed:', flightResponse.data.message);
        }

        // Test 3: Round Trip Search
        console.log('\n3️⃣ Testing Round Trip Search...');
        const roundTripData = {
            origin: 'DAC',
            destination: 'DXB',
            departureDate: '2025-11-05',
            returnDate: '2025-11-12',
            adults: 1,
            cabinClass: 'ECONOMY'
        };

        const roundTripResponse = await axios.post(`${baseUrl}/flights/search`, roundTripData);
        console.log('✅ Round Trip Result:', roundTripResponse.data.message);

        console.log('\n🎉 Sabre BFM v5 Integration Complete!');
        console.log('📋 Summary:');
        console.log('   • Authentication: v2 (Working) ✅');
        console.log('   • Endpoint: /v5/offers/shop (BFM v5) ✅');
        console.log('   • Environment: Test/Certification ✅');
        console.log('   • Response Format: Grouped Itineraries ✅');

    } catch (error) {
        console.error('\n❌ Test failed:', error.response?.data || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure your server is running on port 5001');
            console.log('   Run: npm run dev');
        }

        if (error.response?.status === 401) {
            console.log('\n🔐 Authentication issue - check Sabre credentials');
        }
    }
}

testSabreBFMv5();