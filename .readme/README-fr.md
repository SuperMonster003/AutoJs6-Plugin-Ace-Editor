<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>Éditeur de code Ace intégré avec services de langage</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### Langues (Languages)

******

Le README.md actuel prend en charge les langues suivantes:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- Français [fr] # actuel
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### Introduction

******

Le plugin AutoJs6 Ace Editor sépare du fichier APK hôte le runtime Ace WebView, le bridge JavaScript, l'adaptation aux méthodes de saisie, les services de langage intégrés et les ressources de l'éditeur. Il s'installe comme un APK Android standard et s'exécute dans le processus AutoJs6 via l'Editor API typée.

******

### Fonctions

******

- Fournit l'ID de plugin `ace-editor`, le moteur `editor` et la variante `ace`, avec découverte via `org.autojs.plugin.INFO` et `org.autojs.plugin.EDITOR`.
- Utilise le contrat 5 de Editor API et nécessite AutoJs6 build 5276 ou ultérieur et Android API 24 ou ultérieur.
- Prend en charge l'édition de texte, l'annulation et le rétablissement, la recherche et le remplacement, la recherche par expression régulière et par mot entier, la navigation du curseur et de la sélection, les opérations sur les lignes, les points d'arrêt, l'activation et la désactivation des commentaires et le formatage du code.
- Inclut des services de langage JavaScript/TypeScript et des déclarations de types AutoJs6 avec complétion, informations au survol, diagnostics et aide à la signature, tandis que le service JSON fournit uniquement des diagnostics syntaxiques.
- Ajoute l'analyse sémantique Python 3.12 via un WebWorker Pyright 1.1.413 chargé à la demande : complétion typée, survol, aide à la signature, diagnostics et définition ; les anciens WebView incompatibles conservent silencieusement P2.
- Ajoute la sémantique Lua entièrement hors ligne via un processus compagnon LuaLS 3.18.2 sur l'appareil : complétion, survol, aide à la signature, diagnostics et définition sont activés par défaut sur arm64-v8a, armeabi-v7a et x86_64 ; les ABI non pris en charge et les pannes du runtime conservent silencieusement P2.
- Prend en charge la préservation des fins de ligne CRLF, la synchronisation incrémentielle du texte, le chargement par blocs des textes volumineux, un mode allégé pour les lignes très longues, l'adaptation IME, la surveillance de l'état du runtime et les notifications invitant à revenir à l'éditeur natif de l'hôte.
- Propose des thèmes et des paramètres d'affichage, ainsi qu'une gestion des polices avec vérification du catalogue signé, validation SHA-256/WOFF2, téléchargement, mise en cache, installation et suppression.
- Les métadonnées du plugin, le README et le CHANGELOG sont localisés en espagnol, français, russe, arabe, japonais, coréen, anglais, chinois simplifié, chinois traditionnel de Hong Kong et chinois traditionnel de Taïwan.
- Choisissez un APK adapté à votre ABI ou le paquet universal. La sémantique Lua fonctionne sur arm64-v8a, armeabi-v7a et x86_64; x86 conserve l'éditeur et la complétion statique.

******

### Prise en charge des langages

******

Le tableau ci-dessous décrit les capacités linguistiques actuellement intégrées. La prise en charge sémantique comprend la complétion typée, les diagnostics de type, le hover et les aides de signature:

| Langage | Coloration syntaxique | Complétion des mots-clés | Extraits | Complétion locale | Prise en charge sémantique |
|---|---:|---:|---:|---:|---:|
| JavaScript | Oui | Oui | Oui | Oui | Oui |
| JSX | Oui | Non | Non | Oui | Oui |
| TypeScript | Oui | Oui | Oui | Oui | Oui |
| TSX | Partielle | Oui | Oui | Oui | Oui |
| JSON | Oui | Non | Non | Non | Diagnostics syntaxiques uniquement |
| Python | Oui | Oui | Oui | Oui | Oui |
| Lua | Oui | Oui | Oui | Oui | Oui |
| Java | Oui | Oui | Oui | Oui | Diagnostics de fichier unique |
| Kotlin | Oui | Oui | Oui | P2+ | Non |

TSX utilise le mode TypeScript dans Ace 1.4.12, donc la coloration des balises JSX est partielle. Python utilise par défaut un Worker Pyright 1.1.413 entièrement hors ligne avec les stubs de la bibliothèque standard Python 3.12 et revient silencieusement à P2 si un ancien WebView est incompatible ou si le runtime échoue. Lua utilise par défaut un processus compagnon LuaLS 3.18.2 hors ligne sur arm64-v8a, armeabi-v7a et x86_64, et revient silencieusement à P2 si le runtime natif est indisponible ou échoue. Java associe la complétion P2 isolée de la bibliothèque standard et du document courant aux diagnostics ECJ de fichier unique. Kotlin fournit une complétion P2+ sans fournisseur sémantique.

