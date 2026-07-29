import argon2 from "argon2";
import express from "express";
import type { Request, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { UserResponse } from "../db/queries/users.js";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config.js";
import { randomBytes } from "node:crypto";
import { getUserFromRefreshToken, insertRefreshToken, revokeToken } from "../db/queries/refresh.js";
import { UnauthorizedError } from "./errors.js";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, secret: string): string {
    const iat = Math.floor(Date.now() / 1000);
    const payload: payload = {
        iss: "chirpy",
        sub: userID,
        iat: iat,
        exp: iat + 3600
    };
    return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const decoded = jwt.verify(tokenString, secret) as { sub: string };
        if (typeof decoded === "object" && decoded !== null && typeof decoded.sub === "string") {
            return decoded.sub;
        } else {
            throw new Error("Invalid token");
        }
    } catch {
        throw new UnauthorizedError("Invalid token");
}
};

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

    const token = makeJWT(result.id, config.secret);
    const refreshToken = makeRefreshToken();
        
        const response: UserResponse = {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            token,
            refreshToken,
        };
        await insertRefreshToken(refreshToken, result.id);
        res.status(200).json(response);
        return;
    }
    res.status(400).send({ error: "Email is required" });
};

export function getBearerToken(req: Request): string {
    const authHeader = req.get("Authorization");
    
    if (!authHeader) {
        throw new UnauthorizedError("header missing");
    }
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer" || !parts[1]) {
        throw new UnauthorizedError("invalid header format");
    }

    return parts[1];
}


export function makeRefreshToken(): string {
const refreshToken = randomBytes(32).toString('hex')
return refreshToken;
}

export async function refreshTokenHandler (req: Request, res: Response) {
    try {
        const bearerToken = getBearerToken(req);
        const record = await getUserFromRefreshToken(bearerToken);
        const currentDate = new Date();
        if (!record || record.revokedAt || record.expiresAt < currentDate) {
            res.status(401).send({error: "Refresh Token Invalid"});
            return;
        }
        const token = makeJWT(record.userId, config.secret);
        res.status(200).json({ token });
        return;
    } catch {
        return res.status(401).send({error: "header missing"});
    }
};

export async function revokeTokenHandler (req: Request, res: Response) {
    try {
        const bearerToken = getBearerToken(req);
        await revokeToken(bearerToken);
        res.status(204).send();
        return;
    } catch {
        return res.status(401).send({ error: "Authentication failed" })
    }
}