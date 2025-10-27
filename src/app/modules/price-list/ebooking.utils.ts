import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import {
  EbookingAuthRequest,
  EbookingAuthResponse,
} from "./ebooking.interface";

const EBOOKING_BASE_URL = "https://www.ebookingcenter.com";
// Correct token endpoint (found through testing)
const EBOOKING_TOKEN_URL = `${EBOOKING_BASE_URL}/tbs/reseller/oauth2/token`;

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

/**
 * Fetch ebooking OAuth2 access token
 * Step 1: Authorization - https://www.ebookingcenter.com/tbs/reseller/api/oauth2/token
 */
async function fetchEbookingAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.EBOOKING_CLIENT_ID;
    const clientSecret = process.env.EBOOKING_CLIENT_SECRET;
    const requestedScopes =
      process.env.EBOOKING_REQUESTED_SCOPES ||
      "read:flights-search write:flights-book";

    if (!clientId || !clientSecret) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "ebooking credentials not configured. Please set EBOOKING_CLIENT_ID and EBOOKING_CLIENT_SECRET in .env file"
      );
    }

    const authRequest: EbookingAuthRequest = {
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: requestedScopes,
    };

    // Convert to URL-encoded format
    const data = new URLSearchParams();
    data.append("grant_type", authRequest.grant_type);
    data.append("client_id", authRequest.client_id);
    data.append("client_secret", authRequest.client_secret);
    data.append("scope", authRequest.scope);

    console.log("🔐 Fetching ebooking access token...");
    console.log("📋 Token URL:", EBOOKING_TOKEN_URL);

    const response = await axios.post(EBOOKING_TOKEN_URL, data.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    });

    const result: EbookingAuthResponse = response.data;
    accessToken = result.access_token;
    const expiresIn = result.expires_in || 86400; // Default 24 hours
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log("✅ ebooking access token fetched successfully");
    console.log(`⏰ Token expires in ${Math.round(expiresIn / 3600)} hours`);

    return accessToken;
  } catch (error: unknown) {
    const err = error as {
      response?: { status: number; data: unknown };
      request?: unknown;
      message?: string;
    };

    console.error("❌ Error fetching ebooking access token:", err);

    if (err.response) {
      console.error("Response error:", err.response.status, err.response.data);
    } else if (err.request) {
      console.error("No response received from ebooking API");
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to authenticate with ebooking API"
    );
  }
}

/**
 * Get ebooking access token with auto-refresh
 * Implements token caching and automatic refresh when expired
 */
export const getEbookingAccessToken = async (): Promise<string> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt - 60000) {
    // Token is valid and not expiring in the next minute
    return accessToken;
  }

  // If there's already a refresh in progress, wait for it
  if (refreshTokenPromise) {
    const token = await refreshTokenPromise;
    if (token) {
      return token;
    }
  }

  // Start a new refresh
  refreshTokenPromise = fetchEbookingAccessToken();

  try {
    const token = await refreshTokenPromise;
    refreshTokenPromise = null;

    if (!token) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to get ebooking access token"
      );
    }

    return token;
  } catch (error) {
    refreshTokenPromise = null;
    throw error;
  }
};

/**
 * Get ebooking base URL
 */
export const getEbookingBaseUrl = (): string => {
  return EBOOKING_BASE_URL;
};

/**
 * Clear ebooking token cache (useful for testing)
 */
export const clearEbookingTokenCache = (): void => {
  accessToken = null;
  tokenExpiresAt = null;
  refreshTokenPromise = null;
};
