// src/types/express-session.d.ts
import "express-session";

declare module "express-session" {
  interface SessionData {
    /**
     * Contrôle si la session est "déverrouillée" via le endpoint /auth/login
     */
    unlocked?: boolean;
  }
}
