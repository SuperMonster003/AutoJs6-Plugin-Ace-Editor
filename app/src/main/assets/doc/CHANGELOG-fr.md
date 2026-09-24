******

### Historique des versions

******

# v1.13.0

###### 2026/09/24

* `Amélioration` Déclarations AutoJs6 4.21.0 et complétion des API de tâches ai.agent, avec membres AgentRun, types des événements et options

# v1.12.1

###### 2026/09/23

* `Amélioration` Déclarations AutoJs6 intégrées en version 4.20.0 et complétion de ai.agent.result/context et des types du contexte d'exécution

# v1.12.0

###### 2026/09/21

* `Amélioration` Déclarations AutoJs6 intégrées mises à jour en `4.19.0` : ajout des globaux `epub` / `$epub` et de l'espace de noms `Internal.Epub` du plugin Readium EPUB Reader (ouverture de livres et couche pratique en formes synchrone et `Async`, membres de `Book` pour les métadonnées, la table des matières, l'ordre de lecture, l'extraction de texte, l'export de la couverture et des ressources et la recherche, événements et commandes de `ReaderSession`, préférences de lecture, localisateur, documents de résultat et codes d'erreur), de sorte que la complétion et la vérification de types de l'éditeur couvrent désormais l'API EPUB
* `Amélioration` Index de complétion de l'éditeur `autojs6_indices.js` et déclaration agrégée `lib.autojs6.d.ts` régénérés par le `tools/ace-completion` de l'hôte à partir des déclarations intégrées `4.19.0` : complétion et aide de signature pour le module `epub` ; les quatre scripts de vérification et le test du compléteur passent
* `Amélioration` Déclarations intégrées AutoJs6 `4.19.0` complétées par les surlignages et notes du plugin Readium EPUB Reader 1.1.0 (contrat EPUB version 2) : `epub.annotations` / `annotationsAsync`, `Book.annotations` / `annotationsAsync`, `Internal.Epub.Annotation` / `AnnotationStyle` et l'événement `highlight` de `ReaderSession` (`HighlightEvent`) ; les index de complétion `autojs6_indices.js` et la déclaration agrégée `lib.autojs6.d.ts` régénérés par le `tools/ace-completion` de l'hôte, les quatre scripts de vérification et le test du compléteur passent

# v1.11.0

###### 2026/09/20

* `Amélioration` Déclarations AutoJs6 intégrées mises à jour en `4.18.0` : ajout des globaux `mail` / `$mail` et de l'espace de noms `Internal.Mail` du plugin Angus Mail (méthodes du client et méthodes relayées en formes synchrone et `Async`, événements de surveillance, objets message / pièce jointe / adresse, options de compte et préréglages de fournisseur, critères de recherche, documents de résultat et codes d'erreur), de sorte que la complétion et la vérification de types de l'éditeur couvrent désormais l'API de messagerie
* `Amélioration` Index de complétion de l'éditeur `autojs6_indices.js` et déclaration agrégée `lib.autojs6.d.ts` régénérés par le `tools/ace-completion` de l'hôte à partir des déclarations intégrées `4.18.0` : complétion et aide de signature pour les modules `mail`, `ai`, `tts`, `flow`, `pangu`, `settings`, `yolo`, `powerManager` et `workManager`, index de déclarations `index.d.ts` et `BUNDLED_DECLARATIONS.md` ramenés à la forme produite par le script d'import ; les quatre scripts de vérification et le test du compléteur passent

# v1.10.0

###### 2026/09/19

* `Correctif` Avertissements de lecture SDK XML v4 avec AGP 9.1 et contrôles d'alignement natif des APK déclenchés par erreur lors de l'assemblage des tests unitaires JVM, avec les plugins de compilation partagés 1.8.3
* `Amélioration` Déclarations AutoJs6 intégrées mises à jour en `4.17.0` : les proxies Level / LogConfigurator / LogManager pointent désormais vers les classes intégrées `org.autojs.autojs.core.console.log`, et les déclarations de bibliothèques n'incluent plus les bibliothèques retirées de l'hôte (log4j, Flexmark, JavaMail, JUnit, github-api, Jackson, commons-io / lang3, kotlin-reflect, SpongyCastle, media3, Guava)

# v1.9.0

###### 2026/09/16

