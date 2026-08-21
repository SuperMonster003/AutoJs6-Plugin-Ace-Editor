******

### Historique des versions

******

# v1.1.9

###### 2026/08/21

* `Fonctionnalité` Déclarer des profils backend explicites pour `ai.ask`/`ai.chat`/`ai.stream` et `ai.session` persistante, couvrant `cpu`/`gpu`/`npu`, la disponibilité par appareil dans `ai.models`, les raisons stables d'indisponibilité et l'absence de repli CPU

# v1.1.8

###### 2026/08/21

* `Fonctionnalité` Déclare le JSON structuré natif pour `ai.ask`/`ai.chat`/`ai.stream` et la session persistante `ai.session`, avec `structuredJson`, l'objet JSON `responseSchema` et un schema fixe par session

# v1.1.7

###### 2026/08/21

* `Fonctionnalité` Ajoute les déclarations de conversation locale persistante `ai.session`, avec options de session fixes, méthodes `ask`/`chat`/`stream` recevant un nouveau prompt par tour, état du cycle de vie et fermeture explicite

# v1.1.6

###### 2026/08/21

* `Fonctionnalité` Complète les déclarations du plugin d'IA local AutoJs6 avec l'historique des messages multirôle, les sélecteurs officiels et tiers, les paramètres de génération, les charges utiles précises d'utilisation et de streaming, ainsi que la découverte des modèles via `ai.models`

# v1.1.5

###### 2026/08/21

* `Fonctionnalité` Synchronisation des déclarations de types de détection d'objets du plugin YOLO autonome d'AutoJs6, notamment le composant Provider explicite, les options de session et de détection, les résultats et les codes d'erreur stables

# v1.1.4

###### 2026/08/20

* `Fonctionnalité` Synchronisation des déclarations de types `Ask`, `Chat` et `Stream` du plugin d'IA AutoJs6, notamment la sélection des plugins officiels et tiers, les paramètres de génération locale, les réponses de routage et les types d'événements de streaming

# v1.1.1

###### 2026/07/28

* `Correctif` Correction de la complétion des membres statiques des groupes de déclarations facultatifs, notamment `App.CHROME` et les grands ensembles de ressources `R.string.text_*`; les listes de candidats tronquées d'Ace sont désormais actualisées avec une temporisation anti-rebond lorsque le préfixe change
* `Correctif` Correction d'une détection erronée des documents volumineux ordinaires comme contenant de très longues lignes, qui les faisait basculer en mode texte brut et désactivait la coloration JavaScript, la complétion et les services sémantiques; les lignes individuelles réellement très longues conservent le mode de sécurité
* `Correctif` Correction de la bulle Ace d'aide aux signatures/paramètres qui utilisait toujours un fond clair; elle adopte désormais dynamiquement les couleurs d'arrière-plan et de premier plan du thème de l'éditeur, tandis qu'une fenêtre de candidats d'autocomplétion déjà ouverte est actualisée séparément lors d'un changement de thème
* `Correctif` Correction de l'ActionMode système de sélection de texte qui ne suivait pas les couleurs Ace, en le remplaçant par une barre d'outils de sélection propre à l'éditeur et sensible à la palette; les actions de sélection, les états pressés et le panneau de débordement suivent désormais les couleurs Ace actuelles sur toutes les versions d'Android

# v1.1.0

###### 2026/07/27

* `Fonctionnalité` Conservation de toutes les déclarations source et ajout de groupes de déclarations LSP AutoJs6 sélectionnables: `core` reste toujours activé, tandis que `android`, `libraries`, `resources` et `main-app` sont désactivés par défaut; sélectionner `libraries` active également `android`, et sélectionner `main-app` active également `android`, `libraries` et `resources`
* `Fonctionnalité` Ajout de la tâche Gradle `:app:generateAutoJs6LspDeclarations` pour valider les déclarations et générer les cinq groupes LSP ainsi que leur manifest; la fusion habituelle des ressources l'exécute automatiquement et les scripts externes peuvent l'appeler directement
* `Dépendance` Mise à niveau du service de langage TypeScript intégré et des déclarations de la bibliothèque standard de `4.2.4` vers `6.0.3`

# v1.0.0

###### 2026/07/21

* `Fonctionnalité` Ajout du plugin autonome d'édition Ace avec l'ID de plugin `ace-editor`, le moteur `editor` et la variante `ace`
* `Fonctionnalité` Ajout de la découverte via les composants `org.autojs.plugin.INFO` et `org.autojs.plugin.EDITOR` protégés par `org.autojs.permission.PLUGIN`, avec le contrat Editor API 1 et le build hôte minimal `5234`
* `Fonctionnalité` Ajout des fonctions d'édition Ace `1.4.12`, notamment l'annulation et le rétablissement, la recherche et le remplacement, la recherche par expression régulière et par mot entier, la navigation du curseur et de la sélection, les opérations sur les lignes, les points d'arrêt, l'activation et la désactivation des commentaires et le formatage du code
* `Fonctionnalité` Ajout des services de langage JavaScript/TypeScript intégrés et des déclarations de types AutoJs6 avec complétion, informations au survol, diagnostics et aide à la signature, tandis que le service JSON fournit uniquement des diagnostics syntaxiques
* `Fonctionnalité` Ajout de la synchronisation incrémentielle du texte, de la préservation des fins de ligne CRLF, du chargement par blocs des textes volumineux, d'un mode allégé pour les lignes très longues et de l'adaptation IME
* `Fonctionnalité` Ajout de thèmes et de paramètres d'affichage, ainsi que du téléchargement, de la mise en cache, de l'installation et de la suppression des polices avec vérification du catalogue signé et de l'intégrité des fichiers
* `Fonctionnalité` Ajout de la surveillance de l'état du runtime WebView, de la détection des battements de cœur et des notifications de repli vers l'éditeur natif de l'hôte
* `Fonctionnalité` Ajout des métadonnées du plugin et du contenu du README et du CHANGELOG localisés en espagnol, français, russe, arabe, japonais, coréen, anglais, chinois simplifié, chinois traditionnel de Hong Kong et chinois traditionnel de Taïwan
