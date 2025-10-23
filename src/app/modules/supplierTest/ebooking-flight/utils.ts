import dotenv from "dotenv";
dotenv.config();
import axios from "axios";

let accessToken: Promise<string | null> | null = null;
let tokenExpiresAt: number | null = null;
let refreshTokenPromise: Promise<string | null> | null = null;

async function fetchAccessToken() {
  try {
    const data = new URLSearchParams();
    data.append("grant_type", "client_credentials");

    if (
      !process.env.CLIENT_ID ||
      !process.env.TOKEN_URL ||
      !process.env.CLIENT_SECRET ||
      !process.env.REQUESTED_SCOPES
    ) {
      throw new Error("Required environment variables are missing.");
    }

    data.append("client_id", process.env.CLIENT_ID);
    data.append("client_secret", process.env.CLIENT_SECRET);
    data.append("scope", process.env.REQUESTED_SCOPES);

    // Log request details
    console.log("TOKEN_URL:", process.env.TOKEN_URL);
    console.log("CLIENT_ID:", process.env.CLIENT_ID);
    console.log("CLIENT_SECRET exists:", !!process.env.CLIENT_SECRET);
    console.log("REQUESTED_SCOPES:", process.env.REQUESTED_SCOPES);
    console.log("Request Body:", data.toString());

    // Make the POST request
    const response = await axios.post(process.env.TOKEN_URL, data.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // 🔥 Log the FULL raw response
    console.log("=== Raw Response Start ===");
    console.log("Status Code:", response.status);
    console.log("Status Text:", response.statusText);
    console.log("Headers:", JSON.stringify(response.headers, null, 2));
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
    console.log("=== Raw Response End ===");

    const result = response.data;
    accessToken = result.access_token;
    const expiresIn = result.expires_in || 3600;
    tokenExpiresAt = Date.now() + expiresIn * 1000;

    console.log("New Access Token fetched:", accessToken);
    return accessToken;
  } catch (error: any) {
    // 🔥 Log full error details
    console.error("=== Error Details Start ===");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Error Response Status:", error.response.status);
      console.error("Error Response Headers:", error.response.headers);
      console.error(
        "Error Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Error Request Sent, No Response Received:");
      console.error("Request:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Unexpected Error:", error.message || error);
    }
    console.error("=== Error Details End ===");

    throw error;
  }
}

export async function getAccessToken() {
  if (!accessToken || !tokenExpiresAt || Date.now() >= tokenExpiresAt) {
    if (!refreshTokenPromise) {
      refreshTokenPromise = fetchAccessToken().finally(() => {
        refreshTokenPromise = null;
      });
    }
    return refreshTokenPromise;
  }
  return accessToken;
}