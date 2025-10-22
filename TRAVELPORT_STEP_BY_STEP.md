# 🛫 Travelport Integration - Step by Step Implementation

## 📋 Complete Implementation Steps

### Phase 1: Setup & Prerequisites (Day 1)

#### Step 1.1: Account Setup
1. **Create Travelport Developer Account**
   - Go to https://developer.travelport.com/
   - Sign up for Universal API access
   - Request test environment credentials

2. **Get Required Credentials**
   ```env
   TRAVELPORT_USERNAME=your_username
   TRAVELPORT_PASSWORD=your_password
   TRAVELPORT_BRANCH_CODE=your_branch_code
   TRAVELPORT_TARGET_BRANCH=your_target_branch
   TRAVELPORT_BASE_URL=https://americas.universal-api.pp.travelport.com/
   ```

#### Step 1.2: Install Dependencies
```bash
npm install soap xml2js fast-xml-parser axios
npm install --save-dev @types/soap
```

#### Step 1.3: Project Structure Setup
```
src/app/modules/travelport/
├── travelport.service.ts      # Main service
├── travelport.utils.ts        # SOAP helpers
├── travelport.interface.ts    # TypeScript types
├── travelport.controller.ts   # HTTP handlers
├── travelport.route.ts        # Routes
├── travelport.validation.ts   # Request validation
├── soap/
│   ├── client.ts             # SOAP client setup
│   ├── auth.ts               # Authentication
│   └── parsers.ts            # XML parsing
└── wsdl/
    ├── Air.wsdl              # Flight operations
    ├── System.wsdl           # Authentication
    └── Universal.wsdl        # Booking management
```

---

### Phase 2: SOAP Client Foundation (Day 2-3)

#### Step 2.1: Create SOAP Client Base
```typescript
// src/app/modules/travelport/soap/client.ts
import soap from 'soap';
import config from '../../../config';

export class TravelportSOAPClient {
  private static airClient: soap.Client | null = null;
  private static systemClient: soap.Client | null = null;

  static async getAirClient(): Promise<soap.Client> {
    if (!this.airClient) {
      const wsdlUrl = `${config.travelport.baseUrl}/AirService?wsdl`;
      this.airClient = await soap.createClientAsync(wsdlUrl, {
        endpoint: `${config.travelport.baseUrl}/AirService`
      });
    }
    return this.airClient;
  }

  static async getSystemClient(): Promise<soap.Client> {
    if (!this.systemClient) {
      const wsdlUrl = `${config.travelport.baseUrl}/SystemService?wsdl`;
      this.systemClient = await soap.createClientAsync(wsdlUrl, {
        endpoint: `${config.travelport.baseUrl}/SystemService`
      });
    }
    return this.systemClient;
  }
}
```

#### Step 2.2: Add Config Support
```typescript
// Add to src/app/config/index.ts
export default {
  // ... existing config
  travelport: {
    username: process.env.TRAVELPORT_USERNAME,
    password: process.env.TRAVELPORT_PASSWORD,
    branchCode: process.env.TRAVELPORT_BRANCH_CODE,
    targetBranch: process.env.TRAVELPORT_TARGET_BRANCH,
    baseUrl: process.env.TRAVELPORT_BASE_URL || 'https://americas.universal-api.pp.travelport.com',
  },
};
```

#### Step 2.3: Create Authentication Handler
```typescript
// src/app/modules/travelport/soap/auth.ts
import { TravelportSOAPClient } from './client';
import config from '../../../config';

export class TravelportAuth {
  private static sessionToken: string | null = null;
  private static tokenExpiry: number = 0;

  static async getSessionToken(): Promise<string> {
    // Check if token is still valid
    if (this.sessionToken && Date.now() < this.tokenExpiry) {
      return this.sessionToken;
    }

    try {
      const client = await TravelportSOAPClient.getSystemClient();
      
      const authRequest = {
        Username: config.travelport.username,
        Password: config.travelport.password,
        TargetBranch: config.travelport.targetBranch,
      };

      const [result] = await client.PingReqAsync(authRequest);
      
      // Extract session token from response
      this.sessionToken = result.SessionContext?.SessionToken;
      this.tokenExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes
      
      return this.sessionToken;
    } catch (error) {
      throw new Error(`Travelport authentication failed: ${error}`);
    }
  }
}
```

---

