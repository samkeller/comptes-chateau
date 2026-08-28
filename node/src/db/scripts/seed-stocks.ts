import "reflect-metadata";
import { EntityManager } from "typeorm";
import { AppDataSource } from "../dataSource";
import { StockItem } from "../../modules/stocks/entities/StockItem";
import { StockLocation } from "../../modules/stocks/entities/StockLocation";
import { StockMovement } from "../../modules/stocks/entities/StockMovement";
import { StockUnit } from "../../modules/stocks/entities/StockUnit";
import { StockUnitStatus } from "../../modules/stocks/dto/StockUnitStatus";

const SEED_SOURCE = "seed";

interface UnitTemplate {
    /** Nombre d'unites physiques a creer avec ce gabarit */
    unitsCount: number;
    quantity: number;
    unit: string;
    label?: string;
    /** Nombre de jours avant/apres aujourd'hui pour la DLC (null = pas de DLC) */
    expiresInDays?: number | null;
    /** Nombre de jours dans le passe pour la date d'entree en stock */
    boughtDaysAgo: number;
    /** Repartition des unites: index de lieu dans LOCATION_FIXTURES */
    locationIndex: number;
    /** Statut final de l'unite (les unites non disponibles generent le mouvement de sortie) */
    status?: StockUnitStatus;
}

interface ItemFixture {
    label: string;
    barcode: string | null;
    defaultUnit: string;
    imageUrl: string | null;
    units: UnitTemplate[];
}

const LOCATION_FIXTURES: string[] = [
    "Cellier",
    "Congelateur garage",
    "Frigo cuisine",
    "Placard cuisine",
    "Cave a vin",
];

const CELLIER = 0;
const CONGELATEUR = 1;
const FRIGO = 2;
const PLACARD = 3;
const CAVE = 4;

