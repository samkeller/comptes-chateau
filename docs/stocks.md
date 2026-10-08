# Module Stocks

Objectif : suivre ce qui est stocké, où, et jusqu'à quand, avec le moins de friction possible.

## Modèle

| Concept | Table | Rôle |
|---|---|---|
| Produit | `stock_item` | Catalogue (nom, code-barres, marque, unité par défaut, image). **Jamais supprimé**, même épuisé : il reste retrouvable (filtre « Afficher les épuisés »). |
| Exemplaire | `stock_unit` | Un objet physique (une boîte, un paquet…) : contenu (`quantity` + `unit`), lieu, péremption facultative. |
| Lieu | `stock_location` | Frigo, cellier… |
| Mouvement | `stock_movement` | Journal `IN` / `OUT` / `DELETE` par exemplaire, sans FK, avec libellés figés : il survit aux suppressions. |

La distinction produit / exemplaire est invisible dans l'interface : l'écran manipule des **lots**
(exemplaires identiques : même lieu, contenu, unité et date), agrégés par le serveur (`StockLotDto`).

### Unités

Liste fermée : `pièce`, `g`, `kg`, `ml`, `cl`, `L` (`shared/src/contracts/stocks/StockUnits.ts`).

- Un exemplaire est déjà « une boîte » / « un paquet » : l'unité décrit son **contenu**. Les anciennes valeurs
  `boite`, `pack`, `paquet`, `sachet`, `pcs`… désignaient le contenant et sont lues comme `pièce`.
- Les masses et volumes sont ceux exposés par OpenFoodFacts (`product_quantity_unit`), ce qui permet de préremplir.
- L'API accepte les alias (`l` → `L`, `boîte` → `pièce`) et refuse une unité inconnue ; une donnée historique
  inconnue est affichée comme `pièce`.

### Codes-barres

Normalisés à l'enregistrement et à la recherche (`normalizeBarcode`) : UPC-A (12 chiffres) → EAN-13 avec un `0`
devant, GTIN-14 commençant par `0` → EAN-13. La recherche essaie aussi les formes historiques non normalisées.

## Journal des mouvements

Base des futures statistiques (consommation par produit, listes de courses) : chaque écriture produit un mouvement.

| Type | Signification | Produit par |
|---|---|---|
| `IN` | Entrée en stock | Saisie (`POST /stocks/entries`) |
| `OUT` | Consommé (« Prendre ») | `POST /stocks/units/:id/take` |
| `DELETE` | Erreur de saisie retirée | `DELETE /stocks/units/:id`, ou réduction d'un lot (saisie ou tableau) |

Corriger un exemplaire (contenu, unité, lieu, date) **met à jour son `IN`** au lieu de créer un mouvement de correction :
c'est voulu, le journal décrit ce qui est réellement entré, sorti ou retiré. La date de péremption n'est pas journalisée.
Les mouvements ne sont jamais supprimés. Pour mesurer une consommation, ne compter que les `OUT`.
Les exemplaires se prennent un par un (pas de prise partielle).

## API

- `GET /stocks/items?search&locationId&expiryState&includeEmpty` : produits **avec leurs lots** (une requête, pas de N+1),
  triés par prochaine péremption. `expiryState` : `expired` (date passée), `soon` (≤ 30 jours, aujourd'hui inclus), `ok`, `none`.
- `GET /stocks/items/:id`, `GET /stocks/items/lookup/:barcode` (produit existant, sinon suggestion OpenFoodFacts).
- `POST /stocks/entries` : saisie **atomique** d'un produit (créé s'il n'a pas d'`id`) et de ses lots, dans une transaction.
  Un lot existant liste ses `unitIds` ; `copies` plus grand ajoute des exemplaires, plus petit en retire (les plus récents).
- `POST /stocks/units/:id/take`, `DELETE /stocks/units/:id` : `204`.
- `GET /stocks/dashboard/overview` (dont `expiredUnitCount`), `GET /stocks/dashboard/last-movements?limit=`.

Les erreurs sont des `AppError` typées ; le front les affiche uniquement via `react/src/services/Interceptors.ts`.

## Écran `/stocks`

Une seule page, sans onglets :

