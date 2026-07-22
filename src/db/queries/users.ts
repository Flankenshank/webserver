import { UserInfoOptionsWithStringEncoding } from "node:os";
import { db } from "../index.js";
import { NewUser, User, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function deleteAllUsers() {
  const result = await db.delete(users);
  return result;
}

export type UserResponse = Omit<User, "hashedPassword">;