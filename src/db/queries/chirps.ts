import express from "express";
import { BadRequestError } from "../../errors.js";
import { chirps } from "../schema.js";
import { db } from "../index.js";

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
