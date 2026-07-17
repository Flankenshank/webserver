process.loadEnvFile();
function envOrThrow(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}
export const config = {
    fileserverHits: 0,
    dbURL: envOrThrow("DB_URL")
};
export default config;
