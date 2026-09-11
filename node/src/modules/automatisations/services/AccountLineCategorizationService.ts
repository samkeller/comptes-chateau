import { AppDataSource } from "../../../db/dataSource";
import { AccountLineRule } from "../entities/AccountLineRule";
import { AccountLinePoste } from "../../accounts/entities/AccountLinePoste";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { normalizeAccountLineRuleLabel, normalizeForMatching } from "../utils/AccountLineRulesUtils";
import { AccountLineRuleValidationError } from "./errors/AccountLineRuleErrors";
import UserXpService from "../../core/services/UserXpService";
import { EntityManager, Like, Repository } from "typeorm";
import type { SaveAccountLineRuleRequest, UnmappedAccountLineRuleResponse } from "@chocosous/shared";
import AccountLineService from "../../accounts/services/AccountLineService";
import PosteService from "../../accounts/services/PosteService";

interface PatternAggregation {
    pattern: string;
    label: string;
    count: number;
    accountId: number;
    accountLabel: string;
    posteFrequencies: Map<number, { count: number; poste: AccountLinePoste }>;
    natureFrequencies: Map<number, { count: number; nature: AccountLineNature }>;
}

export default class AccountLineCategorizationService {
    private readonly ruleRepo: Repository<AccountLineRule>;
    private readonly accountLineService: AccountLineService;
    private readonly posteService: PosteService;
    private readonly userXpService: UserXpService;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.ruleRepo = manager.getRepository(AccountLineRule);
        this.accountLineService = new AccountLineService(manager);
        this.posteService = new PosteService(manager);
        this.userXpService = new UserXpService(manager);
    }

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
     * Recherche les règles de catégorisation correspondant au motif (pattern) fourni, après normalisation du motif.
     * @param pattern 
     * @returns 
     */
    async search(pattern: string): Promise<AccountLineRule[]> {
        const cleanPattern = normalizeForMatching(pattern);

        if (!cleanPattern) return []; // Pas de pattern valide, retourner un tableau vide

        return this.ruleRepo.find({
            where: { pattern: Like(`%${cleanPattern}%`) },
            relations: ["poste", "nature"],
            order: { pattern: "ASC" },
        });
    }

    /**
     * Crée une nouvelle règle de catégorisation à partir du motif (pattern) fourni, en normalisant le motif et en associant les postes et natures si spécifiés.
     * @param payload 
     * @returns 
     */
    async create(payload: SaveAccountLineRuleRequest, creatorId: number): Promise<AccountLineRule> {
        const cleanPattern = normalizeForMatching(payload.label);
        if (!cleanPattern) {
            throw new AccountLineRuleValidationError("Le motif (pattern) ne peut pas être vide.");
        }
        else if (!payload.posteId && !payload.natureId) {
            throw new AccountLineRuleValidationError("Au moins un poste ou une nature doit être associé à la règle.");
        }

        const rule = new AccountLineRule();
        rule.pattern = cleanPattern;
        rule.label = normalizeAccountLineRuleLabel(payload.label);
        rule.accountId = payload.accountId;
        rule.posteId = payload.posteId || null;
        rule.natureId = payload.natureId || null;
        rule.occurrencesCount = await this.countOccurrences(cleanPattern, payload.accountId);

        const createdRule = await this.ruleRepo.save(rule);

        const count = [rule.posteId, rule.natureId].filter(Boolean).length;
        // Ajout xp utilisateur.
        await this.userXpService.addXPForUser(creatorId, "ACCOUNT_LINE_RULE_CREATED", count);

        return this.getRuleWithRelations(createdRule.id);
    }

    async delete(id: number): Promise<void> {
        await this.ruleRepo.delete(id);
    }

    /**
     * Extrait les libellés fréquents non encore associés à une règle,
     * avec les suggestions de poste et nature les plus fréquents.
     * La fréquence est définie par le seuil FREQUENCY_THRESHOLD (3 occurrences minimum).
     * 
     */
    async getUnmapped(): Promise<UnmappedAccountLineRuleResponse[]> {
        // 1. Charger les règles existantes pour exclure leurs patterns
        const existingRules = await this.ruleRepo.find({ select: ["pattern", "label", "accountId"] });
        const existingPatterns = new Set(
            existingRules.map((r) => this.getPatternKey(r.accountId, r.pattern))
        );

        // 2. Charger l'historique avec les relations associées (1 seule requête SQL !)
        const lines = await this.accountLineService.getCategorizationHistory();

        // 3. Agrégation en mémoire
        const aggregations = new Map<string, PatternAggregation>();

        for (const line of lines) {
            const cleanPattern = normalizeForMatching(line.label);
            if (!cleanPattern) continue;
            const patternKey = this.getPatternKey(line.accountId, cleanPattern);

            // Ignorer si une règle existe déjà
            if (existingPatterns.has(patternKey)) continue;

            let agg = aggregations.get(patternKey);
            if (!agg) {
                agg = {
                    pattern: cleanPattern,
                    label: normalizeAccountLineRuleLabel(line.label),
                    count: 0,
                    accountId: line.account.id,
                    accountLabel: line.account.label,
                    posteFrequencies: new Map(),
                    natureFrequencies: new Map(),
                };
                aggregations.set(patternKey, agg);
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
        const result: UnmappedAccountLineRuleResponse[] = Array.from(aggregations.values())
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
                    agg,
                    topPosteEntry,
                    topNatureEntry,
                };
            })
            .filter(({ agg, topPosteEntry, topNatureEntry }) => {
                const hasSuggestion = Boolean(topPosteEntry || topNatureEntry);
                return agg.count >= this.FREQUENCY_THRESHOLD && hasSuggestion;
            })
            .sort((a, b) => b.agg.count - a.agg.count)
            .map(({ agg, topPosteEntry, topNatureEntry }) => ({
                pattern: agg.pattern,
                label: agg.label,
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
            }));

        return result;
    }

    async updateById(id: number, body: SaveAccountLineRuleRequest): Promise<AccountLineRule> {
        const existing = await this.ruleRepo.findOne({ where: { id } })

        if (!existing) {
            throw new AccountLineRuleValidationError(`Categorization d'id ${id} introuvable`)
        }

        const cleanPattern = normalizeForMatching(body.label);
        if (!cleanPattern) {
            throw new AccountLineRuleValidationError("Le motif (pattern) ne peut pas être vide.");
        }
        if (body.posteId) {
            const poste = await this.posteService.getById(body.posteId, body.accountId);

            if (!poste) {
                throw new AccountLineRuleValidationError(
                    `Le poste d'id ${body.posteId} n'existe pas pour le compte ${body.accountId}.`
                );
            }
        }

        existing.accountId = body.accountId;
        existing.pattern = cleanPattern;
        existing.label = normalizeAccountLineRuleLabel(body.label);
        existing.natureId = body.natureId || null;
        existing.posteId = body.posteId || null;
        existing.occurrencesCount = await this.countOccurrences(cleanPattern, body.accountId);

        const updatedRule = await this.ruleRepo.save(existing);

        return this.getRuleWithRelations(updatedRule.id);
    }

    private async countOccurrences(pattern: string, accountId: number): Promise<number> {
        const normalizedPattern = normalizeForMatching(pattern);
        if (!normalizedPattern) {
            return 0;
        }

        const lines = await this.accountLineService.getLabelsByAccount(accountId);

        return lines.reduce((count, line) => {
            return normalizeForMatching(line.label) === normalizedPattern ? count + 1 : count;
        }, 0);
    }


    private async getRuleWithRelations(id: number): Promise<AccountLineRule> {
        const hydratedRule = await this.ruleRepo.findOne({
            where: { id },
            relations: ["poste", "nature"],
        });

        if (!hydratedRule) {
            throw new AccountLineRuleValidationError(`Categorization d'id ${id} introuvable`);
        }

        return hydratedRule;
    }

    private getPatternKey(accountId: number | null, pattern: string): string {
        return `${accountId ?? "none"}:${pattern}`;
    }
}