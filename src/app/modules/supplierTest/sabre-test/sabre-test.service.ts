import axios from "axios";
import config from "../../../config";

// Sabre Test Service - Quick credential verification
export class SabreTestService {
  private static tokenCache: { token: string; expiresAt: number } | null = null;

  /**
   * Get Sabre OAuth 2.0 Access Token
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

      // Validate credentials
      if (!clientId || !clientSecret) {
        throw new Error(
          "Sabre credentials not configured. Please set SABRE_CLIENT_ID and SABRE_CLIENT_SECRET in your .env file"
        );
      }

      console.log("🔐 Requesting new Sabre token...");
      console.log("📍 Base URL:", baseUrl);
      console.log("🔑 Client ID:", clientId);
      console.log("🔑 Client Secret:", clientSecret ? `${clientSecret.substring(0, 4)}****` : 'NOT SET');

      // Debug: Check if credentials are properly loaded
      console.log("🔍 Raw config values:", {
        clientId: config.sabre.clientId,
        clientSecret: config.sabre.clientSecret ? 'SET' : 'NOT SET',
        baseUrl: config.sabre.baseUrl
      });

      // Sabre Authentication - Try multiple credential formats
      console.log("🔐 Trying Sabre authentication methods...");

      // Method 1: Use provided Client ID/Secret (current format)
      try {
        console.log("🔑 Method 1: Using provided Client ID/Secret");
        console.log("   Client ID:", clientId);
        console.log("   Secret:", clientSecret ? `${clientSecret.substring(0, 4)}****` : 'NOT SET');

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

        console.log("✅ Method 1 successful!");
        return this.handleTokenResponse(response);

      } catch (error1) {
        console.log("❌ Method 1 failed, trying Method 2...");

        // Method 2: Generate Client ID from username components
        try {
          console.log("🔑 Method 2: Generating Client ID from username");

          // Extract username from current Client ID format
          const parts = clientId.split(':');
          if (parts.length >= 4) {
            const username = parts[1]; // xq3lzxku0rkguczn
            const organization = parts[2]; // DEVCENTER
            const domain = parts[3]; // EXT

            const generatedClientId = `V1:${username}:${organization}:${domain}`;
            const generatedSecret = clientSecret; // Password remains same

            console.log("   Generated Client ID:", generatedClientId);
            console.log("   Using Secret:", generatedSecret ? `${generatedSecret.substring(0, 4)}****` : 'NOT SET');

            const credentials = Buffer.from(`${generatedClientId}:${generatedSecret}`).toString('base64');

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

            console.log("✅ Method 2 successful!");
            return this.handleTokenResponse(response);
          } else {
            throw new Error("Invalid Client ID format for generation");
          }

        } catch (error2) {
          console.log("❌ Method 2 failed, trying Method 3...");

          // Method 3: Try direct username/password (some Sabre endpoints accept this)
          try {
            console.log("🔑 Method 3: Direct username/password");

            const parts = clientId.split(':');
            const username = parts[1] || clientId; // fallback to full clientId
            const password = clientSecret;

            console.log("   Username:", username);
            console.log("   Password:", password ? `${password.substring(0, 4)}****` : 'NOT SET');

            const credentials = Buffer.from(`${username}:${password}`).toString('base64');

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

            console.log("✅ Method 3 successful!");
            return this.handleTokenResponse(response);

          } catch (error3) {
            // All methods failed
            console.log("❌ All authentication methods failed");

            // Throw the most informative error
            if (axios.isAxiosError(error1)) {
              console.error("🔍 Error details from Method 1:", {
                status: error1.response?.status,
                data: error1.response?.data,
                headers: error1.response?.headers
              });
              throw error1;
            }
            throw error1;
          }
        }
      }

      // This should not be reached due to the new method structure
      throw new Error("All authentication methods failed");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Sabre Auth Error Details:", {
          status: error.response?.status,
          statusText: error.response?.statusText,
          headers: error.response?.headers,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });

        // More detailed error message
        const errorMessage = error.response?.data?.error_description
          || error.response?.data?.message
          || error.response?.statusText
          || error.message;

        throw new Error(`Sabre Authentication Failed: ${errorMessage}`);
      }

      console.error("❌ Non-Axios Error:", error);
      throw error;
    }
  }

  /**
   * Handle token response from any authentication method
   */
  private static handleTokenResponse(response: any): string {
    const { access_token, expires_in } = response.data;

    // Cache the token
    this.tokenCache = {
      token: access_token,
      expiresAt: Date.now() + expires_in * 1000,
    };

    console.log("✅ Sabre token obtained successfully");
    console.log("⏱️  Expires in:", expires_in, "seconds");

    return access_token;
  }

