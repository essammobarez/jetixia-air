import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import SupplierConnectionModel from "../../supplierConnections/supplierConnection.model";

let accessToken: Promise<string | null> | null = null;
let tokenExpiresAt: number | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

async function fetchAccessToken(supplierId?: string, wholesalerId?: string) {
  try {
    const connections = await SupplierConnectionModel.find({
      supplier: supplierId,
      wholesaler: wholesalerId,
      active: true,
      valid: true,
    });

    if (!connections.length) throw new Error("No active supplier connections found.");

    const supplierCredentials = connections.find((conn) => {
  const scope = (conn.credentials as any)?.scope; 
  return typeof scope === "string" && scope.includes("flights");
});


    if (!supplierCredentials)
      throw new Error("No credentials found for flights");

    console.log("Fetched Supplier Credentials:", supplierCredentials);

    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");
    data.append("client_id", String(supplierCredentials.credentials.client_id));
    data.append("client_secret", String(supplierCredentials.credentials.client_secret));
    data.append("scope", String(supplierCredentials.credentials.scope));

    // Log request details
    console.log("TOKEN_URL:", process.env.EBOOKING_TOKEN_URL);

if (!process.env.EBOOKING_TOKEN_URL) {
  throw new Error('TOKEN_URL environment variable is not defined');
}

const response = await axios.post(process.env.EBOOKING_TOKEN_URL, data.toString(), {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});


    // Log full response
    console.log("=== Raw Response Start ===");
    console.log("Status Code:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("=== Raw Response End ===");

    const result = response.data;
    accessToken = result.access_token;
    const expiresIn = result.expires_in || 3600;
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log("New Access Token fetched:", accessToken);
    return accessToken;
  } catch (error: any) {
    console.error("=== Error Details Start ===");
    if (error.response) {
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Data:", JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error("No Response Received. Request:", error.request);
    } else {
      console.error("Unexpected Error:", error.message || error);
    }
    console.error("=== Error Details End ===");
    throw error;
  }
}

export async function getAccessToken(supplierId?: string, wholesalerId?: string) {
  if (!accessToken || !tokenExpiresAt || Date.now() >= tokenExpiresAt) {
    if (!refreshTokenPromise) {
      refreshTokenPromise = fetchAccessToken(supplierId, wholesalerId).finally(() => {
        refreshTokenPromise = null;
      });
    }
    return refreshTokenPromise;
  }
  return accessToken;
}
