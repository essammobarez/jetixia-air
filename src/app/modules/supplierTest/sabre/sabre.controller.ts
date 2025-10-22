import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { SabreService } from "./sabre.service";

export class SabreController {
    /**
     * Test Sabre Authentication
     */
    static testAuth = catchAsync(async (req: Request, res: Response) => {
        const token = await SabreService.getSabreToken();

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
     * Search flights using Sabre API
     */
    static searchFlights = catchAsync(async (req: Request, res: Response) => {
        const {
            origin,
            destination,
            departureDate,
            returnDate,
            adults = 1,
            children = 0,
            infants = 0,
            cabinClass = "Economy",
        } = req.body;

        // Validate required fields
        if (!origin || !destination || !departureDate) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Missing required fields: origin, destination, departureDate",
            });
        }

        const searchParams = {
            origin,
            destination,
            departureDate,
            returnDate,
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants),
            cabinClass,
        };

        const result = await SabreService.searchFlights(searchParams);

        sendResponse(res, {
            statusCode: result.success ? 200 : 500,
            success: result.success,
            message: result.success
                ? `Found ${result.data?.flights?.length || 0} flights via Sabre`
                : result.error || "Flight search failed",
            data: result.data || null,
        });
    });

    /**
     * Get supported countries
     */
    static getSupportedCountries = catchAsync(async (req: Request, res: Response) => {
        const result = await SabreService.getSupportedCountries();

        sendResponse(res, {
            statusCode: result.success ? 200 : 500,
            success: result.success,
            message: result.success
                ? `Found ${result.data?.length || 0} supported countries`
                : result.error || "Failed to get countries",
            data: result.data || null,
        });
    });

    /**
     * Get cities by country
     */
    static getCitiesByCountry = catchAsync(async (req: Request, res: Response) => {
        const { countryCode } = req.params;

        if (!countryCode) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Country code is required",
            });
        }

        const result = await SabreService.getCitiesByCountry(countryCode);

        sendResponse(res, {
            statusCode: result.success ? 200 : 500,
            success: result.success,
            message: result.success
                ? `Found ${result.data?.length || 0} cities in ${countryCode}`
                : result.error || `Failed to get cities for ${countryCode}`,
            data: result.data || null,
        });
    });

    /**
     * Test full Sabre connection (auth + API call)
     */
    static testConnection = catchAsync(async (req: Request, res: Response) => {
        try {
            // Test authentication
            const token = await SabreService.getSabreToken();

            // Test API call
            const countriesResult = await SabreService.getSupportedCountries();

            const result = {
                success: true,
                message: "Sabre connection successful! ✅",
                data: {
                    authentication: {
                        status: "Connected",
                        tokenReceived: !!token,
                        tokenLength: token.length,
                    },
                    apiTest: {
                        endpoint: "/v1/lists/supported/countries",
                        success: countriesResult.success,
                        countriesCount: countriesResult.data?.length || 0,
                    },
                },
            };

            sendResponse(res, {
                statusCode: 200,
                success: true,
                message: result.message,
                data: result.data,
            });
        } catch (error: any) {
            sendResponse(res, {
                statusCode: 500,
                success: false,
                message: `Sabre connection failed ❌: ${error.message}`,
            });
        }
    });
}