const axios = require('axios');

// Debug the exact request being sent to Sabre
async function debugSabreRequest() {
    const baseUrl = 'http://localhost:5001/api/v1/sabre-test';

    console.log('🔍 Debugging Sabre BFM v5 Request');
    console.log('='.repeat(50));

    try {
        // Make the request and capture the detailed logs
        const flightSearchData = {
            origin: 'NYC',      // Use common US airports
            destination: 'LAX',
            departureDate: '2025-12-01',
            adults: 1,
            cabinClass: 'Economy'
        };

        console.log('📋 Request Parameters:', flightSearchData);
        console.log('\n🌐 Making request to:', `${baseUrl}/flights/search`);
        console.log('⏳ Check server logs for detailed request/response...\n');

        const response = await axios.post(`${baseUrl}/flights/search`, flightSearchData);

        console.log('✅ Success Response:', response.data);

    } catch (error) {
        console.log('❌ Error Response:', error.response?.data || error.message);

        if (error.response?.data?.message?.includes('27131')) {
            console.log('\n🔍 Error Analysis:');
            console.log('   Error 27131 typically means:');
            console.log('   • Invalid PseudoCityCode (PCC)');
            console.log('   • Missing required fields');
            console.log('   • Invalid date format');
            console.log('   • Unsupported route/airport codes');
            console.log('\n💡 Possible fixes:');
            console.log('   • Use valid test PCC from Sabre');
            console.log('   • Check airport codes are valid');
            console.log('   • Verify date format');
        }
    }
}

debugSabreRequest();