- actions **Ajouter** et **Scanner** ;
- bandeau d'indicateurs cliquables (Périmés, Bientôt périmés) qui filtrent la liste. Seule une valeur non nulle est colorée ;
- recherche (nom, marque, code-barres), filtre par lieu (gestion des lieux via l'icône ⚙), « Afficher les épuisés » ;
- un tableau groupé par produit, une ligne par lot : exemplaires, contenu, unité, lieu et péremption se **corrigent
  directement dans la cellule** (enregistré à la validation de la cellule) ; actions **Prendre**, dupliquer
  (+1 exemplaire identique) et supprimer (erreur de saisie). Réduire le nombre d'exemplaires retire les plus récents ;
- une carte **Historique** (tableau paginé des derniers mouvements), sous le tableau des stocks.

Un seul `StockEntryDialog` (plein écran sur mobile) sert à l'ajout, à l'ajout rapide sur un produit, à la modification
et au scan : un produit et tous ses lots s'enregistrent en une fois, rien n'est enregistré avant « Enregistrer ».
Le dernier lieu utilisé est proposé par défaut. `/stocks?action=scan` ouvre directement le scan
(l'ancienne route `/stocks/scan` y redirige).

## OpenFoodFacts

Sources : <https://openfoodfacts.github.io/openfoodfacts-server/api/>, <https://world.openfoodfacts.org/terms-of-use>.

### Conditions d'utilisation

- Base sous **ODbL**, contenus sous **DbCL**, images sous **CC BY-SA** : citer Open Food Facts quand ses données sont
  affichées (fait dans le dialog quand une suggestion est utilisée). Une base dérivée redistribuée doit rester sous ODbL ;
  les données OFF enregistrées en base ne sont pas redistribuées.
- Identifier l'application avec un `User-Agent` `NomApp/Version (email)` : `Chocosous/1.0 (dandrieux.keller@gmail.com)`,
  surchargeable par `OPEN_FOOD_FACTS_CONTACT` (`node/.env.example`).
- Limites documentées : 15 lectures produit / min / IP, 10 recherches / min. Le scraping et
  les traitements massifs doivent passer par les exports de données. Il est recommandé de déclarer l'usage via le
  formulaire d'utilisation de l'API.

### Implémentation

- **SDK officiel** `@openfoodfacts/openfoodfacts-nodejs` (`getProductV3`, **API v3**), encapsulé dans
  `node/src/modules/stocks/clients/OpenFoodFactsClient.ts` : champs limités (`fields`), timeout 3 s. Le SDK impose son
  propre `User-Agent` : le `fetch` qui lui est fourni le remplace par le nôtre (contactable) et relève le statut HTTP.
  Version épinglée (le SDK est encore en `2.0.0-alpha`) : vérifier le changelog avant toute montée de version.
- Protection : 10 appels par minute glissante au maximum côté serveur, et un circuit ouvert 10 min après un `429`
  ou un `503`. Un échec OpenFoodFacts ne bloque jamais la saisie.
- **Données OFF en base** `open_food_facts_product` : fiche brute (`jsonb`) conservée durablement pour réutiliser plus tard
  d'autres champs (nutriscore, catégories, allergènes…). Re-synchronisée avec OFF après 180 jours si trouvée, 7 jours si
  inconnue ; la fiche existante reste utilisée si l'API échoue.
- **Journal des appels** `open_food_facts_api_call` (déclencheur, résultat, statut HTTP, durée) : suivi de la
  consommation, pour par exemple ajuster un don à l'association selon l'usage.
- **Rétro-compatibilité** : job nocturne `open-food-facts-sync` (03:30, `node/src/jobs/syncOpenFoodFacts.ts`),
  idempotent. Il normalise les codes-barres existants, rafraîchit au plus 20 codes par nuit (un appel toutes les
  6,5 s) et complète marque et image des produits existants. **Une valeur saisie par l'utilisateur n'est jamais écrasée.**

## Scan

- Code-barres : flux vidéo continu (`BarcodeDetector` natif, sinon ZXing), saisie manuelle toujours possible,
  rescan possible à tout moment depuis le dialog.
- Développement sur téléphone : voir « Tester la caméra » dans le `README.md` (`npm run start:https` ou `adb reverse`).
- **Scan de date (OCR) retiré** en attendant la stabilisation du module. Il sera reconstruit comme module
  réutilisable (tickets de caisse, devis, reçus…) : flux vidéo continu, moteur OCR derrière une interface
  remplaçable, confirmation par l'utilisateur, résultat qui préremplit un champ et ne remplace jamais la saisie.
  Le parseur pur et testé `react/src/utils/parseExpirationDateFromText.ts` est conservé pour cette reconstruction.
