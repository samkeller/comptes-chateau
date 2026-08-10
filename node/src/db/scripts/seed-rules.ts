import "reflect-metadata";
import { AppDataSource } from "../dataSource";
import { AccountLine } from "../../modules/accounts/entities/AccountLine";
import { AccountLineRule } from "../../modules/automatisations/entities/AccountLineRule";
import { normalizeLabel } from "../../modules/automatisations/utils/AccountLineRulesUtils";

interface PatternStats {
  totalCount: number;
  posteCounts: Map<number, number>;
  natureCounts: Map<number, number>;
}

interface ConfidentRule {
  pattern: string;
  posteId?: number;
  natureId?: number;
  accountId: number;
  occurrencesCount: number;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    const lineRepository = AppDataSource.getRepository(AccountLine);
    const ruleRepository = AppDataSource.getRepository(AccountLineRule);

    console.log("🔍 Chargement de l'historique des opérations...");

    const lines = await lineRepository.find({
      relations: ["poste", "nature", "account"],
      select: ["id", "label"],
    });

    /**
     * Regroupement des lignes par compte
     */
    const linesByAccount = new Map<number, AccountLine[]>();

    for (const line of lines) {
      const accountId = line.account.id;

      if (!linesByAccount.has(accountId)) {
        linesByAccount.set(accountId, []);
      }

      linesByAccount.get(accountId)!.push(line);
    }

    /**
     * Règles existantes
     */
    const existingRules = await ruleRepository.find({
      relations: ["account"],
      select: ["pattern"],
    });

    const existingKeys = new Set(
      existingRules.map((rule: any) => `${rule.account.id}:${rule.pattern}`)
    );

    for (const [accountId, accountLines] of linesByAccount) {
      const statsByPattern = new Map<string, PatternStats>();

      /**
       * Statistiques
       */
      for (const line of accountLines) {
        const pattern = normalizeLabel(line.label);

        if (!pattern || pattern.length < 3) {
          continue;
        }

        let stats = statsByPattern.get(pattern);

        if (!stats) {
          stats = {
            totalCount: 0,
            posteCounts: new Map(),
            natureCounts: new Map(),
          };

          statsByPattern.set(pattern, stats);
        }

        stats.totalCount++;

        if (line.poste) {
          stats.posteCounts.set(
            line.poste.id,
            (stats.posteCounts.get(line.poste.id) ?? 0) + 1
          );
        }

        if (line.nature) {
          stats.natureCounts.set(
            line.nature.id,
            (stats.natureCounts.get(line.nature.id) ?? 0) + 1
          );
        }
      }

      const rulesToInsert: ConfidentRule[] = [];

      /**
       * Génération des règles
       */
      for (const [pattern, stats] of statsByPattern) {
        if (stats.totalCount < 3) {
          continue;
        }

        const key = `${accountId}:${pattern}`;

        if (existingKeys.has(key)) {
          continue;
        }

        let posteId: number | undefined;
        let natureId: number | undefined;

        for (const [id, count] of stats.posteCounts) {
          if (count === stats.totalCount) {
            posteId = id;
            break;
          }
        }

        for (const [id, count] of stats.natureCounts) {
          if (count === stats.totalCount) {
            natureId = id;
            break;
          }
        }

        if (posteId === undefined && natureId === undefined) {
          continue;
        }

        rulesToInsert.push({
          accountId,
          pattern,
          posteId,
          natureId,
          occurrencesCount: stats.totalCount,
        });
      }

      if (rulesToInsert.length === 0) {
        console.log(
          `Compte ${accountId}: ✨ Aucune règle évidente à ajouter.`
        );
        continue;
      }

      await ruleRepository.insert(rulesToInsert as any);

      for (const rule of rulesToInsert) {
        existingKeys.add(`${rule.accountId}:${rule.pattern}`);
      }

      console.log(
        `Compte ${accountId}: ✅ ${rulesToInsert.length} règle(s) créée(s).`
      );
    }
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((error) => {
  console.error("❌ Erreur pendant le seeding :", error);
  throw error;
});