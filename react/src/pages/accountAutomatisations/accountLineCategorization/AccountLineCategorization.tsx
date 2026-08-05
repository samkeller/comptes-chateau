import { useEffect, useState } from 'react';
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

  const loadData = async () => {
    await Promise.all([
      accountLineCategorizationService.getAll().then(setRules),
      accountLineCategorizationService.getAllUnmapped().then(setUnmapped),
    ]);
  }

  useEffect(() => {
    void loadData();
  }, [])

  const handleConfirm = async (
    pattern: string,
    accountId: number,
    posteId?: number | null,
    natureId?: number | null,
  ) => {
    try {
      await accountLineCategorizationService.create(
        pattern,
        accountId,
        posteId,
        natureId
      );
      showGlobalToast({
        severity: "success",
        detail: "La règle a été ajoutée avec succès.",
      });
      await loadData();
    } catch (error) {
      showGlobalToast({
        severity: "error",
        detail: "Impossible d'ajouter la règle. Vérifie les informations et réessaie.",
      });
    }
  }

  return (
    <PageTemplate
      pageTitle="Catégorisation"
    >
      <div className="flex flex-col gap-4">
        <CategorizationDojo
          unmapped={unmapped}
          onConfirm={handleConfirm}
        />
        <AccountLineCategorizationDatatable accountLineRules={rules} />
      </div>

    </PageTemplate>
  );
}
