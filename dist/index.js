import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import config from "./config.js";
import { errorHandler, ForbiddenError } from "./api/errors.js";
import { getChirpsHandler } from "./db/queries/chirps.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser, deleteAllUsers, upgradeUser } from "./db/queries/users.js";
import { getAPIKey, hashPassword, refreshTokenHandler, userAuthHandler, userUpdateHandler } from "./api/auth.js";
import { revokeTokenHandler } from "./api/auth.js";
import { chirpCreateHandler, chirpDeleteHandler } from "./api/chirps.js";
const app = express();
const PORT = 8080;
app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(express.json());
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", fileserverHitsHandler);
app.get("/api/chirps", (req, res, next) => {
    Promise.resolve(getChirpsHandler(req, res)).catch(next);
});
app.get("/api/chirps/:chirpId", (req, res, next) => {
    Promise.resolve(getChirpsHandler(req, res)).catch(next);
});
app.post("/admin/reset", (req, res, next) => {
    Promise.resolve(deleteAllUsersHandler(req, res)).catch(next);
});
app.post("/admin/reset", fileserverHitsResetHandler);
app.post("/api/users", (req, res, next) => {
    Promise.resolve(userCreationHandler(req, res)).catch(next);
});
app.post("/api/chirps", (req, res, next) => {
    Promise.resolve(chirpCreateHandler(req, res)).catch(next);
});
app.post("/api/login", (req, res, next) => {
    Promise.resolve(userAuthHandler(req, res)).catch(next);
});
app.post("/api/refresh", refreshTokenHandler);
app.post("/api/revoke", revokeTokenHandler);
app.post("/api/polka/webhooks", polkaWebhookHandler);
app.put("/api/users", userUpdateHandler);
app.delete("/api/chirps/:chirpId", (req, res, next) => {
    Promise.resolve(chirpDeleteHandler(req, res)).catch(next);
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
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
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
async function userCreationHandler(req, res) {
    const { email, password } = req.body;
    if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
    }
    if (!password) {
        res.status(400).json({ error: "Password is required" });
        return;
    }
    try {
        const hashedPassword = await hashPassword(password);
        const users = await createUser({ email, hashedPassword });
        res.set("Content-Type", "application/json; charset=utf-8");
        res.status(201).json({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt,
            isChirpyRed: users.isChirpyRed,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create user" });
    }
}
async function deleteAllUsersHandler(req, res) {
    if (config.platform !== "dev") {
        throw new ForbiddenError("Deleting all users is only allowed in dev environment");
    }
    try {
        await deleteAllUsers();
        res.status(200).json({ message: "All users deleted" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete users" });
    }
}
async function polkaWebhookHandler(req, res) {
    const apikey = await getAPIKey(req);
    if (apikey !== config.polkaKey) {
        res.status(401).json({ error: "Invalid API key" });
        return;
    }
    const { event } = req.body;
    if (event !== "user.upgraded") {
        res.status(204).send();
        return;
    }
    const { userId } = req.body.data;
    if (!userId) {
        res.status(400).json({ error: "User ID is required" });
        return;
    }
    try {
        const updatedUser = await upgradeUser(userId);
        if (!updatedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to upgrade user" });
    }
}
const migrationConfig = {
    migrationsFolder: "./src/db/migrations",
};
