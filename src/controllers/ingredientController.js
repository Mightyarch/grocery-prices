const express = require("express");
const router = express.Router();
const {
  getIngredientPrice,
  calculateIngredientCost,
  calculateRecipeCost,
  getRecipePriceBreakdown,
} = require("../services/ingredientPriceService");
const {
  calculateShoppingCost,
  PACKAGE_SIZES,
  getAllPackageSizes,
  getPackageInfo,
} = require("../services/shoppingCalculatorService");

/**
 * @route GET /api/ingredients/price/:name
 * @desc Get price for a single ingredient
 */
router.get("/price/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const priceData = await getIngredientPrice(name);

    if (!priceData.price) {
      return res.status(404).json({
        message: `No price data found for ingredient: ${name}`,
        source: "spoonacular",
      });
    }

    res.json(priceData);
  } catch (error) {
    console.error("Error in /price/:name endpoint:", error);
    res.status(500).json({
      message: "Error fetching ingredient price",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/ingredients/calculate
 * @desc Calculate cost for an ingredient with quantity
 * @body { name: string, quantity: string }
 */
router.post("/calculate", async (req, res) => {
  try {
    const ingredient = req.body;

    if (!ingredient.name || !ingredient.quantity) {
      return res.status(400).json({
        message: "Missing required fields: name, quantity",
      });
    }

    const costData = await calculateIngredientCost(ingredient);
    res.json(costData);
  } catch (error) {
    console.error("Error in /calculate endpoint:", error);
    res.status(500).json({
      message: "Error calculating ingredient cost",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/ingredients/recipe
 * @desc Calculate cost for a recipe with multiple ingredients
 * @body { ingredients: [{ name: string, quantity: string }] }
 */
router.post("/recipe", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res.status(400).json({
        message: "Missing or invalid ingredients array",
      });
    }

    const recipeCost = await calculateRecipeCost(ingredients);
    res.json(recipeCost);
  } catch (error) {
    console.error("Error in /recipe endpoint:", error);
    res.status(500).json({
      message: "Error calculating recipe cost",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/ingredients/recipe/:id/price
 * @desc Get price breakdown for a recipe by ID from Spoonacular
 */
router.get("/recipe/:id/price", async (req, res) => {
  try {
    const { id } = req.params;
    const priceBreakdown = await getRecipePriceBreakdown(id);

    if (!priceBreakdown) {
      return res.status(404).json({
        message: `No price data found for recipe ID: ${id}`,
      });
    }

    res.json(priceBreakdown);
  } catch (error) {
    console.error("Error in /recipe/:id/price endpoint:", error);
    res.status(500).json({
      message: "Error fetching recipe price breakdown",
      error: error.message,
    });
  }
});

/**
 * @route POST /api/ingredients/shopping-cost
 * @desc Calculate shopping cost for a recipe based on retail packaging
 * @body { ingredients: [{ name: string, quantity: string }] }
 */
router.post("/shopping-cost", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res.status(400).json({
        message: "Missing or invalid ingredients array",
      });
    }

    const shoppingCost = await calculateShoppingCost(ingredients);
    res.json(shoppingCost);
  } catch (error) {
    console.error("Error in /shopping-cost endpoint:", error);
    res.status(500).json({
      message: "Error calculating shopping cost",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/ingredients/package-sizes
 * @desc Get standard package sizes for ingredients
 */
router.get("/package-sizes", (req, res) => {
  res.json(getAllPackageSizes());
});

/**
 * @route GET /api/ingredients/package-info/:name
 * @desc Get package information for a specific ingredient
 */
router.get("/package-info/:name", async (req, res) => {
  try {
    const { name } = req.params;
    const packageInfo = await getPackageInfo(name);

    if (!packageInfo) {
      return res.status(404).json({
        message: `No package information found for ingredient: ${name}`,
      });
    }

    res.json(packageInfo);
  } catch (error) {
    console.error("Error in /package-info/:name endpoint:", error);
    res.status(500).json({
      message: "Error fetching package information",
      error: error.message,
    });
  }
});

module.exports = router;
