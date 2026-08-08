import { useCallback, useEffect, useState } from 'react';
import { useGlobalToast } from '@/context/GlobalToastContext';
import { PageTemplate } from '../../PageTemplate';
import AccountLineCategorizationDatatable from './organisms/AccountLineCategorizationDatatable';
import AccountLineRule from '@/interfaces/AccountLineRule';
import AccountLineCategorizationService, { UnmappedAccountLineRuleItem } from '../../../services/AccountLineCategorizationService';
import CategorizationDojo from './organisms/CategorizationDojo';

const accountLineCategorizationService = new AccountLineCategorizationService();

export default function AccountLineCategorization() {

  const [unmapped, setUnmapped] = useState<UnmappedAccountLineRuleItem[]>([]);
  const [rules, setRules] = useState<AccountLineRule[]>([]);
  const showGlobalToast = useGlobalToast();

  const loadData = useCallback(async () => {
    const [loadedRules, loadedUnmapped] = await Promise.all([
      accountLineCategorizationService.getAll(),
      accountLineCategorizationService.getAllUnmapped(),
    ]);

    setRules(loadedRules);
    setUnmapped(loadedUnmapped);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData])

  const removeFromUnmapped = useCallback((pattern: string, accountId: number) => {
    setUnmapped((previous) => previous.filter((item) => !(item.pattern === pattern && item.account.id === accountId)));
  }, []);

  /**
   * 
   * @param pattern 
   * @param accountId 
   * @param posteId 
   * @param natureId 
   * @returns true si créé, false sinon
   */
  const handleConfirm = async (
    pattern: string,
    accountId: number,
    posteId?: number | null,
    natureId?: number | null,
  ): Promise<boolean> => {
    try {
      const createdRule = await accountLineCategorizationService.create(
        pattern,
        accountId,
        posteId,
        natureId
      );

      setRules((previous) => {
        const next = [...previous, createdRule];
        next.sort((left, right) => left.pattern.localeCompare(right.pattern, 'fr'));
        return next;
      });
      removeFromUnmapped(pattern, accountId);

      showGlobalToast({
        severity: "success",
        detail: "La règle a été ajoutée avec succès.",
      });
      return true;
    } catch (error) {
      showGlobalToast({
        severity: "error",
        detail: "Impossible d'ajouter la règle. Vérifie les informations et réessaie.",
      });
      return false;
    }
  }

  const handleDelete = async (id: number) => {
    const existingRule = rules.find((rule) => rule.id === id);
    setRules((previous) => previous.filter((rule) => rule.id !== id));

    try {
      await accountLineCategorizationService.delete(id);
      showGlobalToast({ severity: "success", detail: "Règle supprimée." });
    } catch (error) {
      if (existingRule) {
        setRules((previous) => {
          const restored = [...previous, existingRule];
          restored.sort((left, right) => left.pattern.localeCompare(right.pattern, 'fr'));
          return restored;
        });
      }
      showGlobalToast({ severity: "error", detail: "Impossible de supprimer la règle." });
    }
  };

  return (
    <PageTemplate
      pageTitle="Catégorisation"
    >
      <div className="flex flex-col gap-4">
        <CategorizationDojo
          unmapped={unmapped}
          onConfirm={handleConfirm}
        />
        <AccountLineCategorizationDatatable
          accountLineRules={rules}
          onDelete={handleDelete}
        />
      </div>

    </PageTemplate>
  );
}