const ITEM_FIXTURES: ItemFixture[] = [
    {
        label: "Lait demi-ecreme 1L",
        barcode: "3256540000117",
        defaultUnit: "L",
        imageUrl: null,
        units: [
            { unitsCount: 4, quantity: 1, unit: "L", expiresInDays: 21, boughtDaysAgo: 5, locationIndex: PLACARD },
            { unitsCount: 2, quantity: 1, unit: "L", expiresInDays: 4, boughtDaysAgo: 25, locationIndex: FRIGO },
            { unitsCount: 3, quantity: 1, unit: "L", expiresInDays: -3, boughtDaysAgo: 40, locationIndex: FRIGO, status: "CONSUMED" },
        ],
    },
    {
        label: "Pates penne 500g",
        barcode: "3038350203007",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 5, quantity: 500, unit: "g", expiresInDays: 400, boughtDaysAgo: 30, locationIndex: PLACARD },
            { unitsCount: 2, quantity: 500, unit: "g", expiresInDays: 380, boughtDaysAgo: 60, locationIndex: CELLIER, status: "CONSUMED" },
        ],
    },
    {
        label: "Riz basmati 1kg",
        barcode: "3017800238592",
        defaultUnit: "kg",
        imageUrl: null,
        units: [
            { unitsCount: 3, quantity: 1, unit: "kg", expiresInDays: 550, boughtDaysAgo: 45, locationIndex: PLACARD },
        ],
    },
    {
        label: "Cafe moulu 250g",
        barcode: "8000070025004",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 250, unit: "g", expiresInDays: 300, boughtDaysAgo: 12, locationIndex: PLACARD },
            { unitsCount: 1, quantity: 250, unit: "g", expiresInDays: 120, boughtDaysAgo: 90, locationIndex: PLACARD, status: "CONSUMED" },
        ],
    },
    {
        label: "Filet de poulet",
        barcode: null,
        defaultUnit: "kg",
        imageUrl: null,
        units: [
            { unitsCount: 4, quantity: 0.45, unit: "kg", label: "Sachet sous vide", expiresInDays: 90, boughtDaysAgo: 10, locationIndex: CONGELATEUR },
            { unitsCount: 1, quantity: 0.45, unit: "kg", label: "Sachet sous vide", expiresInDays: -10, boughtDaysAgo: 120, locationIndex: CONGELATEUR },
        ],
    },
    {
        label: "Steak hache 15% MG",
        barcode: "3560070397181",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 6, quantity: 125, unit: "g", label: "Portion", expiresInDays: 150, boughtDaysAgo: 20, locationIndex: CONGELATEUR },
        ],
    },
    {
        label: "Petits pois surgeles 750g",
        barcode: "3276556000141",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 750, unit: "g", expiresInDays: 500, boughtDaysAgo: 35, locationIndex: CONGELATEUR },
        ],
    },
    {
        label: "Beurre doux 250g",
        barcode: "3159470001030",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 250, unit: "g", expiresInDays: 35, boughtDaysAgo: 8, locationIndex: FRIGO },
        ],
    },
    {
        label: "Yaourt nature x8",
        barcode: "3033490004125",
        defaultUnit: "pack",
        imageUrl: null,
        units: [
            { unitsCount: 1, quantity: 1, unit: "pack", expiresInDays: 14, boughtDaysAgo: 3, locationIndex: FRIGO },
            { unitsCount: 1, quantity: 1, unit: "pack", expiresInDays: 2, boughtDaysAgo: 18, locationIndex: FRIGO },
        ],
    },
    {
        label: "Oeufs plein air x12",
        barcode: "3250390000112",
        defaultUnit: "boite",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 1, unit: "boite", expiresInDays: 18, boughtDaysAgo: 6, locationIndex: FRIGO },
        ],
    },
    {
        label: "Tomates pelees 400g",
        barcode: "8003100050014",
        defaultUnit: "g",
        imageUrl: null,
        units: [
            { unitsCount: 8, quantity: 400, unit: "g", expiresInDays: 700, boughtDaysAgo: 50, locationIndex: CELLIER },
        ],
    },
    {
        label: "Huile d'olive vierge extra 75cl",
        barcode: "3245390056118",
        defaultUnit: "cl",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 75, unit: "cl", expiresInDays: 600, boughtDaysAgo: 70, locationIndex: CELLIER },
        ],
    },
    {
        label: "Farine T55 1kg",
        barcode: "3175680011480",
        defaultUnit: "kg",
        imageUrl: null,
        units: [
            { unitsCount: 3, quantity: 1, unit: "kg", expiresInDays: 320, boughtDaysAgo: 40, locationIndex: PLACARD },
        ],
    },
    {
        label: "Sucre en poudre 1kg",
        barcode: "3165430000101",
        defaultUnit: "kg",
        imageUrl: null,
        units: [
            { unitsCount: 2, quantity: 1, unit: "kg", expiresInDays: null, boughtDaysAgo: 100, locationIndex: PLACARD },
        ],
    },
    {
        label: "Papier toilette x12",
        barcode: "3086126500128",
        defaultUnit: "pack",
        imageUrl: null,
        units: [
            { unitsCount: 3, quantity: 1, unit: "pack", expiresInDays: null, boughtDaysAgo: 15, locationIndex: CELLIER },
        ],
    },
    {
        label: "Lessive liquide 3L",
        barcode: "8006540000113",
        defaultUnit: "L",
        imageUrl: null,
        units: [
            { unitsCount: 1, quantity: 3, unit: "L", expiresInDays: null, boughtDaysAgo: 22, locationIndex: CELLIER },
        ],
    },
    {
        label: "Croquettes chat 4kg",
        barcode: "3182550702126",
        defaultUnit: "kg",
        imageUrl: null,
        units: [
            { unitsCount: 1, quantity: 4, unit: "kg", expiresInDays: 240, boughtDaysAgo: 14, locationIndex: CELLIER },
        ],
    },
    {
        label: "Biere blonde 33cl",
        barcode: "3080216000107",
        defaultUnit: "cl",
        imageUrl: null,
        units: [
            { unitsCount: 12, quantity: 33, unit: "cl", expiresInDays: 260, boughtDaysAgo: 28, locationIndex: CAVE },
        ],
    },
    {
        label: "Bordeaux rouge 75cl",
        barcode: "3263859550012",
        defaultUnit: "cl",
        imageUrl: null,
        units: [
            { unitsCount: 6, quantity: 75, unit: "cl", label: "Millesime 2019", expiresInDays: 1200, boughtDaysAgo: 200, locationIndex: CAVE },
            { unitsCount: 2, quantity: 75, unit: "cl", label: "Millesime 2018", expiresInDays: 900, boughtDaysAgo: 400, locationIndex: CAVE, status: "CONSUMED" },
        ],
    },
    {
        label: "Eau petillante 1.25L",
        barcode: "3068320115108",
        defaultUnit: "L",
        imageUrl: null,
        units: [
            { unitsCount: 6, quantity: 1.25, unit: "L", expiresInDays: 330, boughtDaysAgo: 18, locationIndex: CAVE },
        ],
    },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function addDays(base: Date, days: number): Date {
    return new Date(base.getTime() + days * MS_PER_DAY);
}

