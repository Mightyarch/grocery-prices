# Architecture Documentation

This document describes the architecture and design of the Grocery Prices API.

## System Overview

The Grocery Prices API is built using Node.js and Express, following a modular architecture that separates concerns into controllers, services, and utilities. The system provides pricing data for ingredients and recipes, with a focus on realistic shopping costs based on standard packaging sizes.

## Architecture Diagram

```
┌─────────────────┐      ┌───────────────────┐      ┌─────────────────┐
│                 │      │                   │      │                 │
│  API Endpoints  │─────▶│  Service Layer    │─────▶│  Data Sources   │
│  (Controllers)  │      │                   │      │                 │
│                 │      │                   │      │                 │
└─────────────────┘      └───────────────────┘      └─────────────────┘
        │                         │                         ▲
        │                         │                         │
        │                         ▼                         │
        │                ┌───────────────────┐              │
        │                │                   │              │
        └───────────────▶│  Cache System     │──────────────┘
                         │                   │
                         └───────────────────┘
```

## Component Structure

### Controllers

The controllers handle API routes, request validation, and response formatting.

**Main Controller File:** `src/controllers/ingredientController.js`

Responsibilities:

- Route definition using Express Router
- Request parameter validation
- Calling appropriate service methods
- Error handling and response formatting

### Services

The services implement the core business logic.

**Main Service Files:**

- `src/services/ingredientPriceService.js` - Handles ingredient price lookup and calculation
- `src/services/shoppingCalculatorService.js` - Implements package-based shopping calculator

Responsibilities:

- Price and cost calculations
- Integration with external APIs (Spoonacular)
- Package size determination
- Unit conversions

### Cache System

The cache system optimizes API usage by storing results.

**Main Cache File:** `src/utils/cacheService.js`

Responsibilities:

- In-memory caching with TTL (Time To Live)
- Persistent storage in JSON files
- Cache invalidation based on expiry times

### Data Flow

1. **Request Flow:**

   - Client sends request to an API endpoint
   - Controller validates request parameters
   - Controller calls appropriate service method
   - Service performs business logic
   - Service returns results to controller
   - Controller formats and sends response

2. **Caching Flow:**

   - Before making external API calls, check cache
   - If data is in cache and not expired, return cached data
   - If data is not in cache or expired, fetch from external source
   - Store new data in cache for future requests

3. **Shopping Calculator Flow:**
   - Receive list of ingredients with quantities
   - For each ingredient:
     1. Check hardcoded package size database
     2. If not found, check package size cache
     3. If not found, attempt to fetch from Spoonacular API
     4. If not found, estimate based on ingredient type
   - Calculate percentage of each package used in recipe
   - Calculate total package cost and recipe cost

## Design Patterns

### Repository Pattern

The service layer implements a repository pattern to abstract data access. This allows for flexibility in data sources (hardcoded data, API, cache).

### Strategy Pattern

The package size lookup uses a strategy pattern with multiple fallback strategies:

1. Hardcoded database lookup
2. Cache lookup
3. API lookup
4. Intelligent estimation

### Singleton Pattern

The cache implementations use a singleton pattern to ensure there's only one instance of each cache.

## Key Algorithms

### Quantity Parsing

The `parseQuantity` function in `shoppingCalculatorService.js` parses ingredient quantities from strings:

```javascript
function parseQuantity(quantity) {
  const match = quantity.match(/^([\d.]+)\s*(.+)$/);
  if (!match) return { value: 1, unit: quantity };

  return {
    value: parseFloat(match[1]),
    unit: match[2].trim(),
  };
}
```

### Unit Conversion

The `convertUnit` function handles unit conversions for different ingredient types:

```javascript
function convertUnit(value, fromUnit, toUnit, ingredient) {
  // Conversion logic for weights, volumes, and ingredient-specific conversions
}
```

### Package Usage Calculation

The `calculatePackageUsage` function determines what percentage of a package is used:

```javascript
function calculatePackageUsage(ingredient, packageInfo) {
  // Logic to calculate percentage of package used
}
```

## External Dependencies

### Spoonacular API

The system integrates with the Spoonacular API for:

- Ingredient price data
- Recipe information
- Grocery product data

**Main Integration Points:**

- `getIngredientPrice` in `ingredientPriceService.js`
- `getPackageInfo` in `shoppingCalculatorService.js`

### Express Framework

The API is built using Express.js, which provides:

- Routing
- Middleware support
- Request/response handling

## Performance Considerations

### Caching Strategy

The dual caching strategy (price cache and package size cache) with different TTLs optimizes performance:

- Price cache: 24 hours TTL (shorter for potentially volatile price data)
- Package size cache: 30 days TTL (longer for relatively stable packaging information)

### Concurrent Requests

Service methods use Promise.all for parallel processing of multiple ingredients:

```javascript
const ingredientsWithCosts = await Promise.all(
  ingredients.map((ingredient) => calculateIngredientCost(ingredient))
);
```

### File I/O Optimization

The cache system batches file writes to avoid excessive disk I/O.

## Security Considerations

### API Key Handling

The Spoonacular API key is stored in environment variables and not exposed to clients.

### Input Validation

All API endpoints include input validation to prevent injection and other attacks.

### Error Handling

The system implements proper error handling to avoid leaking sensitive information.

## Extensibility

The architecture is designed for extensibility:

1. **New Data Sources**: Additional data sources can be easily added to the service layer
2. **New Endpoints**: New API endpoints can be added to the controller
3. **Enhanced Algorithms**: The core algorithms are modular and can be improved independently

## Future Architecture Improvements

1. **Database Integration**: Replace JSON file caching with a proper database
2. **Authentication System**: Add user authentication for personalized data
3. **Microservices**: Split into smaller, focused microservices for better scalability
4. **Dockerization**: Container support for easier deployment
5. **API Gateway**: Add API gateway for better request handling and rate limiting
