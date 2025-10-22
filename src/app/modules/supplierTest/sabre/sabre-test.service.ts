import axios from "axios";
import config from "../../../config";

// Sabre Test Service - Verify credentials and connection
export class SabreTestService {
  private static tokenCache: { token: string; expiresAt: number } | null = null;

  /**
   * Get Sabre OAuth 2.0 Access Token (v2 Double Base64 Encoding Method)
   */
  static async getSabreToken(): Promise<string> {
    // Check cache first
    if (
      this.tokenCache &&
      this.tokenCache.expiresAt > Date.now() + 60000 // 1 min buffer
    ) {
      console.log("✅ Using cached Sabre token");
      return this.tokenCache.token;
    }

    try {
      const clientId = config.sabre.clientId;
      const clientSecret = config.sabre.clientSecret;
      const baseUrl = config.sabre.baseUrl;

      console.log("🔐 Requesting Sabre access token (v2 method)...");
      console.log("📍 Client ID:", clientId);
      console.log("📍 Base URL:", baseUrl);

      // v2 Double Base64 encoding method (WORKING METHOD)
      // Step 1: Base64 encode User ID
      const encodedUserId = Buffer.from(clientId).toString("base64");

      // Step 2: Base64 encode Password  
      const encodedPassword = Buffer.from(clientSecret).toString("base64");

      // Step 3: Concatenate with colon
      const concatenated = `${encodedUserId}:${encodedPassword}`;

      // Step 4: Final Base64 encoding
      const finalEncoded = Buffer.from(concatenated).toString("base64");

      const response = await axios.post(
        `${baseUrl}/v2/auth/token`,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${finalEncoded}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, expires_in } = response.data;

      // Cache the token
      this.tokenCache = {
        token: access_token,
        expiresAt: Date.now() + expires_in * 1000,
      };

      console.log("✅ Sabre token obtained successfully!");
      console.log("⏱️  Expires in:", expires_in, "seconds");

      return access_token;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Sabre Auth Error:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            headers: error.config?.headers,
          },
        });

        throw new Error(
          `Sabre Authentication Failed: ${error.response?.data?.error_description || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Test Sabre API with a simple call
   */
  static async testConnection() {
    try {
      const token = await this.getSabreToken();
      const baseUrl = config.sabre.baseUrl;

      console.log("🧪 Testing Sabre API connection...");

      // Test with a simple utility endpoint
      const response = await axios.get(
        `${baseUrl}/v1/lists/utilities/countries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Sabre API test successful!");

      return {
        success: true,
        message: "Sabre connection successful! ✅",
        data: {
          authentication: {
            status: "Connected",
            baseUrl: baseUrl,
            clientId: config.sabre.clientId,
          },
          testCall: {
            endpoint: "/v1/lists/utilities/countries",
            status: response.status,
            countriesCount: response.data.Countries?.length || 0,
            sampleCountries:
              response.data.Countries?.slice(0, 3).map(
                (c: { CountryCode: string; CountryName: string }) => ({
                  code: c.CountryCode,
                  name: c.CountryName,
                })
              ) || [],
          },
        },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Sabre test failed:", error.response?.data);

        return {
          success: false,
          message: "Sabre connection failed ❌",
          error: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.error_description || error.message,
            details: error.response?.data,
          },
        };
      }

      const err = error as { message?: string };
      return {
        success: false,
        message: "Sabre connection failed ❌",
        error: {
          message: err.message || "Unknown error",
        },
      };
    }
  }
}
