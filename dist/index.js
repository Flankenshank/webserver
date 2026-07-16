import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import config from "./config.js";
import { errorHandler } from "./middleware.js";
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
    Promise.resolve(chirpValidationHandler(req, res)).catch(next);
});
app.use(errorHandler);
function handlerReadiness(req, res) {
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send("OK");
}
;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
function fileserverHitsHandler(req, res) {
    res.set("Content-Type", "text/html; charset=utf-8");
    res.send(`<html>
    <body>
    <h1>Welcome, Chirpy Admin</h1>
    <p>Chirpy has been visited ${config.fileserverHits} times!</p>
  </body>
</html>`);
}
;
function fileserverHitsResetHandler(req, res) {
    config.fileserverHits = 0;
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(`Hits: ${config.fileserverHits}`);
}
;
async function chirpValidationHandler(req, res) {
    const chirp = req.body.body;
    res.header("Content-Type", "application/json");
    if (!chirp || typeof chirp !== "string" || chirp.length === 0) {
        res.status(400).send({ error: "Something went wrong" });
        return;
    }
    if (chirp.length > 140) {
        throw new Error("Chirp exceeds 140 characters");
    }
    const words = chirp.split(" ");
    const cleanedBody = [...words];
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    for (const word of words) {
        if (badWords.includes(word.toLocaleLowerCase())) {
            cleanedBody.splice(words.indexOf(word), 1, "****");
        }
    }
    res.status(200).send({ cleanedBody: cleanedBody.join(" ") });
}
