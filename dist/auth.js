import argon2 from "argon2";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import config from "./config.js";
export function makeJWT(userID, expiresIn, secret) {
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
        iss: "chirpy",
        sub: userID,
        iat: iat,
        exp: iat + expiresIn
    };
    return jwt.sign(payload, secret);
}
export function validateJWT(tokenString, secret) {
    const decoded = jwt.verify(tokenString, secret);
    if (typeof decoded === "object" && decoded !== null && typeof decoded.sub === "string") {
        return decoded.sub;
    }
    else {
        throw new Error("Invalid token");
    }
}
export async function hashPassword(password) {
    return argon2.hash(password);
}
;
export async function checkPasswordHash(password, hash) {
    return argon2.verify(hash, password);
}
;
export async function userAuthHandler(req, res) {
    const defaultExpiry = 3600;
    let expiresInSeconds;
    if (req.body.email) {
        const [result] = await db.select().from(users).where(eq(users.email, req.body.email));
        if (!result) {
            res.status(401).send({ error: "incorrect email or password" });
            return;
        }
        if (!await checkPasswordHash(req.body.password, result.hashedPassword)) {
            res.status(401).send({ error: "incorrect email or password" });
            return;
        }
        if (req.body.expiresInSeconds === undefined || req.body.expiresInSeconds > defaultExpiry) {
            expiresInSeconds = defaultExpiry;
        }
        else {
            expiresInSeconds = req.body.expiresInSeconds;
        }
        const token = makeJWT(result.id, expiresInSeconds, config.secret);
        const response = {
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
}
;
export function getBearerToken(req) {
    const token = req.get("Authorization");
    if (!token) {
        throw Error("header missing");
    }
    return token.replace(/^Bearer\s+/i, '').trim();
}
