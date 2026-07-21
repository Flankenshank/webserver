import express from "express";
import { middlewareLogResponses, middlewareMetricsInc } from "./middleware.js";
import config from "./config.js";
import { errorHandler, ForbiddenError } from "./errors.js";
import { chirpCreateHandler } from "./db/queries/chirps.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser, deleteAllUsers } from "./db/queries/users.js";
const app = express();
const PORT = 8080;
app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));
app.use(express.json());
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", fileserverHitsHandler);
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
    const { email } = req.body;
    if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
    }
    try {
        const users = await createUser({ email });
        res.set("Content-Type", "application/json; charset=utf-8");
        res.status(201).json({
            id: users.id,
            email: users.email,
            createdAt: users.createdAt,
            updatedAt: users.updatedAt
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
const migrationConfig = {
    migrationsFolder: "./src/db/migrations",
};
