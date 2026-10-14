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
- Utilise le contrat 7 de Editor API et nécessite AutoJs6 build 5352 ou ultérieur et Android API 24 ou ultérieur.
- Prend en charge l'édition de texte, l'annulation et le rétablissement, la recherche et le remplacement, la recherche par expression régulière et par mot entier, la navigation du curseur et de la sélection, les opérations sur les lignes, les points d'arrêt, l'activation et la désactivation des commentaires et le formatage du code.
- Le menu Edition > Pliage > Tout déplier / Tout replier agit sur tous les blocs de code, y compris les plis imbriqués et les documents en lecture seule, sans modifier le texte, la sélection ni l'historique d'annulation.
- Basé sur Ace 1.44.0; les gestes tactiles comme le toucher, la sélection de mots par double toucher ou appui long, le déplacement du curseur et des poignées de sélection, le défilement inertiel, le zoom par pincement et la loupe de glissement sont fournis par la couche mobile propre au plugin.
- Les paramètres de l'éditeur de code de l'hôte permettent d'activer ou de désactiver les icônes vectorielles de la gouttière, la mise en évidence du guide d'indentation actif, les barres de défilement de l'éditeur et leur masquage automatique, les espaces dans la sélection, la loupe de glissement, la mise en évidence des occurrences du symbole et l'aperçu en ligne de la complétion; la loupe et l'aperçu en ligne sont désactivés par défaut, et les hôtes sans ces paramètres utilisent les valeurs par défaut.
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
| TSX | Oui | Oui | Oui | Oui | Oui |
| JSON | Oui | Non | Non | Non | Diagnostics syntaxiques uniquement |
| Python | Oui | Oui | Oui | Oui | Oui |
| Lua | Oui | Oui | Oui | Oui | Oui |
| Java | Oui | Oui | Oui | Oui | Diagnostics de fichier unique |
| Kotlin | Oui | Oui | Oui | P2+ | Non |

Python utilise par défaut un Worker Pyright 1.1.413 entièrement hors ligne avec les stubs de la bibliothèque standard Python 3.12 et revient silencieusement à P2 si un ancien WebView est incompatible ou si le runtime échoue. Lua utilise par défaut un processus compagnon LuaLS 3.18.2 hors ligne sur arm64-v8a, armeabi-v7a et x86_64, et revient silencieusement à P2 si le runtime natif est indisponible ou échoue. Java associe la complétion P2 isolée de la bibliothèque standard et du document courant aux diagnostics ECJ de fichier unique. Kotlin fournit une complétion P2+ sans fournisseur sémantique.

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

Après avoir modifié les ressources Ace, la couche mobile ou les scripts du pont, exécutez ces vérifications:

```powershell
.\gradlew.bat :app:verifyAutoJs6AceAssets :app:verifyAutoJs6AceMobileOverlay :app:verifyAutoJs6AceBridge :app:typecheckAutoJs6AceBridge
```

Elles comparent les fichiers Ace 1.44.0 intégrés au manifeste de verrouillage (les fichiers officiels ne doivent pas être modifiés), rejouent des scénarios tactiles enregistrés sur la couche mobile, exécutent les tests de la page de l'éditeur et du pont dans un jsdom de version figée et vérifient les types des scripts du pont avec les déclarations d'Ace. Toutes font partie de `check` et nécessitent Node.js.

