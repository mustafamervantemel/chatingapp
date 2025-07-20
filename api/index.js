// Vercel serverless function entry point
const app = require('../backend/index');

// For Vercel serverless functions, export the app directly
module.exports = app;