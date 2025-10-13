import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const AMADEUS_BASE_URL = "https://test.api.amadeus.com";

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

/**
 * Fetch Amadeus OAuth2 access token
 * Step 0: Authorization - https://test.api.amadeus.com/v1/security/oauth2/token
 */
async function fetchAmadeusAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Amadeus credentials not configured. Please set AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env file"
      );
    }

    const tokenUrl = `${AMADEUS_BASE_URL}/v1/security/oauth2/token`;
    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");
    data.append("client_id", clientId);
    data.append("client_secret", clientSecret);

    // Request Amadeus access token

    const response = await axios.post(tokenUrl, data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const result = response.data;
    accessToken = result.access_token;
    const expiresIn = result.expires_in || 1799; // Default 30 minutes
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    // Amadeus access token fetched successfully

    return accessToken;
  } catch (error: unknown) {
    const err = error as {
      response?: { status: number; data: unknown };
      request?: unknown;
      message?: string;
    };
    // Error fetching Amadeus access token
    if (err.response) {
      // Log error response details
    } else if (err.request) {
      // No response received from Amadeus API
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to authenticate with Amadeus API"
    );
  }
}

/**
 * Get Amadeus access token with auto-refresh
 * Implements token caching and automatic refresh when expired
 */
export async function getAmadeusAccessToken(): Promise<string> {
  // Check if token exists and is still valid
  if (!accessToken || !tokenExpiresAt || Date.now() >= tokenExpiresAt - 60000) {
    // Refresh token if expired or expiring in less than 1 minute
    if (!refreshTokenPromise) {
      refreshTokenPromise = fetchAmadeusAccessToken().finally(() => {
        refreshTokenPromise = null;
      });
    }
    const token = await refreshTokenPromise;
    if (!token) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to obtain Amadeus access token"
      );
    }
    return token;
  }

  return accessToken;
}

/**
 * Get Amadeus API base URL
 */
export function getAmadeusBaseUrl(): string {
  return AMADEUS_BASE_URL;
}