* `Fonctionnalité` Déclarations des API de clic par coordonnées et des piles de tâches Flow, avec complétion et index LSP synchronisés

# v1.8.0

###### 2026/09/16

* `Fonctionnalité` Déclarations de types et complétion LSP pour les étapes facultatives, les boucles bornées et les instantanés de stabilité Flow

# v1.7.2

###### 2026/09/16

* `Amélioration` Après compileSdk, targetSdk passe à 37 (Android 17) ; le comportement du plugin ne dépend pas de la nouvelle cible

# v1.7.1

###### 2026/09/15

* `Amélioration` compileSdk passe à 37 (Android 17) ; targetSdk reste à 36 jusqu'à la vérification du comportement dépendant de la cible

# v1.7.0

###### 2026/09/15

* `Amélioration` Synchroniser les déclarations AutoJs6 4.16.0 pour les arguments image et les options RANSAC de images.matchFeatures, la géométrie et les statistiques de correspondance d'ObjectFrame, ainsi que count et method d'ImageFeatures, et régénérer les déclarations des ressources, des dépendances et les groupes LSP

# v1.6.0

###### 2026/09/14

* `Amélioration` Synchroniser les déclarations AutoJs6 4.15.0 pour l'option scales de images.matchTemplate, les champs géométriques des correspondances de modèle et les méthodes auxiliaires de MatchingResult, et régénérer les déclarations des ressources, des dépendances et les groupes LSP

# v1.5.0

###### 2026/09/14

* `Amélioration` Synchroniser les déclarations AutoJs6 4.14.0 pour images.countPointsByColor, images.getMeanColor, images.readPixels et la famille colors.distance / invert / blend / contrast, et régénérer les déclarations des ressources, des dépendances et les groupes LSP

# v1.4.0

###### 2026/09/14

* `Amélioration` Synchroniser les déclarations AutoJs6 4.13.0 pour LaunchConfig.requiresSharedStorage et régénérer les déclarations des ressources, des dépendances et les groupes LSP

# v1.3.0

###### 2026/09/13

* `Fonctionnalité` Déclarations et complétion de `pangu` pour `spaceText`, `hasProperSpacing` et les imports de module typés; synchronisation des déclarations AutoJs6 4.12.0 et régénération des groupes LSP

# v1.2.0

###### 2026/09/13

* `Correctif` Compatibilité Android 7 corrigée pour les chemins Lua, les instantanés des dépendances TypeScript et l’arrêt des tests du serveur de langage
* `Correctif` Supprimer les fichiers temporaires des polices en échec et libérer leurs verrous avant de notifier les abonnés
* `Amélioration` Vérification de la signature complète, des APK attendus et de la reproductibilité de la documentation
* `Amélioration` Choisissez un APK adapté à votre ABI ou le paquet universal. La sémantique Lua fonctionne sur arm64-v8a, armeabi-v7a et x86_64; x86 conserve l'éditeur et la complétion statique.

# v1.1.28

###### 2026/09/13

* `Correctif` Les déclarations de `runtime.requestPermissions` acceptent les noms de permissions génériques et les exemples utilisent des tableaux, dont `access_local_network`; synchronisation des déclarations AutoJs6 4.11.1 et des groupes LSP

# v1.1.27

###### 2026/09/13

* `Amélioration` Déclaration numérique en lecture seule et complétion pour `device.pageSize`; synchroniser les déclarations AutoJs6 4.11.0 et régénérer les groupes LSP

# v1.1.26

###### 2026/09/12

* `Amélioration` Les déclarations et la complétion OCR prennent en charge la sélection automatique du moteur, la lecture du mode effectif, les réinitialisations par tap et les options de mode par appel; synchronisation des déclarations AutoJs6 4.10.0 et régénération des groupes LSP

# v1.1.25

###### 2026/09/11

* `Amélioration` Vérification à la compilation de l'alignement des pages de 16 KB des bibliothèques natives 64 bits, avec contrôle du contrat manifest et rapports JSON

# v1.1.24

###### 2026/09/10

* `Amélioration` Les déclarations et la complétion MediaInfo couvrent streamNumber, countGet, infoKind et les capacités de requête

# v1.1.23

###### 2026/09/08

