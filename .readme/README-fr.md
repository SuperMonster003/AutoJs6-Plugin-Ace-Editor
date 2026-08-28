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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.14-universal.apk
```

Activez ensuite `ace-editor` dans le centre de plugins AutoJs6, quittez complètement AutoJs6, puis redémarrez-le. Redémarrez l'hôte après chaque installation, mise à jour ou retour à une version antérieure du plugin.

Les installations de production doivent utiliser une signature approuvée par AutoJs6. Le code du plugin exécuté dans le même processus hérite des autorisations du processus hôte, n'installez donc pas d'APK provenant de sources inconnues ou non auditées.

******

### Historique des versions

******

# v1.1.14

###### 2026/08/28

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
