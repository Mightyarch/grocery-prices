const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

// Verify API key is loaded
const apiKey = process.env.SPOONACULAR_API_KEY;
if (apiKey) {
  console.log(
    `API Key loaded successfully: ${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`
  );
} else {
  console.error("Error: API Key not found in environment variables");
}

// Import routes
const ingredientRoutes = require("./controllers/ingredientController");

// Config
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/ingredients", ingredientRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "Grocery Prices API is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