  /**
   * Test Sabre Connection with a simple API call
   */
  static async testConnection() {
    try {
      const token = await this.getSabreToken();

      console.log("🧪 Testing Sabre API with Utilities/Supported Countries...");

      const baseUrl = config.sabre.baseUrl;

      // Simple test call - Get supported countries
      const response = await axios.get(
        `${baseUrl}/v1/lists/utilities/countries`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Sabre API call successful!");
      console.log(
        "📊 Countries retrieved:",
        response.data.Countries?.length || 0
      );

      return {
        success: true,
        message: "Sabre connection successful! ✅",
        authentication: {
          status: "Connected",
          tokenObtained: true,
          baseUrl: baseUrl,
        },
        testApiCall: {
          endpoint: "/v1/lists/utilities/countries",
          status: response.status,
          countriesCount: response.data.Countries?.length || 0,
          sampleCountries: response.data.Countries?.slice(0, 5) || [],
        },
        credentials: {
          clientId: config.sabre.clientId,
          environment: baseUrl.includes("cert")
            ? "Certification (Test)"
            : "Production",
        },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Sabre Test Failed:", {
          status: error.response?.status,
          data: error.response?.data,
        });

        return {
          success: false,
          message: "Sabre connection failed ❌",
          error: {
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.response?.data?.error_description || error.message,
            details: error.response?.data,
          },
          credentials: {
            clientId: config.sabre.clientId,
            baseUrl: config.sabre.baseUrl,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Test flight search (quick check)
   */
  static async testFlightSearch() {
    try {
      const token = await this.getSabreToken();
      const baseUrl = config.sabre.baseUrl;

      console.log("✈️  Testing Sabre Flight Search...");

      // Simple one-way search
      const searchRequest = {
        OTA_AirLowFareSearchRQ: {
          Version: "4",
          POS: {
            Source: [
              {
                PseudoCityCode: "F9CE",
                RequestorID: {
                  Type: "1",
                  ID: "1",
                  CompanyName: {
                    Code: "TN",
                  },
                },
              },
            ],
          },
          OriginDestinationInformation: [
            {
              RPH: "1",
              DepartureDateTime: "2025-11-15T00:00:00",
              OriginLocation: {
                LocationCode: "JFK",
              },
              DestinationLocation: {
                LocationCode: "LAX",
              },
            },
          ],
          TravelPreferences: {
            TPA_Extensions: {
              NumTrips: {
                Number: 10,
              },
            },
          },
          TravelerInfoSummary: {
            AirTravelerAvail: [
              {
                PassengerTypeQuantity: [
                  {
                    Code: "ADT",
                    Quantity: 1,
                  },
                ],
              },
            ],
          },
        },
      };

      const response = await axios.post(
        `${baseUrl}/v4/offers/shop`,
        searchRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const flightCount =
        response.data?.OTA_AirLowFareSearchRS?.PricedItineraries
          ?.PricedItinerary?.length || 0;

      console.log("✅ Flight search successful!");
      console.log("✈️  Flights found:", flightCount);

      return {
        success: true,
        message: "Sabre flight search successful! ✅",
        searchRequest: {
          route: "JFK → LAX",
          date: "2025-11-15",
          passengers: 1,
        },
        results: {
          flightsFound: flightCount,
          sampleFlight:
            response.data?.OTA_AirLowFareSearchRS?.PricedItineraries
              ?.PricedItinerary?.[0] || null,
        },
      };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Sabre Flight Search Failed:", {
          status: error.response?.status,
          data: error.response?.data,
        });

        return {
          success: false,
          message: "Sabre flight search failed ❌",
          error: {
            status: error.response?.status,
            message:
              error.response?.data?.Errors?.[0]?.ErrorMessage || error.message,
            details: error.response?.data,
          },
        };
      }

      throw error;
    }
  }
}
