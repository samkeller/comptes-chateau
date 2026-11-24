/**
 * Données de développement.
 *
 *   npm run seed                               # liste les scénarios
 *   npm run seed -- <scénario>                 # (re)crée les données du scénario
 *   npm run seed -- <scénario> --clean         # les supprime
 *
 * ⚠️ Base de développement uniquement.
 */
import "reflect-metadata";
import { AppDataSource } from "../dataSource";
import { scenarios } from "./scenarios";
import { runScenario } from "./scenarios/runScenario";

function usage(): string {
    const list = scenarios.map((scenario) => `  ${scenario.name.padEnd(24)} ${scenario.description}`).join("\n");
    return `Usage : npm run seed -- <scénario> [--clean]\n\nScénarios :\n${list}`;
}

async function main(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
        throw new Error("Données de développement : refusé en production.");
    }

    const args = process.argv.slice(2);
    const name = args.find((arg) => !arg.startsWith("--"));
    if (!name) {
        console.log(usage());
        return;
    }
    const scenario = scenarios.find((candidate) => candidate.name === name);
    if (!scenario) {
        throw new Error(`Scénario inconnu : « ${name} ».\n\n${usage()}`);
    }

    const cleanOnly = args.includes("--clean");
    await AppDataSource.initialize();
    try {
        await runScenario(AppDataSource.manager, scenario, { cleanOnly });
    } finally {
        await AppDataSource.destroy();
    }
    console.log(cleanOnly ? `« ${scenario.name} » : données supprimées.` : `« ${scenario.name} » : données créées.`);
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
