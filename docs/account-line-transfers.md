# Virements inter-comptes (`account_line`)

Ce document décrit les conventions et invariants des opérations liées entre
comptes, tels qu'implémentés par `OperationService` et garantis en base.

## Modèle

Un virement d'un compte A vers un compte B est matérialisé par **deux lignes
`account_line` strictement miroir** :

| Ligne | `account_id` | `target_account_id` | Montants |
|---|---|---|---|
| Source (côté A) | A | B | ex. `debit = 100` |
| Miroir (côté B) | B | A | ex. `credit = 100` (inversé) |

- Les montants sont **toujours opposés** : le débit de l'une est le crédit de
  l'autre. Un virement n'a jamais débit **et** crédit sur la même ligne.
- `dateOperation`, `isChecked` et `dateValeur` sont synchronisés entre les deux
  lignes ; `label`, `nature_id` et `poste_id` restent propres à chaque compte
  (le miroir n'a jamais de poste).

## Invariants base de données

### `transfer_group_id` / `target_account_id` : les deux ou aucun

Une opération **liée** a toujours les deux champs renseignés ; une opération
**simple** n'a ni l'un ni l'autre. Cette cohérence est garantie par une
contrainte `CHECK` (migration `account_line_transfer_pair_consistency`) :

```sql
CHECK (
  (transfer_group_id IS NOT NULL AND target_account_id IS NOT NULL)
  OR (transfer_group_id IS NULL AND target_account_id IS NULL)
)
```

Si `transfer_group_id` **et** `target_account_id` sont renseignés, il s'agit
donc d'une opération entre deux comptes.

### `transfer_group_id` : UUID de la paire miroir

`transfer_group_id` est un UUID (v4) partagé par **exactement deux lignes** :
les deux bouts « miroir » du virement, sur les deux comptes. Il n'est jamais
partagé entre deux virements distincts (une duplication crée un nouvel UUID).

## Requêtes utiles (admin DB)

Retrouver la paire complète d'un virement (les deux opérations + les deux
comptes) à partir d'une ligne :

```sql
SELECT l.id, l.label, l.debit, l.credit,
       l.account_id        AS compte,
       l.target_account_id AS compte_lie
FROM account_line l
WHERE l.transfer_group_id = (
    SELECT transfer_group_id FROM account_line WHERE id = :lineId
);
```

Retrouver le compte lié d'une opération : `target_account_id` → `account.id`.

## Garanties applicatives (`OperationService`)

| Action | Effet sur la ligne miroir |
|---|---|
| Création d'un virement | Miroir créé dans la même transaction (nouveau `transfer_group_id`) |
| Édition (montant, dates, vérification) | Champs structurels propagés ; label/nature/poste du miroir préservés |
| Changement de compte cible | Miroir repositionné sur le nouveau compte |
| Retrait du compte lié (→ opération simple) | Miroir supprimé dans la même transaction |
| Suppression | Miroir supprimé en cascade dans la même transaction |
| Duplication | Nouvelle paire miroir avec un **nouveau** `transfer_group_id`, non vérifiée |
| Validation en lot (`check-batch`) | `isChecked`/`dateValeur` propagés au miroir |

Ces comportements sont couverts par les tests `OperationService.test.ts`,
`AccountLineService.test.ts` et `OperationLifecycle.integration.test.ts`.
