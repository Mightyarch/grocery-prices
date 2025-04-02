/**
 * Ingredient Price Service
 * Uses Spoonacular API to get pricing data for ingredients
 */
const axios = require("axios");
const { ingredientPriceCache } = require("../utils/cacheService");

// Configuration
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const BASE_URL = "https://api.spoonacular.com";

// Check if we have a valid API key
if (!SPOONACULAR_API_KEY) {
  console.warn("⚠️ WARNING: No Spoonacular API key found in .env file");
  console.warn(
    "Please sign up at https://spoonacular.com/food-api to get a free API key"
  );
  console.warn(
    "Then update your .env file with: SPOONACULAR_API_KEY=your_actual_key"
  );
} else {
  console.log(
    `Using Spoonacular API key: ${SPOONACULAR_API_KEY.slice(
      0,
      5
    )}...${SPOONACULAR_API_KEY.slice(-4)}`
  );
}

/**
 * Gets the price of an ingredient using Spoonacular's API
 * @param {string} ingredientName - The name of the ingredient
 * @returns {Promise<{price: number|null, unit: string|null, source: string}>}
 */
async function getIngredientPrice(ingredientName) {
  // Check cache first
  const cachedData = ingredientPriceCache.get(ingredientName);
  if (cachedData) {
    console.log(`Cache hit for: ${ingredientName}`);
    return cachedData;
  }

  // If no valid API key, return null
  if (!SPOONACULAR_API_KEY) {
    console.log(`No API key - can't fetch price data for: ${ingredientName}`);
    return { price: null, unit: null, source: "spoonacular (no API key)" };
  }

  try {
    console.log(`Fetching price data for: ${ingredientName}`);

    // First try to find the ingredient
    const searchUrl = `${BASE_URL}/food/ingredients/search?apiKey=${SPOONACULAR_API_KEY}&query=${encodeURIComponent(
      ingredientName
    )}&number=1`;
    const searchResponse = await axios.get(searchUrl);

    if (
      !searchResponse.data.results ||
      searchResponse.data.results.length === 0
    ) {
      console.log(`No ingredient data found for: ${ingredientName}`);
      return { price: null, unit: null, source: "spoonacular" };
    }

    const ingredientId = searchResponse.data.results[0].id;

    // Get price data for the ingredient
    const priceUrl = `${BASE_URL}/food/ingredients/${ingredientId}/information?apiKey=${SPOONACULAR_API_KEY}&amount=1&unit=piece`;
    const priceResponse = await axios.get(priceUrl);

    if (!priceResponse.data.estimatedCost) {
      console.log(`No price data found for: ${ingredientName}`);
      return { price: null, unit: null, source: "spoonacular" };
    }

    const result = {
      price: priceResponse.data.estimatedCost.value / 100, // Convert to dollars
      unit: priceResponse.data.unit || "piece",
      source: "spoonacular",
    };

    // Cache the result
    return ingredientPriceCache.set(ingredientName, result);
  } catch (error) {
    console.error(`Error fetching price for ${ingredientName}:`, error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    return { price: null, unit: null, source: "spoonacular" };
  }
}

/**
 * Calculates the cost of an ingredient based on quantity
 * @param {Object} ingredient - Ingredient object with name and quantity
 * @returns {Promise<{name: string, quantity: string, price: number|null, total: number|null}>}
 */
async function calculateIngredientCost(ingredient) {
  const { name, quantity } = ingredient;
  const priceData = await getIngredientPrice(name);

  if (!priceData.price) {
    return {
      ...ingredient,
      price: null,
      total: null,
      source: priceData.source || "spoonacular",
    };
  }

  // Simple quantity parser (this would need to be more sophisticated in a real app)
  const quantityMatch = quantity.match(/^([\d.]+)\s*(\w+)$/);
  if (!quantityMatch) {
    return {
      ...ingredient,
      price: priceData.price,
      priceUnit: priceData.unit,
      total: priceData.price, // Default to full price if we can't parse quantity
      source: "spoonacular",
    };
  }

  const [, amount, unit] = quantityMatch;
  const unitPrice = priceData.price;

  // Very basic unit conversion - would need to be expanded
  let conversionFactor = 1;

  // This is a simplified conversion example
  if (
    unit.toLowerCase().includes("g") &&
    priceData.unit.toLowerCase().includes("kg")
  ) {
    conversionFactor = 0.001; // 1g = 0.001kg
  } else if (
    unit.toLowerCase().includes("ml") &&
    priceData.unit.toLowerCase().includes("l")
  ) {
    conversionFactor = 0.001; // 1ml = 0.001L
  }

  const totalCost = parseFloat(amount) * conversionFactor * unitPrice;

  return {
    ...ingredient,
    price: unitPrice,
    priceUnit: priceData.unit,
    total: totalCost,
    source: "spoonacular",
  };
}

/**
 * Calculates the cost of all ingredients in a recipe
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {Promise<{ingredients: Array, totalCost: number}>}
 */
async function calculateRecipeCost(ingredients) {
  // Use Promise.all to fetch prices in parallel
  const ingredientsWithCosts = await Promise.all(
    ingredients.map((ingredient) => calculateIngredientCost(ingredient))
  );

  // Calculate total cost of recipe
  const totalCost = ingredientsWithCosts.reduce((sum, ingredient) => {
    return sum + (ingredient.total || 0);
  }, 0);

  return {
    ingredients: ingredientsWithCosts,
    totalCost,
  };
}

/**
 * Gets recipe price breakdown from Spoonacular API
 * @param {string} recipeId - Spoonacular recipe ID
 * @returns {Promise<Object>} - Price breakdown object
 */
async function getRecipePriceBreakdown(recipeId) {
  // If no valid API key, return null
  if (!SPOONACULAR_API_KEY) {
    console.log(
      `No API key - can't fetch price breakdown for recipe: ${recipeId}`
    );
    return null;
  }

  try {
    const url = `${BASE_URL}/recipes/${recipeId}/priceBreakdownWidget.json?apiKey=${SPOONACULAR_API_KEY}`;
    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error(`Error fetching recipe price breakdown:`, error.message);
    if (error.response) {
      console.error("API Response:", error.response.data);
    }
    return null;
  }
}

module.exports = {
  getIngredientPrice,
  calculateIngredientCost,
  calculateRecipeCost,
  getRecipePriceBreakdown,
};
