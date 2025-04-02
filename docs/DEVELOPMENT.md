# Development Guide

This document provides guidance for developers working on the Grocery Prices API.

## Development Environment Setup

### Prerequisites

- Node.js v14+ and npm
- Git
- A Spoonacular API key (free tier available at [spoonacular.com/food-api](https://spoonacular.com/food-api))

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/grocery-prices.git
   cd grocery-prices
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```
   PORT=3000
   SPOONACULAR_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev  # If you've configured nodemon
   # or
   npm start    # For standard node
   ```

## Project Structure

```
grocery-prices/
├── src/
│   ├── controllers/      # API route controllers
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   ├── data/             # Sample data
│   └── server.js         # Express server setup
├── docs/                 # Documentation
├── .env                  # Environment variables (not in repo)
├── .gitignore            # Git ignore configuration
├── package.json          # Dependencies and scripts
└── README.md             # Project overview
```

## Coding Standards

### Code Style

- Use 2 spaces for indentation
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use meaningful, descriptive variable names
- Include JSDoc comments for all functions

### Function Structure

For consistency, follow these patterns for function definitions:

1. **Controller methods**: Express route handlers

   ```javascript
   router.get("/path", async (req, res) => {
     try {
       // Implementation
       res.json(result);
     } catch (error) {
       console.error("Error:", error);
       res.status(500).json({ message: "Error message" });
     }
   });
   ```

2. **Service methods**: Business logic implementations
   ```javascript
   /**
    * Function description
    * @param {Type} paramName - Parameter description
    * @returns {Promise<Type>} - Return value description
    */
   async function serviceMethod(param) {
     // Implementation
     return result;
   }
   ```

### Error Handling

- Use try/catch blocks in all async functions
- Log errors with appropriate context
- Return standardized error responses from API endpoints
- Don't expose sensitive information in error messages

## Working with the Codebase

### Adding New API Endpoints

1. Identify the appropriate controller file (or create a new one if needed)
2. Add the new route handler:

   ```javascript
   router.get("/new-endpoint", async (req, res) => {
     try {
       // Implementation
       res.json(result);
     } catch (error) {
       console.error("Error in new-endpoint:", error);
       res.status(500).json({ message: "Error processing request" });
     }
   });
   ```

3. If needed, implement new service methods
4. Update API documentation

### Adding New Ingredients to the Database

To add new ingredients to the hardcoded package size database, modify the `PACKAGE_SIZES` object in `src/services/shoppingCalculatorService.js`:

```javascript
const PACKAGE_SIZES = {
  // Existing ingredients...

  // Add new ingredients
  "new ingredient": { size: "500g", price: 4.99 },
};
```

### Implementing New Unit Conversions

To add support for new unit conversions, modify the `convertUnit` function in `shoppingCalculatorService.js`:

```javascript
function convertUnit(value, fromUnit, toUnit, ingredient) {
  // Existing conversions...

  // Add new conversion
  if (fromUnit === "newunit" && toUnit === "g") {
    return value * conversionFactor;
  }
}
```

### Adding a New Service

If you need to add a completely new service:

```javascript
// src/services/newService.js
/**
 * New service function
 * @param {Type} param - Parameter description
 * @returns {Type} - Return value description
 */
function newServiceFunction(param) {
  // Implementation
  return result;
}

module.exports = { newServiceFunction };
```

## Testing

### Manual Testing

For quick testing of API endpoints, you can use curl or tools like Postman.

Example curl requests:

```bash
# Get ingredient price
curl http://localhost:3000/api/ingredients/price/chicken%20breast

# Calculate recipe cost
curl -X POST http://localhost:3000/api/ingredients/recipe \
  -H "Content-Type: application/json" \
  -d '{"ingredients":[{"name":"chicken breast","quantity":"500g"},{"name":"olive oil","quantity":"2 tbsp"}]}'
```

### Running Test Scripts

The project includes several test scripts to verify functionality:

```bash
# Test package sizes
node src/test-package-sizes.js

# Test recipe cost calculation
node src/test-recipe.js

# Test shopping calculator
node src/test-shopping.js
```

### Implementing New Tests

When adding new functionality, create or update test scripts to verify it works correctly:

1. Create a new test file in the `src` directory
2. Implement tests for your functionality
3. Run the tests to verify expected behavior

## Working with the Spoonacular API

### API Usage

The Spoonacular API is used for:

- Ingredient price information
- Recipe cost breakdowns
- Grocery product lookups

### Rate Limits

Be aware of Spoonacular's rate limits:

- Free tier: 150 requests/day
- Check the [Spoonacular website](https://spoonacular.com/food-api/pricing) for current limits

### API Optimization

To minimize API usage:

- Use the caching system
- Batch requests where possible
- Test with a small set of ingredients during development

## Deployment

### Preparing for Production

1. Set appropriate environment variables
2. Consider using a process manager like PM2
3. Set up proper logging

### Environment Variables

Production environment variables:

```
NODE_ENV=production
PORT=3000
SPOONACULAR_API_KEY=your_api_key
```

### Deployment Options

- **Heroku**: Easy deployment with minimal configuration
- **Digital Ocean**: More control, requires more setup
- **AWS**: Scalable but more complex

## Contribution Guidelines

### Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add or update tests
5. Ensure code passes style checks
6. Submit PR with clear description of changes

### Code Review Checklist

- Does the code follow our coding standards?
- Are there appropriate comments and documentation?
- Does the code include proper error handling?
- Are there tests for the new functionality?
- Is the code efficient and well-structured?

## Troubleshooting

### Common Issues

1. **API Key Issues**

   - Check that your Spoonacular API key is correctly set in `.env`
   - Verify your API key is active and has available requests

2. **Cache Problems**

   - If you're getting unexpected results, try deleting the cache files:
     ```bash
     rm price_cache.json package_size_cache.json
     ```

3. **Dependency Issues**
   - If you encounter dependency problems:
     ```bash
     rm -rf node_modules
     npm install
     ```

### Debugging

- Use console.log for quick debugging
- Set breakpoints in your IDE
- Check the server logs for error messages
- Verify request/response data with a tool like Postman

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [Spoonacular API Documentation](https://spoonacular.com/food-api/docs)
- [Node.js Documentation](https://nodejs.org/en/docs/)
