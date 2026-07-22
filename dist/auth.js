import argon2 from "argon2";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
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
        const response = {
            id: result.id,
            email: result.email,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        };
        res.status(200).json(response);
        return;
    }
    res.status(400).send({ error: "Email is required" });
}
;
