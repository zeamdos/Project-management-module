"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY || "";
// Ensure key is valid (must be 32 bytes / 64 hex chars or padded/hashed)
function getKey() {
    if (!KEY_HEX) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("ENCRYPTION_KEY must be set in production!");
        }
        // Fallback development key
        return crypto_1.default.createHash("sha256").update("dev-fallback-encryption-key").digest();
    }
    if (KEY_HEX.length === 64) {
        return Buffer.from(KEY_HEX, "hex");
    }
    return crypto_1.default.createHash("sha256").update(KEY_HEX).digest();
}
function encrypt(text) {
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}
function decrypt(encryptedText) {
    if (!encryptedText)
        return "";
    const parts = encryptedText.split(":");
    if (parts.length !== 3)
        return encryptedText; // Fallback if unencrypted legacy data
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
