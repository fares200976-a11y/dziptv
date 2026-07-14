// Vercel serverless entry point.
// Vercel treats every file in /api as its own serverless function.
// Since our Express app already defines routes starting with "/api/...",
// this single catch-all file (combined with the rewrite rule in vercel.json)
// forwards every /api/* request into the same Express app used locally.
import app from "../src/apiApp.js";

export default app;
