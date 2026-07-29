import { db } from "../index.js";
import { refreshTokens } from "../schema.js";
import { eq } from "drizzle-orm";

export async function insertRefreshToken (token: string, userId: string) {
    const expdate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
  const [result] = await db
    .insert(refreshTokens)
    .values({
        token: token,
        userId,
        expiresAt: expdate,
        revokedAt: null
    })
    .returning();
  return result;
}

export async function getUserFromRefreshToken(refreshToken: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, refreshToken));

  return result;
}

export async function revokeToken (token: string) {
    const currentDate = new Date();
    await db
    .update(refreshTokens)
    .set({
        revokedAt: currentDate,
        updatedAt: currentDate,

})
    .where(eq(refreshTokens.token, token));
}