### Phase 3: Flight Search Implementation (Day 4-6)

#### Step 3.1: Create Flight Search Service
```typescript
// src/app/modules/travelport/travelport.service.ts
import { TravelportSOAPClient } from './soap/client';
import { TravelportAuth } from './soap/auth';
import { FlightSearchRequest, FlightSearchResponse } from './travelport.interface';

export class TravelportService {
  static async searchFlights(searchParams: FlightSearchRequest): Promise<FlightSearchResponse> {
    try {
      const client = await TravelportSOAPClient.getAirClient();
      const sessionToken = await TravelportAuth.getSessionToken();

      const searchRequest = this.buildSearchRequest(searchParams, sessionToken);
      
      const [result] = await client.AvailabilitySearchReqAsync(searchRequest);
      
      return this.parseSearchResponse(result);
    } catch (error) {
      throw new Error(`Flight search failed: ${error}`);
    }
  }

  private static buildSearchRequest(params: FlightSearchRequest, sessionToken: string) {
    return {
      AvailabilitySearchReq: {
        $attributes: {
          AuthorizedBy: 'user',
          TargetBranch: config.travelport.targetBranch,
        },
        BillingPointOfSaleInfo: {
          $attributes: {
            OriginApplication: 'UAPI'
          }
        },
        SearchAirLeg: [{
          $attributes: {
            Key: '1'
          },
          SearchOrigin: [{
            CityOrAirport: {
              $attributes: {
                Code: params.originLocationCode,
                PreferCity: 'true'
              }
            }
          }],
          SearchDestination: [{
            CityOrAirport: {
              $attributes: {
                Code: params.destinationLocationCode,
                PreferCity: 'true'
              }
            }
          }],
          SearchDepTime: params.departureDate,
          AirLegModifiers: {
            PreferredCabins: {
              CabinClass: {
                $attributes: {
                  Type: 'Economy'
                }
              }
            }
          }
        }],
        SearchPassenger: [{
          $attributes: {
            Code: 'ADT',
            Age: 30
          }
        }],
        AirSearchModifiers: {
          $attributes: {
            MaxSolutions: 20
          }
        }
      }
    };
  }

  private static parseSearchResponse(result: any): FlightSearchResponse {
    // Parse XML response and convert to normalized format
    const flightOptions = result.AvailabilitySearchRsp?.FlightDetailsList?.FlightDetails || [];
    
    return {
      success: true,
      data: flightOptions.map(this.normalizeFlightOption),
      meta: {
        total: flightOptions.length,
        currency: 'USD'
      }
    };
  }

  private static normalizeFlightOption(flight: any) {
    // Convert Travelport format to match Amadeus structure
    return {
      id: flight.$attributes?.Key,
      source: 'travelport',
      instantTicketingRequired: false,
      nonHomogeneous: false,
      oneWay: true,
      lastTicketingDate: flight.LastTicketingDate,
      numberOfBookableSeats: flight.NumberOfBookableSeats || 9,
      itineraries: [
        {
          duration: flight.FlightTime,
          segments: flight.Segments?.map(this.normalizeSegment) || []
        }
      ],
      price: {
        currency: flight.Price?.Currency || 'USD',
        total: flight.Price?.TotalPrice || '0.00',
        base: flight.Price?.BasePrice || '0.00',
        grandTotal: flight.Price?.TotalPrice || '0.00'
      }
    };
  }

  private static normalizeSegment(segment: any) {
    return {
      departure: {
        iataCode: segment.Origin,
        terminal: segment.OriginTerminal,
        at: segment.DepartureTime
      },
      arrival: {
        iataCode: segment.Destination,
        terminal: segment.DestinationTerminal,
        at: segment.ArrivalTime
      },
      carrierCode: segment.Carrier,
      number: segment.FlightNumber,
      aircraft: {
        code: segment.Equipment
      },
      operating: {
        carrierCode: segment.OperatingCarrier || segment.Carrier
      },
      duration: segment.FlightTime,
      id: segment.$attributes?.Key,
      numberOfStops: 0,
      blacklistedInEU: false
    };
  }
}
```

