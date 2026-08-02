import { db } from "../index.js";
import { NewUser, User, users } from "../schema.js";
import { eq } from "drizzle-orm";

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

export type UserResponse = Omit<User, "hashedPassword"> & {
  token: string,
  refreshToken: string;
};

export async function upgradeUser (id: string) {
  const [result] = await db
    .update(users)
    .set({ isChirpyRed: true })
    .where(eq(users.id, id))
    .returning();

  return result;
}