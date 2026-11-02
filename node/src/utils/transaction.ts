import type { EntityManager } from "typeorm";

/**
 * Exécute `work` de façon atomique, sans transaction imbriquée inutile.
 * - Si le manager appartient déjà à une transaction active, on la réutilise :
 *   l'atomicité est garantie par la transaction englobante (commit/rollback communs)
 *   et on évite le SAVEPOINT que TypeORM émettrait pour une transaction imbriquée.
 * - Sinon, une nouvelle transaction est ouverte.
 */
export function runInTransaction<T>(
    manager: EntityManager,
    work: (manager: EntityManager) => Promise<T>,
): Promise<T> {
    if (manager.queryRunner?.isTransactionActive) return work(manager);
    return manager.transaction(work);
}
