import express from "express";
import { BadRequestError } from "../../api/errors.js";
import { chirps } from "../schema.js";
import { db } from "../index.js";
import { asc, desc, eq } from "drizzle-orm";

export async function getChirpsHandler (req: express.Request, res: express.Response, authorId?: string, sort?: "asc" | "desc") {
    try {
        
        const authorId = (req.query.authorId as string);
        const sort = (req.query.sort as "asc" | "desc") || "asc";

        if (req.params.chirpId) {
            const [chirp] = await db.select().from(chirps).where(eq(chirps.id, req.params.chirpId as string));
            if (!chirp) {
                res.status(404).send({ error: "Chirp not found" });
            }
            
            return res.status(200).json(chirp);
        }
        
        let results;
        
        if (authorId) {
            results = await db.select().from(chirps).where(eq(chirps.userId, authorId)).orderBy(sort === "asc" ? asc(chirps.createdAt) : desc(chirps.createdAt));
        } else {
            results = await db.select().from(chirps).orderBy(sort === "asc" ? asc(chirps.createdAt) : desc(chirps.createdAt));
        }
        
        return res.status(200).json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
};