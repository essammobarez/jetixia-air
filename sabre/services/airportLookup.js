const sabreClient = require('../utils/sabreClient');

class AirportLookup {

    // Get supported countries
    async getSupportedCountries() {
        try {
            const response = await sabreClient.get('/v1/lists/supported/countries');
            return response.Countries || [];
        } catch (error) {
            console.error('❌ Failed to get supported countries:', error.message);
            throw error;
        }
    }

    // Get cities by country code
    async getCitiesByCountry(countryCode) {
        try {
            const response = await sabreClient.get(`/v1/lists/supported/cities/${countryCode}`);
            return response.Cities || [];
        } catch (error) {
            console.error(`❌ Failed to get cities for ${countryCode}:`, error.message);
            throw error;
        }
    }

    // Search airports by city code
    async getAirportsByCity(cityCode) {
        try {
            const response = await sabreClient.get(`/v1/lists/supported/pointofsalecountries/${cityCode}`);
            return response;
        } catch (error) {
            console.error(`❌ Failed to get airports for ${cityCode}:`, error.message);
            throw error;
        }
    }

    // Get supported destinations from origin
    async getSupportedDestinations(origin) {
        try {
            const response = await sabreClient.get('/v1/lists/supported/shop/flights/origins-destinations', {
                origin: origin
            });
            return response.Destinations || [];
        } catch (error) {
            console.error(`❌ Failed to get destinations from ${origin}:`, error.message);
            throw error;
        }
    }
}

module.exports = new AirportLookup();