Les paramètres de compilation et la version proviennent de `version.properties`; le SDK minimal actuel est 24 et le SDK cible est 37.

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v2.0.0-universal.apk
```

Activez ensuite `ace-editor` dans le centre de plugins AutoJs6, quittez complètement AutoJs6, puis redémarrez-le. Redémarrez l'hôte après chaque installation, mise à jour ou retour à une version antérieure du plugin.

Les installations de production doivent utiliser une signature approuvée par AutoJs6. Le code du plugin exécuté dans le même processus hérite des autorisations du processus hôte, n'installez donc pas d'APK provenant de sources inconnues ou non auditées.

******

### Historique des versions

******

# v2.0.0

###### 2026/10/14

* `Note` Les nouvelles options de l'éditeur se règlent dans les paramètres de l'éditeur de code d'AutoJs6; les versions antérieures d'AutoJs6 sans ces paramètres utilisent les valeurs par défaut
* `Fonctionnalité` Les fichiers TSX utilisent leur propre coloration syntaxique, les balises et attributs JSX sont donc colorés correctement
* `Fonctionnalité` Icônes vectorielles de la gouttière, mise en évidence du guide d'indentation actif et affichage des espaces dans la sélection (activés par défaut)
* `Fonctionnalité` Barres de défilement de l'éditeur, pour signaler la position des erreurs et avertissements, masquées automatiquement après l'arrêt du défilement (activées par défaut)
* `Fonctionnalité` Mise en évidence des occurrences du symbole, pour signaler les autres occurrences du symbole sous le curseur et distinguer lectures et écritures (activée par défaut)
* `Fonctionnalité` Loupe de glissement, pour agrandir le texte sous le doigt pendant le déplacement du curseur ou des poignées de sélection (désactivée par défaut)
* `Fonctionnalité` Aperçu en ligne de la complétion, pour afficher en gris après le curseur la suite de la première suggestion, acceptée avec TAB (désactivé par défaut)
* `Correctif` La complétion, les diagnostics et les autres fonctions sémantiques étaient indisponibles lors de l'édition de fichiers Lua dans AutoJs6
* `Correctif` Les diagnostics ne signalaient qu'une défaillance du compilateur lors de l'édition de fichiers Java dans AutoJs6
* `Correctif` Dans les thèmes sombres, le fond du texte sélectionné superposé à la mise en évidence du même mot était trop clair, ce qui rendait le texte difficile à lire
* `Correctif` Le zoom à deux doigts annulait la sélection du texte et un double toucher juste après le zoom ne sélectionnait pas de mot
* `Amélioration` Un toucher un peu plus lent déplace aussi le curseur, et lever le doigt immobilisé après un glissement ne lance plus de défilement inertiel
* `Amélioration` Après la sélection d'un mot par double toucher, le curseur se place à l'extrémité la plus proche du doigt
* `Amélioration` Toucher le curseur ou appuyer longuement sur une zone vide affiche une barre d'outils avec Coller et Tout sélectionner
* `Amélioration` Toucher la gouttière ne déplace plus le curseur au début de cette ligne, et un point d'arrêt peut aussi être placé à côté de l'icône sur les lignes avec diagnostics
* `Amélioration` Les souris externes et le mode souris des stylets permettent de placer le curseur d'un clic, de sélectionner un mot par double-clic et de sélectionner du texte en glissant dans l'éditeur
* `Amélioration` La fenêtre de complétion, son encadré de documentation, les indications de paramètres et la documentation au survol ne masquent plus la ligne du curseur
* `Amélioration` Les indications de paramètres et la documentation au survol suivent la taille de police de l'éditeur
* `Amélioration` La fenêtre de complétion affiche un état de chargement lorsqu'un service de langage répond lentement, et "Aucune suggestion" lorsque la complétion est lancée manuellement sans résultat
* `Amélioration` La complétion des membres apparaît aussi lorsque Gboard et les méthodes de saisie similaires valident un mot en même temps que le point
* `Amélioration` Les suggestions de complétion Python et Lua suivent l'ordre fourni par le service de langage
* `Amélioration` Meilleure prise en charge du panneau d'édition de texte de Gboard et du déplacement du curseur en glissant sur la barre d'espace
* `Amélioration` Le bouton au point de troncature des lignes très longues peut désormais être touché pour activer ou désactiver le retour automatique à la ligne, et le mode allégé pour les lignes très longues tronque avec ce bouton les lignes de plus de 4096 caractères
* `Dépendance` Mise à niveau de l'éditeur Ace intégré de `1.4.12` vers `1.44.0`

# v1.32.0

###### 2026/10/13

* `Fonctionnalité` Le menu Edition > Pliage > Tout déplier / Tout replier agit sur tous les blocs de code, y compris les plis imbriqués et les documents en lecture seule, sans modifier le texte, la sélection ni l'historique d'annulation

# v1.31.0

###### 2026/10/12

* `Amélioration` Déclarations de types et complétion: device.getAndroidId accepte le booléen useSystemId pour lire la valeur système de l'utilisateur Android de l'application via Shizuku/Root sous Android 8.0+, lève une exception en cas d'échec d'autorisation ou de lecture et ignore ce paramètre sur les anciens systèmes

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