* `Fonctionnalité` Intègre la mise à jour des déclarations de la console AutoJs6 `4.8.1` : `console.rawInput` / `console.input` restaurés, nouvelles méthodes `setTimeVisible` / `setTimeFormat` / `setColorful` / `setAvoidStatusBar` / `setInputVisible` avec les options `console.build` correspondantes, et nouveaux éléments JSX `<console>` / `<globalconsole>` avec leurs attributs ; les déclarations de l'application principale sont régénérées depuis AutoJs6 6.8.0 (5279)

# v1.1.22

###### 2026/09/07

* `Fonctionnalité` Intègre les déclarations d'automatisation d'accessibilité AutoJs6 `4.8.0` et les groupes LSP régénérés : la chaîne `Flow` et l'espace de noms `flow`, la boîte à outils (`smartClick`, `scrollUntil`, `typeInto`, `dismissPopups`, `collectList`, `launchAndWait`, `backUntil`, `toggle`, etc.), les attentes pilotées par les événements, `auto.explain` / `auto.dump` / `auto.stats`, le sélecteur textuel `select(syntax)` et `findIterator` ; les déclarations de l'application principale sont régénérées depuis AutoJs6 6.8.0 (5278)

# v1.1.21

###### 2026/09/01

* `Fonctionnalité` Intègre les déclarations Pinyin AutoJs6 `4.7.0` et les groupes LSP régénérés: `customDictionary` fournit des substitutions de lecture limitées à chaque appel, `compare` renvoie un ordre numérique, `compact` renvoie le produit cartésien de la matrice de candidats, et les types de l'API de plugin partagée sont synchronisés

# v1.1.20

###### 2026/09/01

* `Amélioration` Synchroniser le nom Previewer dans les déclarations intégrées de l'application principale et les groupes LSP générés

# v1.1.19

###### 2026/09/01

* `Correctif` La WebView Ace pouvait afficher brièvement une page entièrement blanche avant l'application du thème hôte et du document initial, provoquant un flash marqué avec les thèmes sombres; la première présentation attend désormais des signaux explicites de thème appliqué, document soumis et rendu stable au lieu d'un délai fixe
* `Amélioration` Déplace l'index de complétion AutoJs6 complet d'environ 1.3 MiB hors du chemin synchrone de première présentation, le charge pendant une période d'inactivité après la première image de code visible et remplace sans interruption l'index initial; les cinq environnements Android 9-15 ont restauré 400 éléments globaux et 80 modules
* `Amélioration` Uniformiser la mise en page du README et la gestion des versions de la plateforme Gradle
* `Amélioration` Simplifier la description du plugin et normaliser la ponctuation des ressources multilingues

# v1.1.18

###### 2026/08/31

* `Fonctionnalité` Integre les declarations de quantification PNG a ressources controlees d'AutoJs6 `4.6.0` et le groupe LSP main-app regenere: les budgets configurables `maxPixels` et `maxMemoryBytes` echouent avec des details types, les resultats exposent `peakWorkingMemoryBytes` et les API d'annulation couvrent les demandes explicites et l'arret du script
* `Fonctionnalité` Ajoute la prise en charge hors ligne P1 de Python, Lua, Java et Kotlin: les extensions routent vers des modes Ace dédiés avec coloration syntaxique, mots-clés, extraits et complétion des mots du document; Lua active aussi les diagnostics syntaxiques par worker et les quatre langages restent isolés des candidats AutoJs6/TypeScript
* `Fonctionnalité` Ajoute la complétion hors ligne P2 pour Python, Lua, Java et Kotlin: des index de bibliothèques standard versionnés et chargés à la demande se combinent à l'extraction des imports, fonctions, classes, méthodes, paramètres et variables du document courant, tout en préservant l'isolation entre langages et le comportement JavaScript/TypeScript existant
* `Fonctionnalité` Ajoute un Provider sémantique enfichable à huit capacités, un coeur JSON-RPC/LSP général et des transports WebWorker/stdio sur l'appareil; TypeScript migre sans régression, les pannes reviennent à P2 et les interrupteurs sémantiques des quatre nouveaux langages sont désactivés par défaut
* `Fonctionnalité` Intègre la sémantique Python 3.12 entièrement hors ligne avec un Worker Pyright 1.1.413 épinglé et un sous-ensemble typeshed de 271 fichiers : complétion typée, survol, aide à la signature, diagnostics et définition sont activés par défaut, tandis que les anciens WebView incompatibles et les pannes du runtime reviennent silencieusement à P2
* `Fonctionnalité` Intègre la sémantique Lua entièrement hors ligne avec un processus compagnon LuaLS 3.18.2 épinglé sur l'appareil : complétion, survol, aide à la signature, diagnostics et définition sont activés par défaut sur arm64-v8a, armeabi-v7a et x86_64 ; les ressources natives absentes ou endommagées, les ABI non pris en charge et les pannes du processus reviennent silencieusement à P2 avec reprise par temporisation bornée
* `Fonctionnalité` Intègre des diagnostics Java mono-fichier entièrement hors connexion avec ECJ 3.26.0 épinglé et des stubs Android API 36 élagués : les erreurs de syntaxe et symboles non résolus reçoivent par défaut des plages exactes ; la complétion reste en P2 car JDT Code Assist exige un environnement Eclipse Workspace/OSGi indisponible sur ART
* `Fonctionnalité` Ajoute la complétion Kotlin P2+ hors connexion avec les API d'instance Kotlin 2.2.21, des inférences prudentes dans le fichier courant, les safe-calls et des index Java/Android réutilisés ; la validation du compilateur embarqué a échoué sur la taille, ART, la mémoire et le SDK minimal, donc aucun compilateur ni runtime sémantique Kotlin n'est inclus
* `Fonctionnalité` Affiche la même matrice de neuf modes dans les paramètres de l'éditeur de code AutoJs6 avec des commutateurs sémantiques pour TypeScript/JavaScript, Python, Lua et Java; Kotlin reste visible mais indisponible en P2+, et la personnalisation des types de fichiers est expliquée comme une liste d'autorisation plutôt qu'une reclassification du langage

