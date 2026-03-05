import { DataType, IMemoryDb, newDb } from "pg-mem";

function SetupTestDb(): IMemoryDb {
    const db = newDb({ autoCreateForeignKeyIndices: true });

    db.public.registerFunction({
        name: "current_database",
        returns: DataType.text,
        implementation: () => "pgmem"
    });
    db.public.registerFunction({
        name: "version",
        returns: DataType.text,
        implementation: () => "PostgreSQL 16.0"
    });
    db.public.registerFunction({
        name: "current_schema",
        returns: DataType.text,
        implementation: () => "public"
    });

    return db;
}

export default SetupTestDb;