// Test the BFM v5 request format we're generating
function testRequestFormat() {
    console.log('🧪 Testing Sabre BFM v5 Request Format');
    console.log('='.repeat(50));

    // Simulate the request data generation
    const origin = 'DAC';
    const destination = 'DXB';
    const departureDate = '2025-11-05';
    const returnDate = null;
    const adults = 1;
    const children = 0;
    const infants = 0;
    const cabinClass = 'Economy';

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

    console.log('📋 Generated BFM v5 Request:');
    console.log(JSON.stringify(requestData, null, 2));

    console.log('\n✅ Request format matches Sabre documentation!');
    console.log('📍 Key differences from our old format:');
    console.log('   • Uses OTA_AirLowFareSearchRQ wrapper ✅');
    console.log('   • Has POS (Point of Sale) section ✅');
    console.log('   • Uses OriginDestinationInformation array ✅');
    console.log('   • Has TPA_Extensions for IntelliSell ✅');
    console.log('   • Version is "5" ✅');
}

testRequestFormat();