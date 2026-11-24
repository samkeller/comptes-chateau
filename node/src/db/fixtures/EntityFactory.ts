import type { DeepPartial, EntityManager, EntityTarget, ObjectLiteral, Repository } from "typeorm";

/**
 * Attributs passés à une factory : tout est optionnel, sauf les clés `Required`
 * (en pratique les clés étrangères, qu'une factory ne devine jamais).
 */
export type FactoryInput<T, Required extends keyof T = never> =
    DeepPartial<T> & { [K in Required]-?: DeepPartial<T[K]> };

/** Clés de `T` dont la valeur est un nombre. */
type NumericKeys<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

type CreateArgs<T, Required extends keyof T> = [Required] extends [never]
    ? [input?: FactoryInput<T, Required>]
    : [input: FactoryInput<T, Required>];

type CreateManyArgs<T, Required extends keyof T> = [Required] extends [never]
    ? [input?: FactoryInput<T, Required> | ((index: number) => FactoryInput<T, Required>)]
    : [input: FactoryInput<T, Required> | ((index: number) => FactoryInput<T, Required>)];

/**
 * Crée et persiste une entité : valeurs par défaut valides, écrasées par les attributs fournis.
 *
 * Une sous-classe ne fait qu'une chose : décrire les valeurs par défaut de son entité (`defaults`).
 * Elle ne crée jamais d'entités liées : les clés étrangères sont déclarées dans `Required`
 * et doivent être fournies par l'appelant.
 */
export abstract class EntityFactory<T extends ObjectLiteral, Required extends keyof T = never> {
    private sequence = 0;

    constructor(
        protected readonly manager: EntityManager,
        private readonly target: EntityTarget<T>,
    ) {}

    /**
     * Valeurs par défaut d'une nouvelle entité.
     * @param sequence Numéro croissant propre à cette factory, pour générer des valeurs uniques.
     */
    protected abstract defaults(sequence: number): DeepPartial<T> | Promise<DeepPartial<T>>;

    async create(...[input]: CreateArgs<T, Required>): Promise<T> {
        this.sequence += 1;
        const attributes = { ...(await this.defaults(this.sequence)), ...input } as DeepPartial<T>;
        return this.manager.save(this.target, attributes);
    }

    /** Crée `count` entités l'une après l'autre (les valeurs par défaut peuvent dépendre des précédentes). */
    async createMany(count: number, ...[input]: CreateManyArgs<T, Required>): Promise<T[]> {
        const created: T[] = [];
        for (let index = 0; index < count; index++) {
            const attributes = typeof input === "function" ? input(index) : input;
            created.push(await this.create(...([attributes] as CreateArgs<T, Required>)));
        }
        return created;
    }

    /** Crée une entité par attributs fournis, dans l'ordre. */
    async createEach(inputs: FactoryInput<T, Required>[]): Promise<T[]> {
        return this.createMany(inputs.length, ...([(index: number) => inputs[index]] as CreateManyArgs<T, Required>));
    }

    /** Plus grande valeur d'une colonne numérique (0 si la table est vide), pour les colonnes non générées par la base. */
    protected async maxOf(column: NumericKeys<T>): Promise<number> {
        return (await this.manager.getRepository(this.target).maximum(column as Parameters<Repository<T>["maximum"]>[0])) ?? 0;
    }
}
