import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SabreTestService } from "./sabre-test.service";

export class SabreTestController {
  /**
   * Test Sabre Authentication Only
   */
  static testAuth = catchAsync(async (req: Request, res: Response) => {
    try {
      const token = await SabreTestService.getSabreToken();

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Sabre authentication successful! ✅",
        data: {
          authenticated: true,
          tokenReceived: !!token,
          tokenLength: token.length,
          tokenPreview: `${token.substring(0, 20)}...`,
        },
      });
    } catch (error: unknown) {
      console.error("🚨 Controller Error:", error);

      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: (error as Error).message || "Authentication failed",
        data: {
          authenticated: false,
          error: (error as Error).message,
        },
      });
    }
  });

  /**
   * Test Sabre Connection (Auth + Simple API Call)
   */
  static testConnection = catchAsync(async (req: Request, res: Response) => {
    const result = await SabreTestService.testConnection();

    sendResponse(res, {
      statusCode: result.success ? 200 : 500,
      success: result.success,
      message: result.message,
      data: result,
    });
  });

  /**
   * Test Sabre Flight Search
   */
  static testFlightSearch = catchAsync(async (req: Request, res: Response) => {
    const result = await SabreTestService.testFlightSearch();

    sendResponse(res, {
      statusCode: result.success ? 200 : 500,
      success: result.success,
      message: result.message,
      data: result,
    });
  });

  /**
   * Debug Credentials
   */
  static debugCredentials = catchAsync(async (req: Request, res: Response) => {
    const config = require("../../../config").default;

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Sabre credentials debug info",
      data: {
        clientId: config.sabre.clientId || "NOT SET",
        clientSecret: config.sabre.clientSecret ? "SET" : "NOT SET",
        baseUrl: config.sabre.baseUrl || "NOT SET",
        clientIdLength: config.sabre.clientId?.length || 0,
        clientSecretLength: config.sabre.clientSecret?.length || 0,
      },
    });
  });

  /**
   * Complete Test Suite
   */
  static testAll = catchAsync(async (req: Request, res: Response) => {
    console.log("🧪 Running Sabre Complete Test Suite...\n");

    const results = {
      authentication: null as unknown,
      connection: null as unknown,
      flightSearch: null as unknown,
    };

    // Test 1: Authentication
    try {
      const token = await SabreTestService.getSabreToken();
      results.authentication = {
        success: true,
        tokenReceived: !!token,
      };
      console.log("✅ Test 1: Authentication - PASSED\n");
    } catch (error: unknown) {
      const err = error as { message?: string };
      results.authentication = {
        success: false,
        error: err.message,
      };
      console.log("❌ Test 1: Authentication - FAILED\n");
    }

    // Test 2: Connection (Simple API Call)
    try {
      results.connection = await SabreTestService.testConnection();
      console.log("✅ Test 2: Connection - PASSED\n");
    } catch (error: unknown) {
      const err = error as { message?: string };
      results.connection = {
        success: false,
        error: err.message,
      };
      console.log("❌ Test 2: Connection - FAILED\n");
    }

    // Test 3: Flight Search
    try {
      results.flightSearch = await SabreTestService.testFlightSearch();
      console.log("✅ Test 3: Flight Search - PASSED\n");
    } catch (error: unknown) {
      const err = error as { message?: string };
      results.flightSearch = {
        success: false,
        error: err.message,
      };
      console.log("❌ Test 3: Flight Search - FAILED\n");
    }

    const allPassed =
      (results.authentication as { success: boolean }).success &&
      (results.connection as { success: boolean }).success &&
      (results.flightSearch as { success: boolean }).success;

    sendResponse(res, {
      statusCode: allPassed ? 200 : 500,
      success: allPassed,
      message: allPassed
        ? "All Sabre tests passed! ✅ Ready for integration!"
        : "Some Sabre tests failed ❌ Check details below",
      data: {
        summary: {
          totalTests: 3,
          passed: [
            (results.authentication as { success: boolean }).success,
            (results.connection as { success: boolean }).success,
            (results.flightSearch as { success: boolean }).success,
          ].filter(Boolean).length,
          allPassed,
        },
        results,
      },
    });
  });
}
