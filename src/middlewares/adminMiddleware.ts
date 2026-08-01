import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../models/auth/AuthenticatedRequest";

/**
 * Requires an authenticated admin. Chain it after authMiddleware, which is what
 * puts the user on the request.
 *
 * The role is read from the user record loaded on each request rather than from
 * a JWT claim, so revoking admin takes effect immediately instead of when the
 * token happens to expire.
 */
export const adminMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    res.sendStatus(401);
    return;
  }

  if (req.user.role !== "admin") {
    // 403, not 404: the caller is known, they simply may not do this.
    res.status(403).json({ message: "Administrator access required" });
    return;
  }

  next();
};
