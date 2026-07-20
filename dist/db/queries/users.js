import { db } from "../index.js";
import { users } from "../schema.js";
import { ForbiddenError } from "../../errors.js";
export async function createUser(user) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function deleteAllUsers() {
    if (process.env.PLATFORM !== "dev") {
        throw ForbiddenError;
    }
    const result = await db.delete(users);
    return result;
}
