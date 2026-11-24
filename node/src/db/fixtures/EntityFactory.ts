import type { DeepPartial, EntityManager, EntityTarget, ObjectLiteral, Repository } from "typeorm";

/**
 * Attributs passés à une factory : tout est optionnel, sauf les clés `Required`
 * (en pratique les clés étrangères, qu'une factory ne devine jamais).
 */
export type FactoryInput<T, Required extends keyof T = never> =
    DeepPartial<T> & { [K in Required]-?: DeepPartial<T[K]> };

/** Clés de `T` dont la valeur est un nombre. */
type NumericKeys<T> = { [K in keyof T]: T[K] extends number ? K : never }[keyof T];

/** L'argument est optionnel seulement si aucun attribut n'est obligatoire. */
type InputArg<Input> = object extends Input ? [input?: Input] : [input: Input];
type InputOrBuilderArg<Input> = object extends Input
    ? [input?: Input | ((index: number) => Input)]
    : [input: Input | ((index: number) => Input)];

/**
 * Crée et persiste une entité : valeurs par défaut valides, écrasées par les attributs fournis.
 *
 * Une sous-classe décrit les valeurs par défaut de son entité (`defaults`).
 * Elle ne crée jamais d'entités liées : les clés étrangères sont déclarées dans `Required`
 * et doivent être fournies par l'appelant.
 *
 * `Input` ne sert que si l'entité n'expose pas ses clés étrangères en colonnes (ex. `BudgetItem`) :
 * la factory accepte alors des ids et les traduit en relations dans `toAttributes`.
 */
export abstract class EntityFactory<
    T extends ObjectLiteral,
    Required extends keyof T = never,
    Input = FactoryInput<T, Required>,
> {
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

    /** Traduit les attributs reçus en attributs de l'entité (par défaut : tels quels). */
    protected toAttributes(input: Input): DeepPartial<T> {
        return input as DeepPartial<T>;
    }

    async create(...[input]: InputArg<Input>): Promise<T> {
        return this.createOne(input);
    }

    /** Crée `count` entités l'une après l'autre (les valeurs par défaut peuvent dépendre des précédentes). */
    async createMany(count: number, ...[input]: InputOrBuilderArg<Input>): Promise<T[]> {
        const created: T[] = [];
        for (let index = 0; index < count; index++) {
            created.push(await this.createOne(typeof input === "function" ? (input as (index: number) => Input)(index) : input));
        }
        return created;
    }

    /** Crée une entité par attributs fournis, dans l'ordre. */
    async createEach(inputs: Input[]): Promise<T[]> {
        const created: T[] = [];
        for (const input of inputs) {
            created.push(await this.createOne(input));
        }
        return created;
    }

    /** Plus grande valeur d'une colonne numérique (0 si la table est vide), pour les colonnes non générées par la base. */
    protected async maxOf(column: NumericKeys<T>): Promise<number> {
        return (await this.manager.getRepository(this.target).maximum(column as Parameters<Repository<T>["maximum"]>[0])) ?? 0;
    }

    private async createOne(input: Input | undefined): Promise<T> {
        this.sequence += 1;
        const defaults = await this.defaults(this.sequence);
        const attributes = input === undefined ? defaults : { ...defaults, ...this.toAttributes(input) };
        return this.manager.save(this.target, attributes as DeepPartial<T>);
    }
}
