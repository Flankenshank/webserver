import argon2 from "argon2";
import express from "express";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { UserResponse } from "./db/queries/users.js";

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
};

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
};

export async function userAuthHandler (req: express.Request, res: express.Response) {
    if (req.body.email) {
        const [result] = await db.select().from(users).where(eq(users.email, req.body.email as string));
        if (!result) {
            res.status(401).send({ error: "incorrect email or password" });
            return;
        }
        if (!await checkPasswordHash(req.body.password, result.hashedPassword)) {
            res.status(401).send({ error: "incorrect email or password" });
            return;
        }
        
        const response: UserResponse = {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
        res.status(200).json(response);
        return;
    }
    res.status(400).send({ error: "Email is required" });
};
