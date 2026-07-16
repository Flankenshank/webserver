import config from "./config.js";
export function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}
;
export function middlewareMetricsInc(req, res, next) {
    config.fileserverHits++;
    next();
}
export function errorHandler(err, req, res, next) {
    console.log(`${err.name}: ${err.message}`);
    res.status(500).json({
        error: "Something went wrong on our end"
    });
}
