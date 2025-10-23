import axios from "axios";
import config from "../../../config";

export class SabreLegacyService {
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
      return this.tokenCache.token;
    }

    try {
      const clientId = config.sabre.clientId;
      const clientSecret = config.sabre.clientSecret;
      const baseUrl = config.sabre.baseUrl;

      if (!clientId || !clientSecret) {
        throw new Error("Sabre credentials not configured. Please check SABRE_CLIENT_ID and SABRE_CLIENT_SECRET in environment variables.");
      }

      // v2 Double Base64 encoding method (WORKING METHOD)
      const encodedUserId = Buffer.from(clientId).toString("base64");
      const encodedPassword = Buffer.from(clientSecret).toString("base64");
      const concatenated = `${encodedUserId}:${encodedPassword}`;
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

      return access_token;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Sabre Authentication Failed: ${
            error.response?.data?.error_description || error.message
          }`
        );
      }
      throw error;
    }
  }

  /**
   * Test Legacy BargainFinderMax (older version)
   */
  static async testLegacyBFM(searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    adults: number;
  }) {
    try {
      const token = await this.getSabreToken();
      const baseUrl = config.sabre.baseUrl;
      const { origin, destination, departureDate, adults } = searchParams;

      // Try older BargainFinderMax format
      const requestData = {
        OTA_AirLowFareSearchRQ: {
          Target: "Test",
          Version: "1",
          OriginDestinationInformation: [
            {
              DepartureDateTime: departureDate,
              OriginLocation: { LocationCode: origin },
              DestinationLocation: { LocationCode: destination },
            },
          ],
          TravelPreferences: {
            CabinPref: [{ Cabin: "Economy" }],
          },
          TravelerInfoSummary: {
            AirTravelerAvail: [
              {
                PassengerTypeQuantity: [
                  { Code: "ADT", Quantity: adults },
                ],
              },
            ],
          },
        },
      };

      console.log("🧪 Testing Legacy BFM:");
      console.log("   URL:", `${baseUrl}/v1/shop/flights`);
      console.log("   Request:", JSON.stringify(requestData, null, 2));

      const response = await axios({
        method: 'POST',
        url: `${baseUrl}/v1/shop/flights`,
        data: requestData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("✅ Legacy BFM Success!");
      console.log("📄 Response:", JSON.stringify(response.data, null, 2));

      return {
        success: true,
        data: response.data,
      };

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error("❌ Legacy BFM Error:");
        console.error(