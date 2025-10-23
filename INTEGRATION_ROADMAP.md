# 🗺️ Supplier Integration Roadmap

## Current Status

### ✅ Amadeus (Complete)
- OAuth2 authentication ✅
- Flight search ✅
- Pricing confirmation ✅
- Booking ✅
- Airline/Airport enrichment ✅

### 🟡 Sabre (70% Complete)
- OAuth2 authentication ✅
- Basic flight search ✅
- **Missing:** Full integration with main API
- **Missing:** Booking functionality
- **Missing:** Response normalization

### ❌ Travelport (Not Started)
- Authentication ❌
- Flight search ❌
- Booking ❌

---

## 🎯 Recommended Integration Order

### Phase 1: Complete Sabre Integration (2-3 days)

**Why Sabre first?**
- 70% already implemented
- REST API (similar to Amadeus)
- OAuth2 authentication working
- Can reuse Amadeus patterns

**Tasks:**
1. ✅ Fix authentication (in progress)
2. Create full Sabre service (mirror Amadeus structure)
3. Add response normalization
4. Integrate with main price-list API
5. Add booking functionality

### Phase 2: Add Travelport (1-2 weeks)

**Why Travelport second?**
- More complex (SOAP/XML vs REST/JSON)
- Different authentication method
- Requires more architectural changes

---

## 🏗️ Architecture Pattern

### Current Amadeus Pattern
```
src/app/modules/price-list/
├── priceList.service.ts     # Main service
├── priceList.utils.ts       # OAuth2 + helpers
├── priceList.interface.ts   # Types
└── priceList.controller.ts  # HTTP handlers
```

### Proposed Multi-Supplier Pattern
```
src/app/modules/price-list/
├── suppliers/
│   ├── amadeus/
│   │   ├── amadeus.service.ts
│   │   ├── amadeus.utils.ts
│   │   └── amadeus.interface.ts
│   ├── sabre/
│   │   ├── sabre.service.ts
│   │   ├── sabre.utils.ts
│   │   └── sabre.interface.ts
│   └── travelport/
│       ├── travelport.service.ts
│       ├── travelport.utils.ts
│       └── travelport.interface.ts
├── aggregator/
│   ├── supplier.aggregator.ts  # Combines all suppliers
│   └── response.normalizer.ts  # Standardizes responses
└── priceList.controller.ts     # Routes to aggregator
```

---

## 🔄 Integration Strategy

### Option 1: Sequential (Recommended)
```
Request → Try Amadeus → If fails → Try Sabre → If fails → Try Travelport
```

### Option 2: Parallel + Merge
```
Request → [Amadeus + Sabre + Travelport] → Merge results → Return best options
```

### Option 3: Supplier Selection
```
Request + supplier preference → Route to specific supplier
```

---

## 🛠️ Next Steps for Sabre

### 1. Test Current Sabre Setup
```bash
curl -X GET http://localhost:5001/api/v1/sabre-test/auth
```

### 2. Create Full Sabre Service
- Mirror Amadeus structure
- Add flight search
- Add booking functionality
- Normalize responses

### 3. Integrate with Main API
- Add supplier parameter to price-list API
- Route requests to appropriate supplier
- Merge Sabre results with existing flow

---

## 🎯 Benefits of This Approach

### Immediate Benefits (Sabre)
- ✅ Backup supplier if Amadeus fails
- ✅ More flight options for customers
- ✅ Price comparison between suppliers
- ✅ Reduced dependency on single supplier

### Future Benefits (Travelport)
- ✅ 3 supplier options
- ✅ Better coverage (especially corporate travel)
- ✅ Competitive pricing
- ✅ High availability

---

## 📊 Complexity Comparison

| Feature | Amadeus | Sabre | Travelport |
|---------|---------|-------|------------|
| **API Type** | REST/JSON | REST/JSON | SOAP/XML |
| **Auth** | OAuth2 | OAuth2 | Session-based |
| **Complexity** | Medium | Medium | High |
| **Documentation** | Excellent | Good | Complex |
| **Integration Time** | ✅ Done | 2-3 days | 1-2 weeks |

---

## 🚀 Quick Start: Complete Sabre

Want to finish Sabre integration? Let's:

1. **Fix authentication** (almost done)
2. **Create supplier structure**
3. **Add to main API**
4. **Test end-to-end**

Ready to proceed with Sabre completion? 🎯