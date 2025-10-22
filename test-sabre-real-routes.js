const axios = require('axios');

// Test with real, popular routes that should have flights
async function testRealRoutes() {
    const baseUrl = 'http://localhost:5001/api/v1/sabre-test';

    console.log('🧪 Testing Sabre with Real Flight Routes');
    console.log('='.repeat(50));

    const testRoutes = [
        {
            name: 'New York to Los Angeles',
            origin: 'JFK',      // John F. Kennedy International
            destination: 'LAX', // Los Angeles International
            departureDate: '2025-12-01'
        },
        {
            name: 'London to Paris',
            origin: 'LHR',      // Heathrow
            destination: 'CDG', // Charles de Gaulle
            departureDate: '2025-12-01'
        },
        {
            name: 'Dubai to London',
            origin: 'DXB',      // Dubai International
            destination: 'LHR', // Heathrow
            departureDate: '2025-12-01'
        }
    ];

    for (const route of testRoutes) {
        console.log(`\n🛫 Testing: ${route.name}`);
        console.log(`   Route: ${route.origin} → ${route.destination}`);
        console.log(`   Date: ${route.departureDate}`);

        try {
            const searchData = {
                origin: route.origin,
                destination: route.destination,
                departureDate: route.departureDate,
                adults: 1,
                cabinClass: 'Economy'
            };

            const response = await axios.post(`${baseUrl}/flights/search`, searchData);

            if (response.data.success) {
                const flightCount = response.data.data?.flights?.length || 0;
                console.log(`   ✅ Success: ${flightCount} flights found`);

                if (flightCount > 0) {
                    const firstFlight = response.data.data.flights[0];
                    console.log(`   💰 Sample Price: $${firstFlight.price.total} ${firstFlight.price.currency}`);
                    console.log(`   ✈️  Carrier: ${firstFlight.validatingCarrier}`);
                }
            } else {
                console.log(`   ❌ Failed: ${response.data.message}`);
            }

        } catch (error) {
            console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📋 Test Summary:');
    console.log('   If all routes return 0 flights, the issue might be:');
    console.log('   • PseudoCityCode "XXXX" has no inventory access');
    console.log('   • Test environment has limited data');
    console.log('   • Need proper Sabre test credentials');
}

testRealRoutes();