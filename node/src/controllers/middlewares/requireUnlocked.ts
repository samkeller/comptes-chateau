import { Request, Response, NextFunction } from "express";

export function requireUnlocked(req: Request, res: Response, next: NextFunction) {
  if (req.session?.unlocked === true) return next();
  res.sendStatus(401);
}

