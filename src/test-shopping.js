const axios = require("axios");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:3000/api/ingredients";

// Load the Crispy Chinese Chicken recipe
const recipe = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "data", "crispy-chinese-chicken.json"),
    "utf8"
  )
);

/**
 * Test the shopping cost calculator
 */
async function testShoppingCost() {
  console.log(`\nCalculating shopping cost for recipe: ${recipe.title}`);
  try {
    const response = await axios.post(`${API_URL}/shopping-cost`, {
      ingredients: recipe.ingredients,
    });

    const data = response.data;

    console.log("\n=== SHOPPING LIST SUMMARY ===");
    console.log(`Total Shopping Cost: $${data.totalPackagePrice.toFixed(2)}`);
    console.log(`Cost Used in Recipe: $${data.totalRecipeCost.toFixed(2)}`);
    console.log(
      `Leftover Ingredients Value: $${data.leftoverValue.toFixed(2)}`
    );
    console.log(
      `Cost Per Serving: $${(data.totalRecipeCost / recipe.servings).toFixed(
        2
      )}`
    );

    console.log("\n=== SHOPPING LIST DETAILS ===");
    console.log(
      "Ingredient".padEnd(20) +
        "Package Size".padEnd(15) +
        "Package Price".padEnd(15) +
        "Amount Used".padEnd(15) +
        "Cost in Recipe"
    );
    console.log("-".repeat(80));

    data.ingredients.forEach((ingredient) => {
      const percentUsed = ingredient.percentUsed * 100;
      console.log(
        `${ingredient.name.padEnd(20)}` +
          `${ingredient.packageSize.padEnd(15)}` +
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

/**
 * Test the regular recipe cost calculator for comparison
 */
async function testRecipeCost() {
  console.log(`\nCalculating ingredient-based cost for comparison:`);
  try {
    const response = await axios.post(`${API_URL}/recipe`, {
      ingredients: recipe.ingredients,
    });

    console.log(
      `Ingredient-based total: $${response.data.totalCost.toFixed(2)}`
    );
    console.log(
      `Ingredient-based per serving: $${(
        response.data.totalCost / recipe.servings
      ).toFixed(2)}`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

/**
 * View package sizes database
 */
async function viewPackageSizes() {
  try {
    const response = await axios.get(`${API_URL}/package-sizes`);
    console.log("\n=== AVAILABLE PACKAGE SIZES ===");

    const categories = {
      Proteins: Object.entries(response.data).filter(([key]) =>
        ["chicken", "beef", "salmon", "tofu"].some((term) => key.includes(term))
      ),
      Grains: Object.entries(response.data).filter(([key]) =>
        ["rice", "pasta", "quinoa", "flour", "cornflour"].some((term) =>
          key.includes(term)
        )
      ),
      "Oils & Sauces": Object.entries(response.data).filter(([key]) =>
        ["oil", "sauce", "honey", "vinegar"].some((term) => key.includes(term))
      ),
      "Spices & Herbs": Object.entries(response.data).filter(([key]) =>
        ["salt", "pepper", "powder", "ginger", "garlic", "seeds"].some((term) =>
          key.includes(term)
        )
      ),
      Produce: Object.entries(response.data).filter(([key]) =>
        ["pepper", "onion", "tomato", "lemon"].some((term) =>
          key.includes(term)
        )
      ),
    };

    Object.entries(categories).forEach(([category, items]) => {
      console.log(`\n${category}:`);
      console.log("Item".padEnd(20) + "Package Size".padEnd(15) + "Price");
      console.log("-".repeat(50));

      items.forEach(([name, info]) => {
        console.log(
          `${name.padEnd(20)}${info.size.padEnd(15)}$${info.price.toFixed(2)}`
        );
      });
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

// Run the tests
async function runTests() {
  await viewPackageSizes();
  await testShoppingCost();
  await testRecipeCost();
}

runTests();
