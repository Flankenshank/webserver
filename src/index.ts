import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import config from "./config.js";

const app = express();
const PORT = 8080;

app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.get("/healthz", handlerReadiness);
app.get("/metrics/", fileserverHitsHandler);
app.get("/metrics/", fileserverHitsResetHandler);
app.get("/reset/", fileserverHitsResetHandler);

function handlerReadiness(req: express.Request, res: express.Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
};

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

function fileserverHitsHandler(req: express.Request, res: express.Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.fileserverHits}`);
};

function fileserverHitsResetHandler(req: express.Request, res: express.Response) {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send(`Hits: ${config.fileserverHits}`);
};