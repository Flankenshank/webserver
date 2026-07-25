import argon2 from "argon2";
import express from "express";
import type { Request } from "express";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { UserResponse } from "./db/queries/users.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { error } from "node:console";
import config from "./config.js";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const iat = Math.floor(Date.now() / 1000);
    const payload: payload = {
        iss: "chirpy",
        sub: userID,
        iat: iat,
        exp: iat + expiresIn
    };
    return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
    const decoded = jwt.verify(tokenString, secret) as { sub: string };
    if (typeof decoded === "object" && decoded !== null && typeof decoded.sub === "string") {
        return decoded.sub;
    } else {
        throw new Error("Invalid token");
    }
}

export async function hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
};

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
};

export async function userAuthHandler (req: express.Request, res: express.Response) {

    const defaultExpiry = 3600
    let expiresInSeconds: number;

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

    if (req.body.expiresInSeconds === undefined || req.body.expiresInSeconds > defaultExpiry) {
        expiresInSeconds = defaultExpiry
    } else {
        expiresInSeconds = req.body.expiresInSeconds
    }

    const token = makeJWT(result.id, expiresInSeconds, config.secret)
        
        const response: UserResponse = {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            token,
        };
        res.status(200).json(response);
        return;
    }
    res.status(400).send({ error: "Email is required" });
};

export function getBearerToken(req: Request): string {
    const token = req.get("Authorization")
    if (!token) {
        throw Error("header missing")
    } return token.replace(/^Bearer\s+/i, '').trim()
}