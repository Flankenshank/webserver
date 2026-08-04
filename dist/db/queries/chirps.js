import { chirps } from "../schema.js";
import { db } from "../index.js";
import { asc, desc, eq } from "drizzle-orm";
export async function getChirpsHandler(req, res, authorId, sort) {
    try {
        const authorId = req.query.authorId;
        const sort = req.query.sort || "asc";
        if (req.params.chirpId) {
            const [chirp] = await db.select().from(chirps).where(eq(chirps.id, req.params.chirpId));
            if (!chirp) {
                res.status(404).send({ error: "Chirp not found" });
            }
            return res.status(200).json(chirp);
        }
        let results;
        if (authorId) {
            results = await db.select().from(chirps).where(eq(chirps.userId, authorId)).orderBy(sort === "asc" ? asc(chirps.createdAt) : desc(chirps.createdAt));
        }
        else {
            results = await db.select().from(chirps).orderBy(sort === "asc" ? asc(chirps.createdAt) : desc(chirps.createdAt));
        }
        return res.status(200).json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
}
;
