const axios = require("axios");
require("dotenv").config(); // Load environment variables

// Configuration
const API_URL = "http://localhost:3000/api/ingredients";

// Test data
const singleIngredient = {
  name: "tomato",
  quantity: "500g",
};

const recipeIngredients = {
  ingredients: [
    { name: "tomato", quantity: "500g" },
    { name: "onion", quantity: "1 unit" },
    { name: "rice", quantity: "200g" },
    { name: "chicken", quantity: "300g" },
  ],
};

// Spoonacular recipe ID for testing
const SPOONACULAR_RECIPE_ID = "716429"; // Pasta with tomato and spinach

/**
 * Tests the GET /price/:name endpoint
 */
async function testGetIngredientPrice() {
  console.log("\n--- Testing GET /price/:name ---");
  try {
    const response = await axios.get(`${API_URL}/price/tomato`);
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * Tests the POST /calculate endpoint
 */
async function testCalculateIngredientCost() {
  console.log("\n--- Testing POST /calculate ---");
  try {
    const response = await axios.post(`${API_URL}/calculate`, singleIngredient);
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * Tests the POST /recipe endpoint
 */
async function testCalculateRecipeCost() {
  console.log("\n--- Testing POST /recipe ---");
  try {
    const response = await axios.post(`${API_URL}/recipe`, recipeIngredients);
    console.log("Response:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * Tests the GET /recipe/:id/price endpoint
 */
async function testRecipePriceBreakdown() {
  console.log("\n--- Testing GET /recipe/:id/price ---");
  try {
    const response = await axios.get(
      `${API_URL}/recipe/${SPOONACULAR_RECIPE_ID}/price`
    );
    console.log("Recipe Price Breakdown:");
    console.log(`Total Cost: $${response.data.totalCost.toFixed(2)}`);
    console.log(
      `Cost Per Serving: $${response.data.totalCostPerServing.toFixed(2)}`
    );
    console.log("Ingredient Costs:");
    response.data.ingredients.forEach((ingredient) => {
      console.log(`- ${ingredient.name}: $${ingredient.price.toFixed(2)}`);
    });
    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * Test caching functionality
 */
async function testCaching() {
  console.log("\n--- Testing Cache Functionality ---");
  console.log("First request (should hit API):");
  await testGetIngredientPrice();

  console.log("\nSecond request (should hit cache):");
  await testGetIngredientPrice();
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("Starting API tests...");

  try {
    // Test individual endpoints
    await testGetIngredientPrice();
    await testCalculateIngredientCost();
    await testCalculateRecipeCost();
    await testRecipePriceBreakdown();

    // Test caching
    await testCaching();

    console.log("\nAll tests completed!");
  } catch (error) {
    console.error("Test runner error:", error);
  }
}

// Run the tests
runTests();