#### Step 3.2: Create TypeScript Interfaces
```typescript
// src/app/modules/travelport/travelport.interface.ts
export interface FlightSearchRequest {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: string;
  currencyCode?: string;
}

export interface FlightSearchResponse {
  success: boolean;
  data: FlightOption[];
  meta: {
    total: number;
    currency: string;
  };
}

export interface FlightOption {
  id: string;
  source: 'travelport';
  instantTicketingRequired: boolean;
  nonHomogeneous: boolean;
  oneWay: boolean;
  lastTicketingDate?: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
}

export interface Itinerary {
  duration: string;
  segments: Segment[];
}

export interface Segment {
  departure: Location;
  arrival: Location;
  carrierCode: string;
  number: string;
  aircraft: Aircraft;
  operating: Operating;
  duration: string;
  id: string;
  numberOfStops: number;
  blacklistedInEU: boolean;
}

export interface Location {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface Aircraft {
  code: string;
}

export interface Operating {
  carrierCode: string;
}

export interface Price {
  currency: string;
  total: string;
  base: string;
  grandTotal: string;
}
```

---

### Phase 4: API Integration (Day 7-8)

#### Step 4.1: Create Controller
```typescript
// src/app/modules/travelport/travelport.controller.ts
import { Request, Response } from 'express';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { TravelportService } from './travelport.service';

export class TravelportController {
  static searchFlights = catchAsync(async (req: Request, res: Response) => {
    const result = await TravelportService.searchFlights(req.body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Flight search successful',
      data: result
    });
  });

  static testConnection = catchAsync(async (req: Request, res: Response) => {
    // Test authentication and basic connectivity
    const token = await TravelportAuth.getSessionToken();
    
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Travelport connection successful',
      data: {
        authenticated: true,
        tokenReceived: !!token,
        provider: 'travelport'
      }
    });
  });
}
```

#### Step 4.2: Create Routes
```typescript
// src/app/modules/travelport/travelport.route.ts
import express from 'express';
import { TravelportController } from './travelport.controller';
import validateRequest from '../../middlewares/validateRequest';
import { TravelportValidation } from './travelport.validation';

const router = express.Router();

// Test connection
router.get('/test', TravelportController.testConnection);

// Flight search
router.post(
  '/search',
  validateRequest(TravelportValidation.searchFlights),
  TravelportController.searchFlights
);

export const TravelportRoutes = router;
```

#### Step 4.3: Add Validation
```typescript
// src/app/modules/travelport/travelport.validation.ts
import { z } from 'zod';

export const TravelportValidation = {
  searchFlights: z.object({
    body: z.object({
      originLocationCode: z.string().length(3),
      destinationLocationCode: z.string().length(3),
      departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      adults: z.number().min(1).max(9),
      children: z.number().min(0).max(9).optional(),
      infants: z.number().min(0).max(9).optional(),
      travelClass: z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']).optional(),
      currencyCode: z.string().length(3).optional()
    })
  })
};
```

---

### Phase 5: Testing & Integration (Day 9-10)

#### Step 5.1: Add Routes to Main Router
```typescript
// Add to src/app/routes/index.ts
import { TravelportRoutes } from "../modules/travelport/travelport.route";

const moduleRoutes = [
  // ... existing routes
  {
    path: "/travelport",
    route: TravelportRoutes,
  },
];
```

#### Step 5.2: Create Test Endpoints
```bash
# Test connection
curl -X GET http://localhost:5001/api/v1/travelport/test

# Test flight search
curl -X POST http://localhost:5001/api/v1/travelport/search \
  -H "Content-Type: application/json" \
  -d '{
    "originLocationCode": "JFK",
    "destinationLocationCode": "LAX", 
    "departureDate": "2025-11-15",
    "adults": 1
  }'
```

---

## 📊 Implementation Timeline

| Phase | Days | Tasks | Complexity |
|-------|------|-------|------------|
| **Setup** | 1 | Account, dependencies, structure | Low |
| **SOAP Foundation** | 2-3 | Client setup, authentication | Medium |
| **Flight Search** | 3 | Service implementation | High |
| **API Integration** | 2 | Controllers, routes, validation | Medium |
| **Testing** | 1 | End-to-end testing | Low |
| **Total** | **9-10 days** | Complete integration | **Medium-High** |

---

## 🎯 Success Criteria

After completion, you'll have:
- ✅ Working Travelport SOAP integration
- ✅ Flight search functionality
- ✅ Response normalization (matches Amadeus format)
- ✅ Error handling
- ✅ Test endpoints
- ✅ TypeScript support

**Ready to start with Step 1 (Account Setup)?** 🚀