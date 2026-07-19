import { defineConfig } from "drizzle-kit";
import type { MigrationConfig } from "drizzle-orm/migrator";

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: "postgres://postgres:postgres@localhost:5432/chirpy?sslmode=disable",
  },
});

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};