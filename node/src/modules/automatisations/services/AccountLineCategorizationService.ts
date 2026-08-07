import { AppDataSource } from "../../../db/dataSource";
import { AccountLineRule } from "../entities/AccountLineRule";
import { AccountLine } from "../../accounts/entities/AccountLine";
import { AccountLinePoste } from "../../accounts/entities/AccountLinePoste";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { normalizeLabel } from "../../../utils/AccountLineRulesUtils";
import { AccountLineRuleValidationError } from "./rules/errors/AccountLineRuleErrors";

export interface SaveRuleDto {
    pattern: string;
    accountId: number;
    posteId?: number | null;
    natureId?: number | null;
}

export interface UnmappedPatternDto {
    pattern: string;
    count: number;
    account: {
        id: number,
        label: string
    },
    suggestedPoste: {
        id: number,
        label: string,
        color: string
    } | null
    suggestedNature: {
        id: number,
        label: string,
        color: string
    } | null
}

interface PatternAggregation {
    pattern: string;
    count: number;
    accountId: number;
    accountLabel: string;
    posteFrequencies: Map<number, { count: number; poste: AccountLinePoste }>;
    natureFrequencies: Map<number, { count: number; nature: AccountLineNature }>;
}

export default class AccountLineCategorizationService {
    private ruleRepo = AppDataSource.getRepository(AccountLineRule);
    private lineRepo = AppDataSource.getRepository(AccountLine);
    private FREQUENCY_THRESHOLD = 3; // Seuil de fréquence pour suggérer un poste ou une nature

    /**
     * Récupère toutes les règles de catégorisation existantes, avec leurs postes et natures associés.
     * @returns 
     */
    async getAll(): Promise<AccountLineRule[]> {
        return this.ruleRepo.find({
            relations: ["poste", "nature"],
            order: { pattern: "ASC" },
        });
    }

    /**
     * Crée une nouvelle règle de catégorisation à partir du motif (pattern) fourni, en normalisant le motif et en associant les postes et natures si spécifiés.
     * @param payload 
     * @returns 
     */
    async create(payload: SaveRuleDto): Promise<AccountLineRule> {
        const cleanPattern = normalizeLabel(payload.pattern);
        if (!cleanPattern) {
            throw new AccountLineRuleValidationError("Le motif (pattern) ne peut pas être vide.");
        }
        else if (!payload.posteId && !payload.natureId) {
            throw new AccountLineRuleValidationError("Au moins un poste ou une nature doit être associé à la règle.");
        }

        const rule = new AccountLineRule();
        rule.pattern = cleanPattern;
        rule.accountId = payload.accountId;
        rule.posteId = payload.posteId || null;
        rule.natureId = payload.natureId || null;
        rule.occurrencesCount = await this.countOccurrences(cleanPattern);

        return this.ruleRepo.save(rule);
    }

    async delete(id: number): Promise<void> {
        await this.ruleRepo.delete(id);
    }

    /**
     * Extrait les libellés fréquents non encore associés à une règle,
     * avec les suggestions de poste et nature les plus fréquents.
     * La fréquence est définie par le seuil FREQUENCY_THRESHOLD (3 occurences minimum).
     * 
     */
    async getUnmapped(): Promise<UnmappedPatternDto[]> {
        // 1. Charger les règles existantes pour exclure leurs patterns
        const existingRules = await this.ruleRepo.find({ select: ["pattern"] });
        const existingPatterns = new Set(existingRules.map((r) => r.pattern));

        // 2. Charger l'historique avec les relations associées (1 seule requête SQL !)
        const lines = await this.lineRepo.find({
            relations: ["poste", "nature", "account"],
            select: ["id", "label"],
        });

        // 3. Agrégation en mémoire
        const aggregations = new Map<string, PatternAggregation>();

        for (const line of lines) {
            const cleanPattern = normalizeLabel(line.label);
            if (!cleanPattern || cleanPattern.length < this.FREQUENCY_THRESHOLD) continue;

            // Ignorer si une règle existe déjà
            if (existingPatterns.has(cleanPattern)) continue;

            let agg = aggregations.get(cleanPattern);
            if (!agg) {
                agg = {
                    pattern: cleanPattern,
                    count: 0,
                    accountId: line.account.id,
                    accountLabel: line.account.label,
                    posteFrequencies: new Map(),
                    natureFrequencies: new Map(),
                };
                aggregations.set(cleanPattern, agg);
            }

            agg.count += 1;

            if (line.poste) {
                const current = agg.posteFrequencies.get(line.poste.id) ?? { count: 0, poste: line.poste };
                agg.posteFrequencies.set(line.poste.id, { count: current.count + 1, poste: line.poste });
            }

            if (line.nature) {
                const current = agg.natureFrequencies.get(line.nature.id) ?? { count: 0, nature: line.nature };
                agg.natureFrequencies.set(line.nature.id, { count: current.count + 1, nature: line.nature });
            }
        }

        // 4. Formater et trier les candidats pour l'IHM
        const result: UnmappedPatternDto[] = Array.from(aggregations.values())
            .sort((a, b) => b.count - a.count)
            .map((agg) => {
                // Trouver le poste le plus fréquent
                const topPosteEntry = Array.from(agg.posteFrequencies.values()).sort(
                    (a, b) => b.count - a.count
                )[0];

                // Trouver la nature la plus fréquente
                const topNatureEntry = Array.from(agg.natureFrequencies.values()).sort(
                    (a, b) => b.count - a.count
                )[0];

                return {
                    pattern: agg.pattern,
                    count: agg.count,
                    account: {
                        id: agg.accountId,
                        label: agg.accountLabel
                    },
                    suggestedPoste: topPosteEntry ? {
                        id: topPosteEntry.poste.id,
                        label: topPosteEntry.poste.label,
                        color: topPosteEntry.poste.color
                    } : null,
                    suggestedNature: topNatureEntry ? {
                        id: topNatureEntry.nature.id,
                        label: topNatureEntry.nature.label,
                        color: topNatureEntry.nature.color
                    } : null,
                };
            });

        return result;
    }

    async updateById(id: number, body: SaveRuleDto): Promise<AccountLineRule> {
        const existing = await this.ruleRepo.findOne({ where: { id } })

        if (!existing) {
            throw new AccountLineRuleValidationError(`Categorization d'id ${id} introuvable`)
        }

        existing.accountId = body.accountId;
        existing.pattern = body.pattern;
        existing.natureId = body.natureId || null;
        existing.posteId = body.posteId || null;

        return await this.ruleRepo.save(existing);
    }

    private countOccurrences(pattern: string): Promise<number> {
        return this.lineRepo.count({
            where: {
                label: pattern,
            },
        });
    }
}