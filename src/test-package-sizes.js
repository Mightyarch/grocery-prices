/**
 * Test script for package size lookup functionality
 */
const axios = require("axios");
require("dotenv").config();

const API_URL = "http://localhost:3000/api/ingredients";

// Example ingredients to test with - mix of common and uncommon
const testIngredients = [
  "chicken breast", // in hardcoded database
  "olive oil", // in hardcoded database
  "asparagus", // not in hardcoded database
  "kale", // not in hardcoded database
  "quinoa", // in hardcoded database
  "coconut milk", // not in hardcoded database
  "cinnamon", // not in hardcoded database
  "avocado", // not in hardcoded database
  "maple syrup", // not in hardcoded database
  "ground turkey", // not in hardcoded database
];

/**
 * Test package info for a specific ingredient
 */
async function testIngredientPackageInfo(ingredient) {
  try {
    console.log(`\nLooking up package info for: ${ingredient}`);
    const response = await axios.get(
      `${API_URL}/package-info/${encodeURIComponent(ingredient)}`
    );

    console.log(`Source: ${response.data.source}`);
    console.log(`Package size: ${response.data.size}`);
    console.log(`Price: $${response.data.price.toFixed(2)}`);

    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * View all available package sizes
 */
async function viewAllPackageSizes() {
  try {
    const response = await axios.get(`${API_URL}/package-sizes`);
    const packageSizes = response.data;

    console.log("\n=== AVAILABLE PACKAGE SIZES ===");
    console.log(
      `Total number of ingredients with package info: ${
        Object.keys(packageSizes).length
      }`
    );

    // Group by source
    const sourceGroups = {};
    Object.entries(packageSizes).forEach(([name, info]) => {
      const source = info.source || "default";
      if (!sourceGroups[source]) {
        sourceGroups[source] = [];
      }
      sourceGroups[source].push({ name, ...info });
    });

    console.log("\nBreakdown by source:");
    Object.entries(sourceGroups).forEach(([source, items]) => {
      console.log(`- ${source}: ${items.length} items`);
    });

    // Show a sample of each source
    console.log("\nSamples by source:");
    Object.entries(sourceGroups).forEach(([source, items]) => {
      console.log(`\n${source.toUpperCase()}:`);
      console.log("Item".padEnd(20) + "Package Size".padEnd(15) + "Price");
      console.log("-".repeat(50));

      // Show up to 5 examples from each source
      items.slice(0, 5).forEach((item) => {
        console.log(
          `${item.name.padEnd(20)}${item.size.padEnd(15)}$${item.price.toFixed(
            2
          )}`
        );
      });
    });

    return packageSizes;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * Create a test recipe with various ingredients and test shopping cost
 */
async function testShoppingCost() {
  try {
    // Create a sample recipe with various ingredients
    const testRecipe = {
      title: "Test Recipe with Various Ingredients",
      servings: 4,
      ingredients: [
        { name: "chicken breast", quantity: "500g" },
        { name: "olive oil", quantity: "2 tbsp" },
        { name: "asparagus", quantity: "250g" },
        { name: "kale", quantity: "100g" },
        { name: "quinoa", quantity: "200g" },
        { name: "coconut milk", quantity: "200ml" },
        { name: "cinnamon", quantity: "1 tsp" },
        { name: "salt", quantity: "1 tsp" },
        { name: "black pepper", quantity: "1/2 tsp" },
      ],
    };

    console.log(
      `\nCalculating shopping cost for test recipe: ${testRecipe.title}`
    );

    const response = await axios.post(`${API_URL}/shopping-cost`, {
      ingredients: testRecipe.ingredients,
    });

    const data = response.data;

    console.log("\n=== SHOPPING LIST SUMMARY ===");
    console.log(`Total Shopping Cost: $${data.totalPackagePrice.toFixed(2)}`);
    console.log(`Cost Used in Recipe: $${data.totalRecipeCost.toFixed(2)}`);
    console.log(
      `Leftover Ingredients Value: $${data.leftoverValue.toFixed(2)}`
    );
    console.log(
      `Cost Per Serving: $${(
        data.totalRecipeCost / testRecipe.servings
      ).toFixed(2)}`
    );

    console.log("\n=== SHOPPING LIST DETAILS ===");
    console.log(
      "Ingredient".padEnd(20) +
        "Package Size".padEnd(15) +
        "Source".padEnd(20) +
        "Package Price".padEnd(15) +
        "Amount Used".padEnd(15) +
        "Cost in Recipe"
    );
    console.log("-".repeat(100));

    data.ingredients.forEach((ingredient) => {
      const percentUsed = ingredient.percentUsed * 100;
      console.log(
        `${ingredient.name.padEnd(20)}` +
          `${ingredient.packageSize.padEnd(15)}` +
          `${ingredient.source.padEnd(20)}` +
          `$${ingredient.packagePrice.toFixed(2).padEnd(14)}` +
          `${percentUsed.toFixed(0)}%`.padEnd(15) +
          `$${ingredient.costInRecipe.toFixed(2)}`
      );
    });

    return data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

// Run tests
async function runTests() {
  console.log("=== TESTING PACKAGE SIZE FUNCTIONALITY ===");

  // First, view all available package sizes
  await viewAllPackageSizes();

  // Test each ingredient
  for (const ingredient of testIngredients) {
    await testIngredientPackageInfo(ingredient);
  }

  // Test a shopping cost calculation
  await testShoppingCost();
}

runTests();
