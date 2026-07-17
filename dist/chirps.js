import { BadRequestError } from "./errors.js";
export async function chirpValidationHandler(req, res) {
    const chirp = req.body.body;
    res.header("Content-Type", "application/json");
    if (!chirp || typeof chirp !== "string" || chirp.length === 0) {
        res.status(400).send({ error: "Something went wrong" });
        return;
    }
    if (chirp.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    const words = chirp.split(" ");
    const cleanedBody = [...words];
    const badWords = ["kerfuffle", "sharbert", "fornax"];
    for (const word of words) {
        if (badWords.includes(word.toLocaleLowerCase())) {
            cleanedBody.splice(words.indexOf(word), 1, "****");
        }
    }
    res.status(200).send({ cleanedBody: cleanedBody.join(" ") });
}
