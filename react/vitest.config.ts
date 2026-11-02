import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Niveau de log partagé back/front (racine).
dotenv.config({ path: path.resolve(__dirname, "../.env.test"), quiet: true });

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["dist/**", "node_modules/**"]
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    }
});
