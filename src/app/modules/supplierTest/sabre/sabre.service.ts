import axios from "axios";
import config from "../../../config";

export class SabreService {
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
                    `Sabre Authentication Failed: ${error.response?.data?.error_description || error.message
                    }`
                );
            }
            throw error;
        }
    }

    /**
     * Make authenticated request to Sabre API
     */
    static async makeRequest(endpoint: string, data?: any, method: 'GET' | 'POST' = 'GET') {
        try {
            const token = await this.getSabreToken();
            const baseUrl = config.sabre.baseUrl;

            console.log("🌐 Making Sabre API Request:");
            console.log("   Method:", method);
            console.log("   URL:", `${baseUrl}${endpoint}`);
            console.log("   Headers:", {
                Authorization: `Bearer ${token.substring(0, 20)}...`,
                "Content-Type": "application/json",
                Accept: "application/json",
            });
            console.log("   Request Data:", JSON.stringify(data, null, 2));

            const response = await axios({
                method,
                url: `${baseUrl}${endpoint}`,
                data,
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            });

            console.log("✅ Sabre API Response Status:", response.status);
            console.log("📄 Response Data:", JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                console.error("❌ Sabre API Error Details:");
                console.error("   Status:", error.response?.status);
                console.error("   Status Text:", error.response?.statusText);
                console.error("   Headers:", error.response?.headers);
                console.error("   Data:", JSON.stringify(error.response?.data, null, 2));
                console.error("   Request URL:", error.config?.url);
                console.error("   Request Method:", error.config?.method);
                console.error("   Request Data:", error.config?.data);

                throw new Error(
                    `Sabre API Error: ${error.response?.data?.message || error.response?.data?.error || error.message}`
                );
            }
            throw error;
        }
    }

    /**
     * Search flights using Sabre BargainFinderMax API
     */
    static async searchFlights(searchParams: {
        origin: string;
        destination: string;
        departureDate: string;
        returnDate?: string;
        adults: number;
        children?: number;
        infants?: number;
        cabinClass?: string;
    }) {
        try {
            const { origin, destination, departureDate, returnDate, adults, children = 0, infants = 0, cabinClass = "Economy" } = searchParams;

            // Build passenger type quantities
            const passengerTypeQuantities = [];
            if (adults > 0) passengerTypeQuantities.push({ Code: "ADT", Quantity: adults });
            if (children > 0) passengerTypeQuantities.push({ Code: "CHD", Quantity: children });
            if (infants > 0) passengerTypeQuantities.push({ Code: "INF", Quantity: infants });

            // Build origin destination information
            const originDestinationInformation = [
                {
                    DepartureDateTime: `${departureDate}T00:00:00`,
                    OriginLocation: { LocationCode: origin },
                    DestinationLocation: { LocationCode: destination },
                },
            ];

            // Add return flight if provided
            if (returnDate) {
                originDestinationInformation.push({
                    DepartureDateTime: `${returnDate}T00:00:00`,
                    OriginLocation: { LocationCode: destination },
                    DestinationLocation: { LocationCode: origin },
                });
            }

            // Build correct BFM v5 request using OTA format
            const requestData = {
                OTA_AirLowFareSearchRQ: {
                    Version: "5",
                    POS: {
                        Source: [
                            {
                                PseudoCityCode: "XXXX", // Test PCC
                                RequestorID: {
                                    Type: "1",
                                    ID: "1",
                                    CompanyName: {
                                        Code: "TN",
                                    },
                                },
                            },
                        ],
                    },
                    OriginDestinationInformation: originDestinationInformation,
                    TravelPreferences: {
                        MaxStopsQuantity: 2,
                        CabinPref: [{ Cabin: cabinClass }],
                    },
                    TravelerInfoSummary: {
                        AirTravelerAvail: [
                            {
                                PassengerTypeQuantity: passengerTypeQuantities,
                            },
                        ],
                    },
                    TPA_Extensions: {
                        IntelliSellTransaction: {
                            RequestType: {
                                Name: "50ITINS",
                            },
                        },
                    },
                },
            };



            console.log("🔍 Searching flights with BFM v5 (TEST):", {
                origin,
                destination,
                departureDate,
                returnDate,
                passengers: passengerTypeQuantities.reduce((sum, p) => sum + p.Quantity, 0),
            });

            console.log("📋 BFM v5 Request Structure:");
            console.log("   Passengers:", passengerTypeQuantities);
            console.log("   Origin Destinations:", originDestinationInformation);
            console.log("   Travel Preferences:", requestData.OTA_AirLowFareSearchRQ.TravelPreferences);

            // Use BFM v5 endpoint (TEST ENVIRONMENT)
            const response = await this.makeRequest("/v5/offers/shop", requestData, "POST");

            return this.parseBFMv5Response(response);
        } catch (error) {
            console.error("❌ Sabre BFM v5 flight search failed:", error);
            return {
                success: false,
                provider: "sabre",
                error: error instanceof Error ? error.message : "Flight search failed",
            };
        }
    }

    /**
     * Parse Sabre BFM v5 response to standardized format
     */
    static parseBFMv5Response(response: any) {
        try {
            console.log("🔍 Parsing BFM v5 Response...");

            const groupedResponse = response?.groupedItineraryResponse;
            if (!groupedResponse) {
                console.error("❌ No groupedItineraryResponse found");
                return {
                    success: false,
                    provider: "sabre",
                    error: "Invalid response format from Sabre BFM v5",
                };
            }

            console.log("📊 BFM v5 Response Statistics:", groupedResponse.statistics);

            const itineraryGroups = groupedResponse.itineraryGroups || [];
            const legDescs = groupedResponse.legDescs || [];
            const scheduleDescs = groupedResponse.scheduleDescs || [];
            const validatingCarrierDescs = groupedResponse.validatingCarrierDescs || [];

            console.log("📋 Found components:");
            console.log("   Itinerary Groups:", itineraryGroups.length);
            console.log("   Leg Descriptions:", legDescs.length);
            console.log("   Schedule Descriptions:", scheduleDescs.length);

            const flights: any[] = [];

            // Process each itinerary group
            itineraryGroups.forEach((group: any, groupIndex: number) => {
                console.log(`\n🔍 Processing Group ${groupIndex + 1}:`, group.groupDescription);

                group.itineraries?.forEach((itinerary: any, itinIndex: number) => {
                    console.log(`   Processing Itinerary ${itinIndex + 1}:`, itinerary.id);

                    // Get pricing information from the actual BFM v5 structure
                    const pricingInfo = itinerary.pricingInformation?.[0];
                    const totalFare = pricingInfo?.fare?.totalFare;
                    const passengerFare = pricingInfo?.fare?.passengerInfoList?.[0]?.passengerInfo?.passengerTotalFare;

                    // Get legs information (using 'legs' not 'legIds')
                    const legs = itinerary.legs?.map((legRef: any) =>
                        legDescs.find((leg: any) => leg.id === legRef.ref)
                    ) || [];

                    // Get validating carrier
                    const validatingCarrier = validatingCarrierDescs.find((vc: any) => vc.id === 1)?.default?.code || "";

                    const flight = {
                        id: `sabre_bfm_${itinerary.id}`,
                        price: {
                            total: totalFare?.totalPrice || passengerFare?.totalFare || 0,
                            currency: totalFare?.currency || passengerFare?.currency || "USD",
                            base: totalFare?.equivalentAmount || passengerFare?.equivalentAmount || 0,
                            taxes: totalFare?.totalTaxAmount || passengerFare?.totalTaxAmount || 0,
                        },
                        itineraries: this.parseBFMv5Itineraries(legs, scheduleDescs),
                        validatingCarrier: validatingCarrier,
                        lastTicketingDate: pricingInfo?.fare?.lastTicketDate || null,
                        pricingSource: itinerary.pricingSource || null,
                    };

                    console.log(`   ✅ Flight ${flight.id}: $${flight.price.total} ${flight.price.currency}`);
                    flights.push(flight);
                });
            });

            console.log(`\n🎉 Successfully parsed ${flights.length} flights from BFM v5!`);

            return {
                success: true,
                provider: "sabre",
                data: {
                    flights: flights,
                    totalResults: flights.length,
                    searchId: `sabre_bfm_v5_${Date.now()}`,
                    statistics: groupedResponse.statistics,
                },
            };
        } catch (error) {
            console.error("❌ Error parsing Sabre BFM v5 response:", error);
            return {
                success: false,
                provider: "sabre",
                error: "Failed to parse flight search response",
            };
        }
    }

    /**
     * Parse BFM v5 itineraries
     */
    static parseBFMv5Itineraries(legs: any[], scheduleDescs: any[]) {
        return legs.map((leg: any, index: number) => {
            // In BFM v5, legs have 'schedules' array with 'ref' properties
            const schedules = leg?.schedules?.map((schedRef: any) =>
                scheduleDescs.find((sched: any) => sched.id === schedRef.ref)
            ) || [];

            return {
                direction: index === 0 ? "outbound" : "inbound",
                segments: schedules.map((schedule: any) => ({
                    departure: {
                        airport: schedule?.departure?.airport || leg?.origin || "",
                        terminal: schedule?.departure?.terminal || null,
                        time: schedule?.departure?.time || "",
                    },
                    arrival: {
                        airport: schedule?.arrival?.airport || leg?.destination || "",
                        terminal: schedule?.arrival?.terminal || null,
                        time: schedule?.arrival?.time || "",
                    },
                    carrier: schedule?.carrier || "",
                    flightNumber: schedule?.flightNumber || "",
                    aircraft: schedule?.aircraft || "",
                    duration: schedule?.duration || "",
                    cabinClass: schedule?.cabinClass || "",
                    bookingClass: schedule?.bookingClass || "",
                })),
                duration: this.calculateBFMv5Duration(schedules),
            };
        });
    }

    /**
     * Get validating carrier from schedules
     */
    static getValidatingCarrier(legs: any[], scheduleDescs: any[]): string {
        const firstLeg = legs[0];
        if (!firstLeg?.scheduleRefIds?.length) return "";

        const firstSchedule = scheduleDescs.find((s: any) => s.id === firstLeg.scheduleRefIds[0]);
        return firstSchedule?.carrier || "";
    }

    /**
     * Calculate duration for BFM v5 itinerary
     */
    static calculateBFMv5Duration(schedules: any[]): string {
        if (!schedules.length) return "0h 0m";

        const firstDeparture = schedules[0]?.departure?.time;
        const lastArrival = schedules[schedules.length - 1]?.arrival?.time;

        if (!firstDeparture || !lastArrival) return "0h 0m";

        // Simple duration calculation (you may want to improve this)
        return "Duration TBD";
    }

    /**
     * Parse Sabre flight search response to standardized format (Legacy - keeping for compatibility)
     */
    static parseFlightSearchResponse(response: any) {
        try {
            const flights = response?.OTA_AirLowFareSearchRS?.PricedItineraries?.PricedItinerary || [];

            return {
                success: true,
                provider: "sabre",
                data: {
                    flights: flights.map((flight: any, index: number) => ({
                        id: `sabre_${index}`,
                        price: {
                            total: parseFloat(flight.AirItineraryPricingInfo?.ItinTotalFare?.TotalFare?.Amount || 0),
                            currency: flight.AirItineraryPricingInfo?.ItinTotalFare?.TotalFare?.CurrencyCode || "USD",
                            base: parseFloat(flight.AirItineraryPricingInfo?.ItinTotalFare?.BaseFare?.Amount || 0),
                            taxes: parseFloat(flight.AirItineraryPricingInfo?.ItinTotalFare?.Taxes?.Tax?.Amount || 0),
                        },
                        itineraries: this.parseItineraries(flight.AirItinerary?.OriginDestinationOptions?.OriginDestinationOption || []),
                        validatingCarrier: flight.AirItineraryPricingInfo?.ValidatingCarrier?.Code || "",
                        lastTicketingDate: flight.AirItineraryPricingInfo?.LastTicketDate || null,
                    })),
                    totalResults: flights.length,
                    searchId: `sabre_${Date.now()}`,
                },
            };
        } catch (error) {
            console.error("❌ Error parsing Sabre response:", error);
            return {
                success: false,
                provider: "sabre",
                error: "Failed to parse flight search response",
            };
        }
    }

    /**
     * Parse flight itineraries
     */
    static parseItineraries(originDestinationOptions: any[]) {
        return originDestinationOptions.map((option: any, index: number) => ({
            direction: index === 0 ? "outbound" : "inbound",
            segments: (option.FlightSegment || []).map((segment: any) => ({
                departure: {
                    airport: segment.DepartureAirport?.LocationCode || "",
                    terminal: segment.DepartureAirport?.Terminal || null,
                    time: segment.DepartureDateTime || "",
                },
                arrival: {
                    airport: segment.ArrivalAirport?.LocationCode || "",
                    terminal: segment.ArrivalAirport?.Terminal || null,
                    time: segment.ArrivalDateTime || "",
                },
                carrier: segment.MarketingAirline?.Code || "",
                flightNumber: segment.FlightNumber || "",
                aircraft: segment.Equipment?.AirEquipType || "",
                duration: segment.ElapsedTime || "",
                cabinClass: segment.CabinClassOfService || "",
                bookingClass: segment.BookingClassOfService || "",
            })),
            duration: this.calculateTotalDuration(option.FlightSegment || []),
        }));
    }

    /**
     * Calculate total duration for itinerary
     */
    static calculateTotalDuration(segments: any[]): string {
        if (!segments.length) return "0h 0m";

        const firstDeparture = new Date(segments[0].DepartureDateTime);
        const lastArrival = new Date(segments[segments.length - 1].ArrivalDateTime);
        const totalMinutes = Math.floor((lastArrival.getTime() - firstDeparture.getTime()) / (1000 * 60));

        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}h ${minutes}m`;
    }

    /**
     * Get supported countries
     */
    static async getSupportedCountries() {
        try {
            const response = await this.makeRequest("/v1/lists/supported/countries");
            return {
                success: true,
                data: response.Countries || [],
            };
        } catch (error) {
            return {
                success: false,
                error: "Failed to get supported countries",
            };
        }
    }

    /**
     * Get cities by country
     */
    static async getCitiesByCountry(countryCode: string) {
        try {
            const response = await this.makeRequest(`/v1/lists/supported/cities/${countryCode}`);
            return {
                success: true,
                data: response.Cities || [],
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to get cities for ${countryCode}`,
            };
        }
    }
}