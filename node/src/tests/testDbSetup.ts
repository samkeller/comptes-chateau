/// <reference types="vite/client" />
import "reflect-metadata";
import { DataType, IMemoryDb, newDb } from "pg-mem";
import { DataSource, getMetadataArgsStorage } from "typeorm";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { User } from "../modules/core/entities/User";
import "reflect-metadata";

export const TEST_USER_ID = 1;
export const TEST_ACCOUNT_ID = 1;

/**
 * Découverte automatique de TOUTES les entités du projet.
 */
const entityModules = import.meta.glob("../modules/**/entities/*.ts", {
    eager: true
}) as Record<string, Record<string, unknown>>;

function collectEntities(): Function[] {
    console.info("[testDbSetup] Collecting entities...");
    const entities: Function[] = [];
    for (const mod of Object.values(entityModules)) {
        for (const exported of Object.values(mod)) {
            // Ne garde que les classes (les enums exportés dans le même fichier
            // — ex: AccountLineSource — ne sont pas des "function" côté JS compilé).
            if (typeof exported === "function" && exported.prototype) {
                entities.push(exported as Function);
            }
        }
    }
    console.info(`[testDbSetup] Collected ${entities.length} entities.`, JSON.stringify(entities.map(e => e.name)));
    return entities;
}

// -----------------------------------------------------------------------
// 2. Mock global de AppDataSource -> pointe vers la DB de test.
//    Le Proxy permet de différer la résolution jusqu'à ce que beforeAll
//    ait fini d'initialiser testDataSource (ordre garanti par Vitest).
// -----------------------------------------------------------------------
let testDataSource: DataSource;
type ColumnMetadataArgs = ReturnType<typeof getMetadataArgsStorage>["columns"][number];
const originalDateDefaults = new Map<ColumnMetadataArgs, ColumnMetadataArgs["options"]["default"]>();

vi.mock("../db/dataSource", () => ({
    AppDataSource: new Proxy({} as DataSource, {
        get(_target, prop) {
            if (!testDataSource) {
                throw new Error(
                    "Test DataSource pas encore prête — utilisation en dehors d'un hook/test ?"
                );
            }
            const value = (testDataSource as unknown as Record<string | symbol, unknown>)[prop];
            return typeof value === "function" ? (value as Function).bind(testDataSource) : value;
        }
    })
}));

// -----------------------------------------------------------------------
// 3. Cycle de vie : une DB par fichier de test, tables vidées entre chaque test.
// -----------------------------------------------------------------------
let db: IMemoryDb

beforeAll(async () => {
    console.info("[testDbSetup] Initializing test database...");
    db = newDb({ autoCreateForeignKeyIndices: true });

    // Stubs nécessaires pour que pg-mem simule un backend PostgreSQL.
    db.public.registerFunction({ name: "current_database", returns: DataType.text, implementation: () => "pgmem" });
    db.public.registerFunction({ name: "version", returns: DataType.text, implementation: () => "PostgreSQL 16.0" });
    db.public.registerFunction({ name: "current_schema", returns: DataType.text, implementation: () => "public" });

    for (const column of getMetadataArgsStorage().columns) {
        const defaultValue = column.options.default;
        const isCurrentDate = defaultValue === "CURRENT_DATE"
            || (typeof defaultValue === "function" && defaultValue() === "CURRENT_DATE");
        if (column.options.type === "date" && isCurrentDate) {
            originalDateDefaults.set(column, defaultValue);
            column.options.default = () => "CURRENT_DATE + INTERVAL '0 days'";
        }
    }

    testDataSource = db.adapters.createTypeormDataSource({
        type: "postgres",
        entities: collectEntities(),
        synchronize: true
    });


    await testDataSource.initialize();

});

beforeEach(async () => {
    // Créé un user de test
    await testDataSource.getRepository(User).save({
        id: TEST_USER_ID,
        username: "testuser",
        avatar: "default-avatar.png",
        kanbanAssignedTasks: [],
        passwordHash: "testpasswordhash",
        totalXp: 100
    });
    console.info(`[testDbSetup] Test user created with id : ${TEST_USER_ID}`);
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    await testDataSource.getRepository(Account).save({
        id: TEST_ACCOUNT_ID,
        label: "testaccount0",
        baseLineAmount: 0,
        baseLineEffectiveDate: oneYearAgo
    })
    console.info(`[testDbSetup] Test account created with id : ${TEST_ACCOUNT_ID}`);
});

afterEach(async () => {
    console.info("[testDbSetup] Clearing test database...");
    if (!testDataSource?.isInitialized) return;

    // TODO: Remplacer par un truncate bien propre (= redémarrer les id)
    // Vide toutes les tables (dans l'ordre inverse pour limiter les soucis de FK).
    for (const entity of [...testDataSource.entityMetadatas].reverse()) {
        await testDataSource.query(`DELETE FROM "${entity.tableName}"`);
    }
});

afterAll(async () => {
    console.info("[testDbSetup] Destroying test DataSource...");
    if (testDataSource?.isInitialized) {
        await testDataSource.destroy();
    }
    for (const [column, defaultValue] of originalDateDefaults) {
        column.options.default = defaultValue;
    }
    originalDateDefaults.clear();
});

export { testDataSource };