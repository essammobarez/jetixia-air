import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SabreTestService } from "./sabre-test.service";

export class SabreTestController {
  /**
   * Test Sabre Authentication
   */
  static testAuth = catchAsync(async (req: Request, res: Response) => {
    const token = await SabreTestService.getSabreToken();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Sabre authentication successful! ✅",
      data: {
        authenticated: true,
        tokenReceived: !!token,
        tokenPreview: `${token.substring(0, 30)}...${token.substring(
          token.length - 10
        )}`,
        tokenLength: token.length,
      },
    });
  });

  /**
   * Test Sabre Connection (Auth + API Call)
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
}