function toDateOnly(date: Date): string {
    return date.toISOString().slice(0, 10);
}

async function purgeStocks(entityManager: EntityManager): Promise<void> {
    await entityManager.query(`DELETE FROM "stock_movement"`);
    await entityManager.query(`DELETE FROM "stock_unit"`);
    await entityManager.query(`DELETE FROM "stock_item"`);
    await entityManager.query(`DELETE FROM "stock_location"`);
}

async function seedStocks(reset: boolean): Promise<void> {
    await AppDataSource.initialize();

    try {
        await AppDataSource.transaction(async (entityManager) => {
            if (reset) {
                console.log("🧹 Purge des donnees stocks existantes...");
                await purgeStocks(entityManager);
            }

            const locationRepo = entityManager.getRepository(StockLocation);
            const itemRepo = entityManager.getRepository(StockItem);
            const unitRepo = entityManager.getRepository(StockUnit);
            const movementRepo = entityManager.getRepository(StockMovement);

            const existingItemsCount = await itemRepo.count();
            if (existingItemsCount > 0 && !reset) {
                console.log("⏭️  Des produits existent deja, seed ignore (utiliser --reset pour repartir de zero)");
                return;
            }

            const now = new Date();

            const locations = await locationRepo.save(
                LOCATION_FIXTURES.map((label) => locationRepo.create({ label })),
            );
            console.log(`📍 ${locations.length} lieux de stockage crees`);

            let unitsCreated = 0;
            let movementsCreated = 0;

            for (const itemFixture of ITEM_FIXTURES) {
                const item = await itemRepo.save(itemRepo.create({
                    label: itemFixture.label,
                    barcode: itemFixture.barcode,
                    defaultUnit: itemFixture.defaultUnit,
                    imageUrl: itemFixture.imageUrl,
                }));

                for (const template of itemFixture.units) {
                    const location = locations[template.locationIndex];
                    const status: StockUnitStatus = template.status ?? "AVAILABLE";
                    const intakeDate = addDays(now, -template.boughtDaysAgo);
                    const expirationDate = template.expiresInDays === null || template.expiresInDays === undefined
                        ? null
                        : toDateOnly(addDays(now, template.expiresInDays));

                    for (let unitIndex = 0; unitIndex < template.unitsCount; unitIndex += 1) {
                        const unit = await unitRepo.save(unitRepo.create({
                            itemId: item.id,
                            locationId: location.id,
                            quantity: template.quantity,
                            unit: template.unit,
                            expirationDate,
                            label: template.label ?? null,
                            status,
                        }));
                        unitsCreated += 1;

                        await movementRepo.save(movementRepo.create({
                            itemId: item.id,
                            unitId: unit.id,
                            toLocationId: location.id,
                            type: "IN",
                            quantity: unit.quantity,
                            occurredAt: intakeDate,
                            source: SEED_SOURCE,
                        }));
                        movementsCreated += 1;

                        if (status === "AVAILABLE") {
                            continue;
                        }

                        // Une unite consommee/jetee doit avoir son mouvement de sortie pour rester coherente avec l'historique
                        await movementRepo.save(movementRepo.create({
                            itemId: item.id,
                            unitId: unit.id,
                            fromLocationId: location.id,
                            type: "OUT",
                            quantity: unit.quantity,
                            occurredAt: addDays(intakeDate, Math.min(template.boughtDaysAgo, 7)),
                            source: SEED_SOURCE,
                        }));
                        movementsCreated += 1;
                    }
                }
            }

            console.log(`📦 ${ITEM_FIXTURES.length} produits crees`);
            console.log(`🔢 ${unitsCreated} unites physiques creees`);
            console.log(`🔁 ${movementsCreated} mouvements crees`);
        });

        console.log("✅ Fixtures stocks appliquees");
    } finally {
        await AppDataSource.destroy();
    }
}

seedStocks(process.argv.includes("--reset")).catch((error: unknown) => {
    console.error("❌ Echec du seed stocks", error);
    process.exit(1);
});
