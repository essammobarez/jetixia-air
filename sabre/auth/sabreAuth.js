const axios = require('axios');

class SabreAuth {
    constructor() {
        this.clientId = process.env.SABRE_CLIENT_ID;
        this.clientSecret = process.env.SABRE_CLIENT_SECRET;
        this.baseUrl = process.env.SABRE_BASE_URL;
        this.token = null;
        this.tokenExpiry = null;
    }

    // Double Base64 encoding method (v2 format that works)
    encodeCredentials() {
        // Step 1: Base64 encode User ID
        const encodedUserId = Buffer.from(this.clientId).toString('base64');

        // Step 2: Base64 encode Password  
        const encodedPassword = Buffer.from(this.clientSecret).toString('base64');

        // Step 3: Concatenate with colon
        const concatenated = `${encodedUserId}:${encodedPassword}`;

        // Step 4: Final Base64 encoding
        const finalEncoded = Buffer.from(concatenated).toString('base64');

        return finalEncoded;
    }

    async getToken() {
        // Return existing token if still valid
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        try {
            const credentials = this.encodeCredentials();

            const response = await axios({
                method: 'POST',
                url: `${this.baseUrl}/v2/auth/token`,
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                data: 'grant_type=client_credentials',
                timeout: 30000
            });

            this.token = response.data.access_token;
            // Set expiry 5 minutes before actual expiry for safety
            this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

            console.log('✅ Sabre token obtained successfully');
            return this.token;

        } catch (error) {
            console.error('❌ Sabre authentication failed:', error.response?.data || error.message);
            throw new Error(`Sabre authentication failed: ${error.response?.data?.error_description || error.message}`);
        }
    }

    async refreshToken() {
        this.token = null;
        this.tokenExpiry = null;
        return await this.getToken();
    }

    isTokenValid() {
        return this.token && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }
}

module.exports = new SabreAuth();