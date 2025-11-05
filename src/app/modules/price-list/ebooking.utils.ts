import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { EbookingAuthResponse } from "./ebooking.interface";
import SupplierConnectionModel from "../supplierConnections/supplierConnection.model";

// 🧠 Cache object to store tokens by supplier-wholesaler pair
const tokenCache = new Map<
  string,
  { accessToken: string | null; tokenExpiresAt: number | null; refreshPromise: Promise<string | null> | null }
>();

/**
 * Fetch ebooking OAuth2 access token dynamically from DB credentials
 */
async function fetchEbookingAccessToken(
  supplierId?: string,
  wholesalerId?: string
): Promise<string | null> {
  try {
    const supplierCredentials = await SupplierConnectionModel.findOne({
      supplier: supplierId,
      wholesaler: wholesalerId,
      active: true,
      valid: true,
    });
console.log("creds",supplierCredentials)
    console.log("🔑 supplierCredentials:", supplierCredentials?.credentials);

    if (
      !supplierCredentials?.credentials?.client_id ||
      !supplierCredentials?.credentials?.client_secret ||
      !process.env.EBOOKING_TOKEN_URL ||
      !supplierCredentials?.credentials?.scope
    ) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Required credentials are missing for ebooking supplier connection."
      );
    }

    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");
    data.append("client_id", String(supplierCredentials.credentials.client_id));
    data.append("client_secret", String(supplierCredentials.credentials.client_secret));
    data.append("scope", String(supplierCredentials.credentials.scope));

    console.log("📤 EBOOKING_TOKEN_URL:", process.env.EBOOKING_TOKEN_URL);
    console.log("🧠 Request Body:", data.toString());

    const response = await axios.post(
      process.env.EBOOKING_TOKEN_URL,
      data.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    console.log("=== 📥 Raw Response Start ===");
    console.log("Status Code:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("=== 📥 Raw Response End ===");

    const result: EbookingAuthResponse = response.data;
    const expiresIn = result.expires_in || 86400;
    const tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log("✅ Token fetched successfully for:", supplierId, wholesalerId);

    // 🧠 Cache token per supplier-wholesaler pair
    const key = `${supplierId}-${wholesalerId}`;
    tokenCache.set(key, {
      accessToken: result.access_token,
      tokenExpiresAt,
      refreshPromise: null,
    });

    return result.access_token;
  } catch (error: any) {
    console.error("=== ❌ Error fetching token ===");
    if (error.response) {
      console.error("Error Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to authenticate with ebooking API"
    );
  }
}

/**
 * Get ebooking access token (auto refresh when expired)
 */
export async function getEbookingAccessToken(
  supplierId?: string,
  wholesalerId?: string
): Promise<string> {
  const key = `${supplierId}-${wholesalerId}`;
  let cache = tokenCache.get(key);

  if (!cache || !cache.accessToken || !cache.tokenExpiresAt || Date.now() >= cache.tokenExpiresAt - 60000) {
    if (!cache) {
      cache = { accessToken: null, tokenExpiresAt: null, refreshPromise: null };
      tokenCache.set(key, cache);
    }

    if (!cache.refreshPromise) {
      cache.refreshPromise = fetchEbookingAccessToken(supplierId, wholesalerId).finally(() => {
        const current = tokenCache.get(key);
        if (current) current.refreshPromise = null;
      });
    }

    return (await cache.refreshPromise) as string;
  }

  return cache.accessToken as string;
}

export const getEbookingBaseUrl = (): string => {
  return process.env.EBOOKING_BASE_URL || "https://www.ebookingcenter.com";
};

/**
 * Clear cached ebooking tokens (for testing or manual refresh)
 */
export const clearEbookingTokenCache = (): void => {
  tokenCache.clear();
  console.log("🧹 All ebooking token caches cleared.");
};
