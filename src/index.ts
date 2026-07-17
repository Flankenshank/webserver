import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import config from "./config.js";
import { errorHandler } from "./errors.js";
import { chirpValidationHandler } from "./chirps.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(express.json());
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", fileserverHitsHandler);
app.post("/admin/reset", fileserverHitsResetHandler);
app.post("/api/validate_chirp", (req, res, next) => {
  Promise.resolve(chirpValidationHandler(req, res)).catch(next)
});
app.use(errorHandler);

function handlerReadiness(req: express.Request, res: express.Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function fileserverHitsHandler(req: express.Request, res: express.Response) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(
    `<html>
    <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`
)
};

function fileserverHitsResetHandler(req: express.Request, res: express.Response) {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.fileserverHits}`);
};