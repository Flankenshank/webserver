import { describe, it, expect, beforeAll } from "vitest";
import { checkPasswordHash, hashPassword, makeJWT, validateJWT } from "../src/auth";

describe("Password Hashing", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  let hash1: string;
  let hash2: string;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  it("should return true for the correct password", async () => {
    const result = await checkPasswordHash(password1, hash1);
    expect(result).toBe(true);
  });
});

describe("JWT functions", () => {
  let token: string;
  const userID = "testUser";
  const expiresIn = 60;
  const secret = "supersecret";

  beforeAll(() => {
    token = makeJWT(userID, expiresIn, secret);
  });

  it("should create a valid JWT", () => {
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("should validate the JWT and return the correct user ID", () => {
    const validatedUserID = validateJWT(token, secret);
    expect(validatedUserID).toBe(userID);
  });

  it("should throw an error for an invalid JWT", () => {
    const invalidToken = token + "invalid";
    expect(() => validateJWT(invalidToken, secret)).toThrow();
  });
});

describe("JWT expired", () => {
  let token: string;
  const userID = "testUser";
  const expiresIn = 1;
  const secret = "supersecret";

  beforeAll(() => {
    token = makeJWT(userID, expiresIn, secret);
  });

  it("should create a valid JWT", () => {
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });
  
  it("should throw an error for an expired JWT", async () => {
    await new Promise((resolve) =>
        setTimeout(resolve, (expiresIn + 2) * 1000)
);
    expect(() => validateJWT(token, secret)).toThrow();
});
});
