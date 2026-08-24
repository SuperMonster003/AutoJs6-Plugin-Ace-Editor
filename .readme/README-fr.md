<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>Plugin autonome d'éditeur de code Ace pour AutoJs6</p>

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
- Utilise le contrat Editor API 1 et nécessite AutoJs6 `6.8.0 Alpha7` build `5235` ou version ultérieure, ainsi qu'Android API 24 ou version ultérieure.
- Prend en charge l'édition de texte, l'annulation et le rétablissement, la recherche et le remplacement, la recherche par expression régulière et par mot entier, la navigation du curseur et de la sélection, les opérations sur les lignes, les points d'arrêt, l'activation et la désactivation des commentaires et le formatage du code.
- Inclut des services de langage JavaScript/TypeScript et des déclarations de types AutoJs6 avec complétion, informations au survol, diagnostics et aide à la signature, tandis que le service JSON fournit uniquement des diagnostics syntaxiques.
- Prend en charge la préservation des fins de ligne CRLF, la synchronisation incrémentielle du texte, le chargement par blocs des textes volumineux, un mode allégé pour les lignes très longues, l'adaptation IME, la surveillance de l'état du runtime et les notifications invitant à revenir à l'éditeur natif de l'hôte.
- Propose des thèmes et des paramètres d'affichage, ainsi qu'une gestion des polices avec vérification du catalogue signé, validation SHA-256/WOFF2, téléchargement, mise en cache, installation et suppression.
- Les métadonnées du plugin, le README et le CHANGELOG sont localisés en espagnol, français, russe, arabe, japonais, coréen, anglais, chinois simplifié, chinois traditionnel de Hong Kong et chinois traditionnel de Taïwan.

******

### Compilation

******

Utilisez le Gradle Wrapper inclus avec JDK 17 ou une version ultérieure et Android SDK 36:

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

******

### Installation

******

Installez l'APK généré après la compilation:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.10-universal.apk
```

Activez ensuite `ace-editor` dans le centre de plugins AutoJs6, quittez complètement AutoJs6, puis redémarrez-le. Redémarrez l'hôte après chaque installation, mise à jour ou retour à une version antérieure du plugin.

Les installations de production doivent utiliser une signature approuvée par AutoJs6. Le code du plugin exécuté dans le même processus hérite des autorisations du processus hôte, n'installez donc pas d'APK provenant de sources inconnues ou non auditées.

******

### Historique des versions

******

# v1.1.10

###### 2026/08/24

* `Fonctionnalité` Aligne les diagnostics TypeScript d'Ace sur les profils Rhino/Node révision 2 de TypeScript 6.0.3 du plugin compilateur (ES2018, strict, CommonJS/Node10 ou NodeNext), avec routage des projets Node et prise en charge par défaut des déclarations .mts/.cts, tout en conservant le repli statique

# v1.1.9

###### 2026/08/21

* `Fonctionnalité` Déclarer des profils backend explicites pour `ai.ask`/`ai.chat`/`ai.stream` et `ai.session` persistante, couvrant `cpu`/`gpu`/`npu`, la disponibilité par appareil dans `ai.models`, les raisons stables d'indisponibilité et l'absence de repli CPU

# v1.1.8

###### 2026/08/21

* `Fonctionnalité` Déclare le JSON structuré natif pour `ai.ask`/`ai.chat`/`ai.stream` et la session persistante `ai.session`, avec `structuredJson`, l'objet JSON `responseSchema` et un schema fixe par session

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
