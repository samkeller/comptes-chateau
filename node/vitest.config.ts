import { defineConfig } from "vitest/config";

import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
    test: {
        include: ["src/**/*.test.ts"],
        exclude: ["dist/**", "node_modules/**"],
        globals: true,
        environment: "node",
        setupFiles: ["./src/tests/testDbSetup.ts"]
    }
});