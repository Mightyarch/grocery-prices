const axios = require("axios");
require("dotenv").config();

const API_URL = "http://localhost:3000/api/ingredients";

// Recipe data in JSON format
const recipe = {
  title: "Crispy Chinese Chicken",
  description:
    "A quick and delicious homemade version of a Chinese takeaway favorite, featuring crispy chicken in a savory-sweet sauce with rice and fresh veggies.",
  tags: ["High Protein", "Balanced"],
  time: "30 min",
  servings: 3,
  calories: 450,
  author: "tylerbutt_eats",
  ingredients: [
    { name: "chicken breast", quantity: "3 pieces" },
    { name: "cornflour", quantity: "7 tsp" },
    { name: "garlic powder", quantity: "1 tsp" },
    { name: "salt", quantity: "1 tsp" },
    { name: "black pepper", quantity: "1 tsp" },
    { name: "soy sauce", quantity: "2 tbsp" },
    { name: "honey", quantity: "1 tbsp" },
    { name: "sesame oil", quantity: "1 tbsp" },
    { name: "rice vinegar", quantity: "1 tbsp" },
    { name: "lemon", quantity: "0.5 piece" },
    { name: "garlic", quantity: "1 tsp" },
    { name: "ginger", quantity: "0.5 tsp" },
    { name: "vegetable oil", quantity: "2 tbsp" },
    { name: "rice", quantity: "150g" },
    { name: "bell pepper", quantity: "1 piece" },
    { name: "spring onion", quantity: "3 pieces" },
    { name: "sesame seeds", quantity: "1 tsp" },
  ],
  instructions: [
    "Cut your chicken breast into bite-size pieces and cover in salt, pepper, cornflour, and garlic powder.",
    "Wash your rice until the water runs clear, then add enough water to reach your first knuckle from the rice and bring to a simmer.",
    "Add all of your sauce ingredients (soy sauce, honey, sesame oil, rice vinegar, lemon juice, garlic, and ginger) to a jar or bowl and combine.",
    "Heat your oil to high heat and add your chicken pieces in batches for a few minutes each side until golden and crispy.",
    "Dice your veggies and add to the pan for a few minutes, then add your sauce and cornflour slurry. (Remove the rice and let it steam.)",
    "Add back your chicken and coat everything in the sauce.",
    "Add rice to a small ramekin or bowl and plate it. Top with the green parts of the spring onions and sesame seeds. Enjoy!",
  ],
  nutrition: {
    calories: 450,
    protein: "35g",
    carbs: "50g",
    fat: "12g",
    fiber: "4g",
  },
};

/**
 * Test calculating the recipe cost
 */
async function testRecipeCost() {
  console.log(`\nCalculating cost for recipe: ${recipe.title}`);
  try {
    const response = await axios.post(`${API_URL}/recipe`, {
      ingredients: recipe.ingredients,
    });

    console.log("\n--- Recipe Cost Breakdown ---");
    console.log(`Total Recipe Cost: $${response.data.totalCost.toFixed(2)}`);
    console.log(
      `Cost Per Serving: $${(response.data.totalCost / recipe.servings).toFixed(
        2
      )}`
    );

    console.log("\n--- Ingredient Costs ---");
    response.data.ingredients.forEach((ingredient) => {
      console.log(
        `${ingredient.name.padEnd(20)} $${
          ingredient.total ? ingredient.total.toFixed(2) : "N/A"
        }`
      );
    });

    // Add recipe metadata to the result
    const fullResult = {
      ...recipe,
      cost: {
        total: response.data.totalCost,
        perServing: response.data.totalCost / recipe.servings,
        ingredients: response.data.ingredients,
      },
    };

    return fullResult;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
  }
}

// Run the test
testRecipeCost();
