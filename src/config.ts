process.loadEnvFile();

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
  platform: string;
};

type DBConfig = {
  url: string;
  migrationConfig: {
    migrationsFolder: string;
  };
};

export const config: APIConfig & { db: DBConfig } = {
  fileserverHits: 0,
  dbURL: envOrThrow("DB_URL"),
  platform: envOrThrow("PLATFORM"),
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig: {
      migrationsFolder: "./src/db/migrations",
    },
  },
};

export default config;