Les paramètres de l'éditeur de code AutoJs6 affichent cette même matrice de neuf modes. Le commutateur LSP global contrôle tous les services sémantiques, avec des commutateurs par langage pour TypeScript/JavaScript, Python, Lua et Java; Kotlin reste visible mais indisponible. La liste des types de fichiers est évaluée en premier: retirer un suffixe reconnu désactive sa sémantique, tandis qu'ajouter un suffixe personnalisé autorise seulement le fichier dans le chemin LSP sans le reclasser ni créer de fournisseur sémantique.

******

### Compilation

******

Utilisez le Gradle Wrapper inclus avec JDK 17 ou une version ultérieure et Android SDK 37:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Compilation Release:

```powershell
.\gradlew.bat :app:assembleRelease
```

Les paramètres de compilation et la version proviennent de `version.properties`; le SDK minimal actuel est 24 et le SDK cible est 36.

Après la mise à jour ou l'ajout de `autojs6/types/**/*.d.ts`, vous pouvez exécuter directement cette tâche:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

La tâche valide les références des déclarations et la syntaxe TypeScript 6, puis génère les ressources LSP `core`, `android`, `libraries`, `resources` et `main-app` ainsi que leur manifest. `assemble` et `mergeAssets` en dépendent déjà, les compilations normales ne nécessitent donc aucune étape supplémentaire; les scripts externes peuvent également l'appeler directement. Les fichiers générés sont écrits uniquement dans `app/build/generated/aceLspAssets` et ne remplacent ni ne suppriment les déclarations source complètes sous `src/main/assets`. Si Node ne figure pas dans `PATH`, indiquez `-Pautojs6.nodeExecutable=<chemin-node>`.

Après une modification des sources d'index statiques Python, Lua, Java ou Kotlin dans `tools/ace-lsp/generate-language-indices.mjs`, régénérez les ressources versionnées avec cette tâche:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

Le générateur fixe la version de référence de chaque langage et produit des ressources déterministes séparées sous `autojs6/indices`; l'éditeur ne charge le langage actif qu'à sa première utilisation. `verifyAutoJs6LanguageIndices` détecte les fichiers obsolètes et fait partie de la chaîne de vérification normale.

Après modification de la source épinglée du Worker Pyright, régénérez explicitement les ressources sémantiques Python versionnées avec cette tâche:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

Vérifiez la version du Worker, les empreintes typeshed et des licences, le budget de taille, la sémantique, le repli et le cycle de vie avec:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

L'assemblage APK normal empaquette le Worker versionné et vérifié sans le télécharger ni le régénérer. Les ressources sémantiques occupent 4.822 MiB, sous le seuil optionnel de 8 MiB ; les anciens WebView incapables d'analyser sa syntaxe ES2022 poursuivent avec P2 sans boîte de dialogue d'erreur.

Après modification de la source LuaLS épinglée ou du verrou de compilation, reconstruisez explicitement le runtime Android versionné avec:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

Vérifiez la version LuaLS, les empreintes du runtime et des ELF, l'inventaire des licences, la sémantique, le repli selon l'ABI et le cycle de vie avec:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

L'assemblage APK normal empaquette la distribution LuaLS versionnée et vérifiée sans la télécharger ni la reconstruire. Sa charge de 7.900 MiB reste sous le seuil de 8 MiB par langage et prend en charge arm64-v8a, armeabi-v7a et x86_64 ; les ABI non pris en charge poursuivent avec P2 sans boîte de dialogue d'erreur.

******

### Installation

******

Installez l'APK généré après la compilation:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.12.1-universal.apk
```

Activez ensuite `ace-editor` dans le centre de plugins AutoJs6, quittez complètement AutoJs6, puis redémarrez-le. Redémarrez l'hôte après chaque installation, mise à jour ou retour à une version antérieure du plugin.

Les installations de production doivent utiliser une signature approuvée par AutoJs6. Le code du plugin exécuté dans le même processus hérite des autorisations du processus hôte, n'installez donc pas d'APK provenant de sources inconnues ou non auditées.

******

### Historique des versions

******

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

##### Pour plus d'historique des versions

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-fr.md)

******

### Structure des ressources

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` contient les métadonnées localisées du plugin et les textes de l'interface de l'éditeur. Les fichiers README et CHANGELOG sont générés depuis des sources JSON par `.python/generate_markdown.py`, et le dernier changelog localisé est également écrit dans le répertoire `assets/doc` de l'APK.

******

### Liens

******

- Projet AutoJs6: https://github.com/SuperMonster003/AutoJs6
- Site Web d'Ace: https://ace.c9.io
- Avis relatifs aux composants tiers: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- Licence du projet: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
