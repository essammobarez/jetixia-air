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
  {
    accessToken: string | null;
    tokenExpiresAt: number | null;
    refreshPromise: Promise<string | null> | null;
  }
>();

/**
 * Fetch ebooking OAuth2 access token dynamically from DB credentials
 */
async function fetchEbookingAccessToken(
  supplierId?: string,
  wholesalerId?: string
): Promise<string | null> {
  try {
    console.log("\n=== 🔄 FETCHING NEW EBOOKING TOKEN ===");
    console.log("📋 Supplier ID:", supplierId);
    console.log("📋 Wholesaler ID:", wholesalerId);
    console.log("⏰ Fetch Time:", new Date().toISOString());

    const supplierCredentials = await SupplierConnectionModel.findOne({
      supplier: supplierId,
      wholesaler: wholesalerId,
      active: true,
      valid: true,
    });

    console.log("📦 Supplier Connection Found:", !!supplierCredentials);
    console.log("📦 Connection ID:", supplierCredentials?._id);
    console.log("📦 Connection Updated At:", supplierCredentials?.updatedAt);
    console.log(
      "🔑 Client ID:",
      supplierCredentials?.credentials?.client_id
        ? `${String(supplierCredentials.credentials.client_id).substring(
            0,
            8
          )}...`
        : "MISSING"
    );
    console.log(
      "🔑 Client Secret:",
      supplierCredentials?.credentials?.client_secret
        ? `${String(supplierCredentials.credentials.client_secret).substring(
            0,
            8
          )}...`
        : "MISSING"
    );
    console.log("🔑 Scope:", supplierCredentials?.credentials?.scope);

    if (
      !supplierCredentials?.credentials?.client_id ||
      !supplierCredentials?.credentials?.client_secret ||
      !process.env.EBOOKING_TOKEN_URL ||
      !supplierCredentials?.credentials?.scope
    ) {
      console.error("❌ Missing required credentials:");
      console.error(
        "   - client_id:",
        !!supplierCredentials?.credentials?.client_id
      );
      console.error(
        "   - client_secret:",
        !!supplierCredentials?.credentials?.client_secret
      );
      console.error("   - token_url:", !!process.env.EBOOKING_TOKEN_URL);
      console.error("   - scope:", !!supplierCredentials?.credentials?.scope);

      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Required credentials are missing for ebooking supplier connection."
      );
    }

    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");
    data.append("client_id", String(supplierCredentials.credentials.client_id));
    data.append(
      "client_secret",
      String(supplierCredentials.credentials.client_secret)
    );
    data.append("scope", String(supplierCredentials.credentials.scope));

    console.log("📤 Token Request URL:", process.env.EBOOKING_TOKEN_URL);
    console.log("📤 Request Payload:");
    console.log("   - grant_type: client_credentials");
    console.log(
      "   - client_id:",
      String(supplierCredentials.credentials.client_id).substring(0, 8) + "..."
    );
    console.log(
      "   - client_secret:",
      String(supplierCredentials.credentials.client_secret).substring(0, 8) +
        "..."
    );
    console.log(
      "   - scope:",
      String(supplierCredentials.credentials.scope).substring(0, 50) + "..."
    );

    const requestStartTime = Date.now();
    const response = await axios.post(
      process.env.EBOOKING_TOKEN_URL,
      data.toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );
    const requestDuration = Date.now() - requestStartTime;

    console.log("📥 Token Response Received:");
    console.log("   - Status:", response.status);
    console.log("   - Duration:", requestDuration + "ms");
    console.log("   - Token Type:", response.data.token_type);
    console.log("   - Expires In:", response.data.expires_in + "s");
    console.log(
      "   - Access Token (first 20 chars):",
      response.data.access_token?.substring(0, 20) + "..."
    );

    const result: EbookingAuthResponse = response.data;
    const expiresIn = result.expires_in || 86400;
    const tokenExpiresAt = Date.now() + expiresIn * 1000;
    const expiryDate = new Date(tokenExpiresAt);

    console.log("💾 Caching Token:");
    console.log("   - Cache Key:", `${supplierId}-${wholesalerId}`);
    console.log(
      "   - Expires In:",
      expiresIn + "s (" + (expiresIn / 60).toFixed(2) + " minutes)"
    );
    console.log("   - Expiry Time:", expiryDate.toISOString());
    console.log("✅ TOKEN GENERATION SUCCESSFUL");
    console.log("=== END TOKEN FETCH ===\n");

    // 🧠 Cache token per supplier-wholesaler pair
    const key = `${supplierId}-${wholesalerId}`;
    tokenCache.set(key, {
      accessToken: result.access_token,
      tokenExpiresAt,
      refreshPromise: null,
    });

    return result.access_token;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status: number;
        statusText: string;
        data: unknown;
        headers: unknown;
        config?: {
          url?: string;
          method?: string;
          data?: unknown;
        };
      };
      request?: {
        _header?: string;
        path?: string;
      };
      message?: string;
      code?: string;
      stack?: string;
      config?: {
        url?: string;
        method?: string;
        data?: unknown;
      };
    };

    console.error("\n=== ❌ TOKEN GENERATION FAILED ===");
    console.error("📋 Supplier ID:", supplierId);
    console.error("📋 Wholesaler ID:", wholesalerId);
    console.error("⏰ Error Time:", new Date().toISOString());

    if (err.response) {
      console.error("\n📥 ====== RAW SUPPLIER ERROR RESPONSE ======");
      console.error(
        "HTTP Status:",
        err.response.status,
        err.response.statusText
      );
      console.error("\n🔴 Response Body (Raw):");
      console.error(JSON.stringify(err.response.data, null, 2));

      console.error("\n📋 Response Headers:");
      console.error(JSON.stringify(err.response.headers, null, 2));

      if (err.response.config) {
        console.error("\n📤 Request Details:");
        console.error("   - URL:", err.response.config.url);
        console.error(
          "   - Method:",
          err.response.config.method?.toUpperCase()
        );
        if (err.response.config.data) {
          console.error("   - Payload:", err.response.config.data);
        }
      }
      console.error("====== END RAW SUPPLIER ERROR ======\n");
    } else if (err.request) {
      console.error("\n📤 ====== REQUEST ERROR (NO RESPONSE) ======");
      console.error("No response received from supplier");
      console.error("Error Message:", err.message);
      console.error("Error Code:", err.code);

      if (err.config) {
        console.error("\n📤 Request Details:");
        console.error("   - URL:", err.config.url);
        console.error("   - Method:", err.config.method?.toUpperCase());
      }

      if (err.request._header) {
        console.error("\n📋 Request Headers:");
        console.error(err.request._header);
      }
      console.error("====== END REQUEST ERROR ======\n");
    } else {
      console.error("\n⚠️  ====== GENERAL ERROR ======");
      console.error("Error Message:", err.message);
      console.error("\n📚 Stack Trace:");
      console.error(err.stack);
      console.error("====== END GENERAL ERROR ======\n");
    }

    // Log complete error object for debugging
    console.error("\n🔍 ====== COMPLETE ERROR OBJECT ======");
    try {
      console.error(JSON.stringify(error, null, 2));
    } catch {
      console.error("Error object is not serializable:", error);
    }
    console.error("====== END COMPLETE ERROR ======");
    console.error("\n=== END TOKEN GENERATION ERROR ===\n");

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

  console.log("\n=== 🔐 GET EBOOKING ACCESS TOKEN ===");
  console.log("📋 Request Details:");
  console.log("   - Supplier ID:", supplierId);
  console.log("   - Wholesaler ID:", wholesalerId);
  console.log("   - Cache Key:", key);
  console.log("   - Current Time:", new Date().toISOString());

  let cache = tokenCache.get(key);

  if (cache) {
    console.log("💾 Cache Entry Found:");
    console.log("   - Has Access Token:", !!cache.accessToken);
    console.log(
      "   - Access Token (first 20 chars):",
      cache.accessToken ? cache.accessToken.substring(0, 20) + "..." : "NULL"
    );
    console.log(
      "   - Token Expires At:",
      cache.tokenExpiresAt
        ? new Date(cache.tokenExpiresAt).toISOString()
        : "NULL"
    );
    console.log("   - Has Refresh Promise:", !!cache.refreshPromise);

    if (cache.tokenExpiresAt) {
      const timeUntilExpiry = cache.tokenExpiresAt - Date.now();
      const minutesUntilExpiry = (timeUntilExpiry / 1000 / 60).toFixed(2);
      console.log(
        "   - Time Until Expiry:",
        minutesUntilExpiry + " minutes (" + timeUntilExpiry + "ms)"
      );
      console.log("   - Is Expired/Expiring Soon:", timeUntilExpiry < 60000);
    }
  } else {
    console.log("💾 Cache Entry: NOT FOUND");
  }

  const needsRefresh =
    !cache ||
    !cache.accessToken ||
    !cache.tokenExpiresAt ||
    Date.now() >= cache.tokenExpiresAt - 60000;

  console.log("🔄 Token Refresh Decision:");
  console.log("   - Needs Refresh:", needsRefresh);
  if (needsRefresh) {
    console.log(
      "   - Reason:",
      !cache
        ? "No cache entry"
        : !cache.accessToken
        ? "No access token"
        : !cache.tokenExpiresAt
        ? "No expiry time"
        : "Token expired or expiring soon (< 1 minute)"
    );
  }

  if (needsRefresh) {
    if (!cache) {
      console.log("📝 Creating new cache entry...");
      cache = { accessToken: null, tokenExpiresAt: null, refreshPromise: null };
      tokenCache.set(key, cache);
    }

    if (!cache.refreshPromise) {
      console.log("🚀 Starting token fetch...");
      cache.refreshPromise = fetchEbookingAccessToken(
        supplierId,
        wholesalerId
      ).finally(() => {
        const current = tokenCache.get(key);
        if (current) {
          console.log("🧹 Clearing refresh promise from cache");
          current.refreshPromise = null;
        }
      });
    } else {
      console.log("⏳ Token fetch already in progress, waiting...");
    }

    const token = (await cache.refreshPromise) as string;
    console.log(
      "✅ Token Retrieved (refreshed):",
      token ? token.substring(0, 20) + "..." : "NULL"
    );
    console.log("=== END GET TOKEN ===\n");
    return token;
  }

  // TypeScript safety: cache should exist at this point
  if (!cache || !cache.accessToken) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Token cache is invalid after refresh check"
    );
  }

  console.log(
    "✅ Token Retrieved (from cache):",
    cache.accessToken.substring(0, 20) + "..."
  );
  console.log("=== END GET TOKEN ===\n");
  return cache.accessToken;
}

export const getEbookingBaseUrl = (): string => {
  return process.env.EBOOKING_BASE_URL || "https://www.ebookingcenter.com";
};

/**
 * Clear cached ebooking tokens (for testing or manual refresh)
 */
export const clearEbookingTokenCache = (): void => {
  console.log("\n=== 🧹 CLEARING TOKEN CACHE ===");
  console.log("📊 Cache Entries Before Clear:", tokenCache.size);

  if (tokenCache.size > 0) {
    console.log("📋 Cached Keys:");
    tokenCache.forEach((value, key) => {
      console.log(`   - Key: ${key}`);
      console.log(
        `     Token: ${
          value.accessToken
            ? value.accessToken.substring(0, 20) + "..."
            : "NULL"
        }`
      );
      console.log(
        `     Expires: ${
          value.tokenExpiresAt
            ? new Date(value.tokenExpiresAt).toISOString()
            : "NULL"
        }`
      );
    });
  }

  tokenCache.clear();
  console.log("✅ All ebooking token caches cleared");
  console.log("📊 Cache Entries After Clear:", tokenCache.size);
  console.log("=== END CACHE CLEAR ===\n");
};
