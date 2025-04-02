# Grocery Prices API

A Node.js API for calculating recipe costs and generating shopping lists with package-based pricing. This API provides realistic cost calculations for recipes by factoring in standard retail packaging sizes rather than exact ingredient amounts.

## Table of Contents

- [Features](#features)
- [Project Architecture](#project-architecture)
- [API Endpoints](#api-endpoints)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Implementation Details](#implementation-details)
- [Database Structure](#database-structure)
- [Caching System](#caching-system)
- [Price Calculation Logic](#price-calculation-logic)
- [Extending the System](#extending-the-system)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Features

- **Recipe Cost Calculation**: Calculate the cost of recipes based on ingredient amounts
- **Package-Based Shopping Calculator**: Calculates costs based on actual retail packaging sizes
- **Intelligent Package Size Estimation**: Automatically estimates package sizes for unknown ingredients
- **Caching System**: Optimizes API usage with persistent caching of prices and package information
- **Spoonacular API Integration**: Uses Spoonacular's food database for price data when available
- **Unit Conversion**: Handles different measurement units and conversions between them
- **Ingredient Classification**: Automatically categorizes ingredients for better estimations

## Project Architecture

The project follows a modular architecture with clear separation of concerns:

```
grocery-prices/
├── src/
│   ├── controllers/      # API route controllers
│   │   └── ingredientController.js
│   ├── services/         # Business logic
│   │   ├── ingredientPriceService.js
│   │   └── shoppingCalculatorService.js
│   ├── utils/            # Utility functions and helpers
│   │   └── cacheService.js
│   ├── data/             # Sample data for testing
│   │   └── crispy-chinese-chicken.json
│   ├── test-package-sizes.js   # Test script for package sizes
│   ├── test-recipe.js          # Test script for recipe prices
│   ├── test-shopping.js        # Test script for shopping calculator
│   └── server.js               # Express server setup
├── .env                  # Environment variables (not included in repo)
├── price_cache.json      # Persistent cache for ingredient prices
├── package_size_cache.json  # Persistent cache for package sizes
└── package.json          # Project dependencies and scripts
```

### Key Components

- **ingredientController**: Handles API routes and request validation
- **ingredientPriceService**: Manages ingredient price lookups and calculations
- **shoppingCalculatorService**: Implements the package-based shopping calculator
- **cacheService**: Provides caching functionality for API results

## API Endpoints

### Ingredient Prices

- `GET /api/ingredients/price/:name` - Get price for a single ingredient
- `POST /api/ingredients/calculate` - Calculate cost for an ingredient with quantity

### Recipe Costs

- `POST /api/ingredients/recipe` - Calculate cost for a recipe with multiple ingredients
- `GET /api/ingredients/recipe/:id/price` - Get price breakdown for a recipe by ID from Spoonacular

### Shopping Calculator

- `POST /api/ingredients/shopping-cost` - Calculate shopping cost based on retail packaging
- `GET /api/ingredients/package-sizes` - Get all available standard package sizes
- `GET /api/ingredients/package-info/:name` - Get package information for a specific ingredient

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/grocery-prices.git
   cd grocery-prices
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file with your Spoonacular API key:

   ```
   PORT=3000
   SPOONACULAR_API_KEY=your_api_key_here
   ```

4. Start the server:
   ```
   npm start
   ```

## Configuration

### Environment Variables

- `PORT`: The port number for the server (default: 3000)
- `SPOONACULAR_API_KEY`: Your API key for the Spoonacular Food API

### Cache Configuration

You can modify cache settings in the `src/utils/cacheService.js` file:

- **TTL (Time To Live)**: Default is 24 hours (86400000 ms) for price cache and 30 days for package sizes
- **Cache File**: Default files are `price_cache.json` and `package_size_cache.json` in the root directory

## Usage Examples

### Calculate Ingredient Price

```javascript
// Get price for a single ingredient
const response = await fetch(
  "http://localhost:3000/api/ingredients/price/chicken%20breast"
);
const data = await response.json();
// Returns: { "price": 2.0039, "unit": "piece", "source": "spoonacular" }
```

### Calculate Recipe Cost

```javascript
// Calculate cost for a complete recipe
const response = await fetch("http://localhost:3000/api/ingredients/recipe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    ingredients: [
      { name: "chicken breast", quantity: "500g" },
      { name: "olive oil", quantity: "2 tbsp" },
      { name: "salt", quantity: "1 tsp" },
    ],
  }),
});
const data = await response.json();
// Returns total cost and cost per ingredient
```

### Calculate Shopping Costs

```javascript
// Calculate shopping cost based on retail packaging
const response = await fetch(
  "http://localhost:3000/api/ingredients/shopping-cost",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ingredients: [
        { name: "chicken breast", quantity: "500g" },
        { name: "olive oil", quantity: "2 tbsp" },
        { name: "asparagus", quantity: "250g" },
        { name: "quinoa", quantity: "200g" },
      ],
    }),
  }
);

const data = await response.json();
/* Returns:
{
  "ingredients": [...],
  "totalPackagePrice": 21.46,  // Cost if buying all packages
  "totalRecipeCost": 11.91,    // Cost of amounts used in recipe
  "leftoverValue": 9.55        // Value of leftover ingredients
}
*/
```

### Get Package Information

```javascript
// Get package information for a specific ingredient
const response = await fetch(
  "http://localhost:3000/api/ingredients/package-info/quinoa"
);
const data = await response.json();
// Returns: { "size": "500g", "price": 4.99, "source": "hardcoded database" }
```

## Testing

### Testing Package Size Functionality

```bash
node src/test-package-sizes.js
```

This script tests:

- Available package sizes lookup
- Individual ingredient package information
- Shopping cost calculation with various ingredients

### Testing Recipe Cost Calculation

```bash
node src/test-recipe.js
```

This script calculates the cost for a sample recipe "Crispy Chinese Chicken".

### Testing Shopping Calculator

```bash
node src/test-shopping.js
```

This script tests the shopping calculator functionality with a sample recipe.

## Implementation Details

### Ingredient Price Service

The `ingredientPriceService.js` implements:

- **Price Lookup**: Fetches ingredient prices from Spoonacular API
- **Unit Conversion**: Handles basic conversions between units (g, kg, ml, L, etc.)
- **Price Calculation**: Calculates total costs based on quantities

### Shopping Calculator Service

The `shoppingCalculatorService.js` implements:

- **Package Size Database**: Maintains standard package sizes for common ingredients
- **Package Usage Calculation**: Determines what percentage of a package is used in a recipe
- **Multi-tier Lookup Strategy**: Falls back through several methods to find package information:
  1. Hardcoded database lookup
  2. Package size cache lookup
  3. Spoonacular API product lookup
  4. Intelligent estimation based on ingredient type

### Quantity Parsing

The system parses ingredient quantities from strings like:

- "500g" → { value: 500, unit: "g" }
- "2 tbsp" → { value: 2, unit: "tbsp" }
- "3 pieces" → { value: 3, unit: "pieces" }

### Unit Conversion System

The system handles conversions between:

- Weight units: g ↔ kg
- Volume units: ml ↔ L, tbsp ↔ ml, tsp ↔ ml, cup ↔ ml
- Ingredient-specific conversions: pieces ↔ g, bulbs ↔ g

## Database Structure

### Package Sizes Database

The `PACKAGE_SIZES` object in `shoppingCalculatorService.js` contains standard package sizes:

```javascript
const PACKAGE_SIZES = {
  // Proteins
  "chicken breast": { size: "500g", price: 5.99 },
  "ground beef": { size: "500g", price: 4.99 },
  // ...more ingredients
};
```

### Package Size Estimation Logic

When an ingredient is not found in the database, the system estimates its package size based on categories:

- **Proteins**: 500g packages (chicken, beef, fish, etc.)
- **Grains**: 1kg packages (rice, pasta, flour, etc.)
- **Oils & Liquids**: 500ml bottles (oil, sauce, vinegar, etc.)
- **Spices**: 50g containers (herbs, seasonings, etc.)
- **Produce**: 500g packages (vegetables, fruits, etc.)

## Caching System

The system implements a dual caching strategy:

### Price Cache

- Stores ingredient prices from Spoonacular API
- Default TTL: 24 hours
- Stored in `price_cache.json`

### Package Size Cache

- Stores package size information for ingredients
- Default TTL: 30 days
- Stored in `package_size_cache.json`
- Includes source information for each entry

## Price Calculation Logic

### Recipe Cost Calculation

1. Look up the price of each ingredient (from cache or API)
2. Calculate the cost based on the quantity used
3. Sum all ingredient costs to get the total recipe cost

### Shopping Cost Calculation

1. Calculate what packages need to be purchased for all ingredients
2. Calculate the total cost of all packages
3. Determine what percentage of each package is used in the recipe
4. Calculate the cost of ingredients used and the value of leftovers

## Extending the System

### Adding New Ingredients to Database

To add new ingredients to the hardcoded database, modify the `PACKAGE_SIZES` object in `src/services/shoppingCalculatorService.js`:

```javascript
// Add new ingredients
const PACKAGE_SIZES = {
  // ...existing ingredients
  "almond flour": { size: "500g", price: 8.99 },
  "coconut sugar": { size: "250g", price: 4.49 },
};
```

### Adding New Unit Conversions

To add new unit conversions, modify the `convertUnit` function in `shoppingCalculatorService.js`:

```javascript
// Add new conversion
if (fromUnit === "newunit" && toUnit === "g") {
  return value * conversionFactor;
}
```

## Future Enhancements

Potential areas for improvement:

1. **Regional Pricing**: Support for different regions/countries with varying package sizes and prices
2. **User Customization**: Allow users to override default package sizes with their preferred brands
3. **Branded Products**: Integrate with more specific product databases for brand-specific packaging
4. **Image Recognition**: Add support for extracting ingredients from photos of recipes
5. **Nutrition Calculation**: Integrate nutritional information alongside cost data
6. **Meal Planning Optimization**: Suggest recipes that optimize the use of purchased ingredients
7. **Grocery Store Integration**: Connect with local grocery store APIs for real-time pricing

## License

MIT
