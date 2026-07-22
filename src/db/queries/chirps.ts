import express from "express";
import { BadRequestError } from "../../errors.js";
import { chirps } from "../schema.js";
import { db } from "../index.js";
import { asc, eq } from "drizzle-orm";

export async function chirpCreateHandler(req: express.Request, res: express.Response) {
    const { body: chirp, userId } = req.body; 
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
        userId: userId
    })
    .returning();
    res.status(201).send(result);
}

export async function getChirpsHandler (req: express.Request, res: express.Response) {
    if (req.params.chirpId) {
        const [result] = await db.select().from(chirps).where(eq(chirps.id, req.params.chirpId as string));
        if (!result) {
            res.status(404).send({ error: "Chirp not found" });
            return;
        }
        res.status(200).json(result);
        return;
    }
    const result = await db.select().from(chirps).orderBy(asc(chirps.createdAt));
    res.status(200).json(result);
};