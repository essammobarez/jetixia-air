const axios = require('axios');
const sabreAuth = require('../auth/sabreAuth');

class SabreClient {
    constructor() {
        this.baseUrl = process.env.SABRE_BASE_URL;
        this.maxRetries = 3;
    }

    async makeRequest(config, retryCount = 0) {
        try {
            // Get valid token
            const token = await sabreAuth.getToken();

            // Prepare request config
            const requestConfig = {
                ...config,
                baseURL: this.baseUrl,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...config.headers
                },
                timeout: 30000
            };

            const response = await axios(requestConfig);
            return response.data;

        } catch (error) {
            // Handle token expiry
            if (error.response?.status === 401 && retryCount < this.maxRetries) {
                console.log('🔄 Token expired, refreshing...');
                await sabreAuth.refreshToken();
                return this.makeRequest(config, retryCount + 1);
            }

            // Handle rate limiting
            if (error.response?.status === 429 && retryCount < this.maxRetries) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`⏳ Rate limited, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.makeRequest(config, retryCount + 1);
            }

            console.error('❌ Sabre API request failed:', error.response?.data || error.message);
            throw error;
        }
    }

    // GET request
    async get(url, params = {}) {
        return this.makeRequest({
            method: 'GET',
            url,
            params
        });
    }

    // POST request
    async post(url, data = {}) {
        return this.makeRequest({
            method: 'POST',
            url,
            data
        });
    }
}

module.exports = new SabreClient();