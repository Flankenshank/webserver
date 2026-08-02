import argon2 from "argon2";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import config from "../config.js";
import { randomBytes } from "node:crypto";
import { getUserFromRefreshToken, insertRefreshToken, revokeToken } from "../db/queries/refresh.js";
import { UnauthorizedError } from "./errors.js";
export function makeJWT(userID, secret) {
    const iat = Math.floor(Date.now() / 1000);
    const payload = {
        iss: "chirpy",
        sub: userID,
        iat: iat,
        exp: iat + 3600
    };
    return jwt.sign(payload, secret);
}
export function validateJWT(tokenString, secret) {
    try {
        const decoded = jwt.verify(tokenString, secret);
        if (typeof decoded === "object" && decoded !== null && typeof decoded.sub === "string") {
            return decoded.sub;
        }
        else {
            throw new Error("Invalid token");
        }
    }
    catch {
        throw new UnauthorizedError("Invalid token");
    }
}
;
export async function hashPassword(password) {
    return argon2.hash(password);
}
;
export async function checkPasswordHash(password, hash) {
    return argon2.verify(hash, password);
}
;
export async function userAuthHandler(req, res) {
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
        const token = makeJWT(result.id, config.secret);
        const refreshToken = makeRefreshToken();
        const response = {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
            token,
            refreshToken,
            isChirpyRed: result.isChirpyRed,
        };
        await insertRefreshToken(refreshToken, result.id);
        res.status(200).json(response);
        return;
    }
    res.status(400).send({ error: "Email is required" });
}
;
export function getBearerToken(req) {
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
export function makeRefreshToken() {
    const refreshToken = randomBytes(32).toString('hex');
    return refreshToken;
}
export async function refreshTokenHandler(req, res) {
    try {
        const bearerToken = getBearerToken(req);
        const record = await getUserFromRefreshToken(bearerToken);
        const currentDate = new Date();
        if (!record || record.revokedAt || record.expiresAt < currentDate) {
            res.status(401).send({ error: "Refresh Token Invalid" });
            return;
        }
        const token = makeJWT(record.userId, config.secret);
        res.status(200).json({ token });
        return;
    }
    catch {
        return res.status(401).send({ error: "header missing" });
    }
}
;
export async function revokeTokenHandler(req, res) {
    try {
        const bearerToken = getBearerToken(req);
        await revokeToken(bearerToken);
        res.status(204).send();
        return;
    }
    catch {
        return res.status(401).send({ error: "Authentication failed" });
    }
}
export async function userUpdateHandler(req, res) {
    const token = getBearerToken(req);
    const validUserId = validateJWT(token, config.secret);
    const newEmail = req.body.email;
    const newPassword = await hashPassword(req.body.password);
    const [updatedUser] = await db
        .update(users)
        .set({
        hashedPassword: newPassword,
        email: newEmail,
    })
        .where(eq(users.id, validUserId))
        .returning({
        id: users.id,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        email: users.email,
    });
    return res.status(200).json(updatedUser);
}
