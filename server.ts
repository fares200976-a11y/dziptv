// Local development server only.
// In production on Vercel, api/index.ts is used instead (see vercel.json).
import { createServer as createViteServer } from "vite";
import app from "./src/apiApp";

const PORT = 3000;

async function startServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DZ IPTV] Local dev server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
