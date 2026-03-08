import { Request, Response, NextFunction } from "express";

export function requireAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (typeof req.session?.userId === "number") {
    return next();
  }

  return res.sendStatus(401);
}
