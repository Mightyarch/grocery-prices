# Grocery Prices API

A Node.js API for calculating recipe costs and generating shopping lists with package-based pricing. This API provides realistic cost calculations for recipes by factoring in standard retail packaging sizes rather than exact ingredient amounts.

## Features

- **Recipe Cost Calculation**: Calculate the cost of recipes based on ingredient amounts
- **Package-Based Shopping Calculator**: Calculates costs based on actual retail packaging sizes
- **Intelligent Package Size Estimation**: Automatically estimates package sizes for unknown ingredients
- **Caching System**: Optimizes API usage with persistent caching of prices and package information
- **Spoonacular API Integration**: Uses Spoonacular's food database for price data when available

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

## Usage Examples

### Calculate shopping costs for a recipe

```javascript
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
```

## Testing

To test the package size functionality:

```
node src/test-package-sizes.js
```

## Extending the Database

The system uses a multi-tiered approach to find package information:

1. Hardcoded database (for speed and reliability)
2. Package size cache (for previously looked-up ingredients)
3. Spoonacular API (for dynamic lookups)
4. Intelligent estimation (for unknown ingredients)

You can add more ingredients to the `PACKAGE_SIZES` object in `src/services/shoppingCalculatorService.js`.

## License

MIT