# v1.1.17

###### 2026/08/31

* `Fonctionnalité` Integre les declarations de quantification PNG aux couleurs correctes d'AutoJs6 `4.5.0` et le groupe LSP main-app regenere: `images.quantizeToFile` ecrit directement dans un fichier et renvoie la taille et les mesures de qualite, tandis que `preserveAlpha` controle la sortie transparente ou opaque

# v1.1.16

###### 2026/08/30

* `Fonctionnalité` Integre les declarations de resultat de quantification PNG d'AutoJs6 `4.4.0` et le groupe LSP main-app regenere: `images.quantize` renvoie les octets encodes, la taille, la qualite obtenue et l'erreur de quantification; une borne minimale explicite impossible a satisfaire expose `QualityTooLowException` typee

# v1.1.15

###### 2026/08/30

* `Fonctionnalité` Integre les declarations d'options de quantification PNG d'AutoJs6 `4.3.0` et les groupes LSP main-app/resources regeneres: `Images.PngQuantizationOptions` couvre la taille de palette, la vitesse, les bornes de qualite, le tramage et posterize, tout en conservant la compatibilite de `quality` numerique

# v1.1.14

###### 2026/08/29

* `Fonctionnalité` Ajout du renommage des symboles TypeScript dans tout le projet via F2 et l'action mobile `Renommer`: Ace dérive des modifications bornées entre fichiers depuis l'instantané exact, demande l'autorisation contract 5 à AutoJs6 et confie entièrement à l'hôte l'aperçu, les conflits, la publication atomique, l'annulation et toutes les écritures disque
* `Fonctionnalité` Ajout de correctifs rapides TypeScript pour l'import automatique et l'orthographe via Ctrl/Command+. et l'action mobile `Correction rapide`: Ace limite les correctifs aux modifications ordonnées du tampon actif, demande l'autorisation du contrat 4 à AutoJs6 6.8.0 (5276), puis applique le résultat approuvé comme une seule modification annulable
* `Fonctionnalité` L'intelligence TypeScript inter-fichiers couvre désormais la complétion, le hover, l'aide aux signatures et la navigation vers les définitions dans les sources du projet et les déclarations de dépendances gelées; F12, Ctrl/Command-click et l'action mobile `Aller à la définition` émettent des cibles de contrat 3 qu'AutoJs6 6.8.0 (5276) valide indépendamment avant ouverture et positionnement
* `Fonctionnalité` Ajout des diagnostics de projet TypeScript fournis par l'hôte : Ace valide et charge désormais le snapshot source complet et borné, résout les imports entre fichiers du projet et signale les modules absents comme la compilation avant exécution ; nécessite AutoJs6 6.8.0 (5276) ou ultérieur
* `Fonctionnalité` Les couches de types des projets TypeScript détectent désormais les signaux d'extensions natives et les hooks du cycle d'installation avant la poursuite de l'édition, et publient la même erreur stable de limite de dépendances ainsi que les mêmes conseils JavaScript pur/WASM que l'hôte et le compilateur
* `Fonctionnalité` Alignement de l'autorité des types de dépendances d'Ace sur la révision 3 de la politique du resolver et ajout d'une couverture de lodash 4.17.21 avec `@types/lodash` 4.17.25, afin de conserver des diagnostics identiques entre Rhino et Node lorsque les paquets d'exécution n'intègrent pas de déclarations
* `Fonctionnalité` Ajout d'une couche gelee de types de dependances partagee avec le compilateur TypeScript: Ace resout maintenant `types`/`typings`, `typesVersions` de TypeScript 6, declarations imbriquees et `@types` installes, avec completion dayjs, hover et diagnostics stricts identiques pour Rhino et Node
* `Fonctionnalité` Intègre les déclarations R8 AutoJs6 `4.2.0` et les groupes LSP générés: six surcharges de `ScriptRuntime.loadJarWithR8` ajoutent l'export vérifié de mapping/seeds/usage/retrace metadata, tandis que `retraceR8Stack` restaure la pile liée à la provenance via le protocole 1.1 avec une sélection de fournisseur sans repli

