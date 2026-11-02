"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "issues" in error &&
                Array.isArray(error.issues)) {
                res.status(400).json({
                    error: "Validation failed",
                    details: error.issues.map((e) => ({
                        path: e.path.join("."),
                        message: e.message,
                    })),
                });
                return;
            }
            res.status(400).json({ error: "Invalid request data" });
        }
    };
}
