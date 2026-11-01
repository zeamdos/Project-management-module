import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../entities/User";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    orgId: number;
    role: UserRole;
    email: string;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Access token missing or malformed" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "Internal server configuration error" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      id: number;
      orgId: number;
      role: UserRole;
      email: string;
    };
    req.user = payload;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }
    next();
  };
}