# v1.1.13

###### 2026/08/26

* `Fonctionnalité` Intègre les déclarations AI finales d'AutoJs6 `4.1.0`, exclusivement via plugin: un sélecteur omis utilise la cible par défaut du plugin officiel 3-Stone AI, chaque requête n'accepte que le routage `target` du plugin et le `timeout` canonique, et les types de connexion directe, d'identifiant secret et d'événement transitoire côté hôte sont supprimés

# v1.1.12

###### 2026/08/26

* `Fonctionnalité` Intègre les déclarations unifiées des cibles IA d’AutoJs6 : `ai.catalog`, routage exact par `target`, cibles locales et en ligne, métadonnées complètes des réponses et sessions, sortie de raisonnement et erreurs stables sans repli ; supprime toutes les anciennes API et tous les alias non publiés du catalogue IA

# v1.1.11

###### 2026/08/25

* `Fonctionnalité` Intégrer les trois surcharges explicites de `ScriptRuntime.loadJarWithR8` aux déclarations AutoJs6 et aux groupes LSP générés, couvrant les keep rules, le classpath ordonné et les liaisons ordinales des consumer rules

# v1.1.10

###### 2026/08/24

* `Fonctionnalité` Aligne les diagnostics TypeScript d'Ace sur les profils Rhino/Node révision 2 de TypeScript 6.0.3 du plugin compilateur (ES2018, strict, CommonJS/Node10 ou NodeNext), avec routage des projets Node et prise en charge par défaut des déclarations .mts/.cts, tout en conservant le repli statique

# v1.1.9

###### 2026/08/21

* `Fonctionnalité` Déclarer des profils backend explicites pour `ai.ask`/`ai.chat`/`ai.stream` et `ai.session` persistante, couvrant `cpu`/`gpu`/`npu`, la disponibilité par appareil dans `ai.catalog`, les raisons stables d'indisponibilité et l'absence de repli CPU

# v1.1.8

###### 2026/08/21

* `Fonctionnalité` Déclare le JSON structuré natif pour `ai.ask`/`ai.chat`/`ai.stream` et la session persistante `ai.session`, avec `structuredJson`, l'objet JSON `responseSchema` et un schema fixe par session

# v1.1.7

###### 2026/08/21

* `Fonctionnalité` Ajoute les déclarations de conversation locale persistante `ai.session`, avec options de session fixes, méthodes `ask`/`chat`/`stream` recevant un nouveau prompt par tour, état du cycle de vie et fermeture explicite

# v1.1.6

###### 2026/08/21

* `Fonctionnalité` Complète les déclarations du plugin d'IA local AutoJs6 avec l'historique des messages multirôle, les sélecteurs officiels et tiers, les paramètres de génération, les charges utiles précises d'utilisation et de streaming, ainsi que la découverte des modèles via `ai.catalog`

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
