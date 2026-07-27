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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.1-universal.apk
```

Activez ensuite `ace-editor` dans le centre de plugins AutoJs6, quittez complètement AutoJs6, puis redémarrez-le. Redémarrez l'hôte après chaque installation, mise à jour ou retour à une version antérieure du plugin.

Les installations de production doivent utiliser une signature approuvée par AutoJs6. Le code du plugin exécuté dans le même processus hérite des autorisations du processus hôte, n'installez donc pas d'APK provenant de sources inconnues ou non auditées.

******

### Historique des versions

******

# v1.1.1

###### 2026/07/27

* `Correctif` Correction de la complétion des membres statiques des groupes de déclarations facultatifs, notamment `App.CHROME` et les grands ensembles de ressources `R.string.text_*`; les listes de candidats tronquées d'Ace sont désormais actualisées avec une temporisation anti-rebond lorsque le préfixe change
* `Correctif` Correction d'une détection erronée des documents volumineux ordinaires comme contenant de très longues lignes, qui les faisait basculer en mode texte brut et désactivait la coloration JavaScript, la complétion et les services sémantiques; les lignes individuelles réellement très longues conservent le mode de sécurité
* `Correctif` Correction de la bulle Ace d'aide aux signatures/paramètres qui utilisait toujours un fond clair; elle adopte désormais dynamiquement les couleurs d'arrière-plan et de premier plan du thème de l'éditeur, tandis qu'une fenêtre de candidats d'autocomplétion déjà ouverte est actualisée séparément lors d'un changement de thème

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
