import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ errors: err.errors.map(e => ({ field: e.path.join("."), message: e.message })) });
    }
    return res.status(400).json({ error: "Invalid request body" });
  }
};

interface ValidationSchema {
  parseAsync(data: unknown): Promise<unknown>;
}

interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

export function validate(schema: ValidationSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "issues" in error &&
        Array.isArray(error.issues)
      ) {
        res.status(400).json({
          error: "Validation failed",
          details: (error.issues as ValidationIssue[]).map((e) => ({
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