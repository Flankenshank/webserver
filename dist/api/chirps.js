import { BadRequestError } from "./errors.js";
import { chirps } from "../db/schema.js";
import { getBearerToken, validateJWT } from "./auth.js";
import { config } from "../config.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
export async function chirpDeleteHandler(req, res) {
    const token = getBearerToken(req);
    const validUserId = validateJWT(token, config.secret);
    if (req.params.chirpId) {
        const [result] = await db.select().from(chirps).where(eq(chirps.id, req.params.chirpId));
        if (!result) {
            res.status(404).send({ error: "Chirp not found" });
            return;
        }
        if (result.userId !== validUserId) {
            res.status(403).send({ error: "You are not authorized to delete this chirp" });
            return;
        }
        await db.delete(chirps).where(eq(chirps.id, req.params.chirpId));
        res.status(204).send();
        return;
    }
    res.status(400).send({ error: "Chirp ID is required" });
}
;
export async function chirpCreateHandler(req, res) {
    const token = getBearerToken(req);
    const validUserId = validateJWT(token, config.secret);
    const { body: chirp } = req.body;
    res.header("Content-Type", "application/json");
    if (!chirp || typeof chirp !== "string" || chirp.length === 0) {
        res.status(400).send({ error: "Something went wrong" });
        return;
    }
    if (chirp.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    const words = chirp.split(" ");
    const cleanedBody = [...words];
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    for (const word of words) {
        if (badWords.includes(word.toLocaleLowerCase())) {
            cleanedBody.splice(words.indexOf(word), 1, "****");
        }
    }
    const [result] = await db
        .insert(chirps)
        .values({
        body: cleanedBody.join(" "),
        userId: validUserId
    })
        .returning();
    res.status(201).send(result);
}
;
