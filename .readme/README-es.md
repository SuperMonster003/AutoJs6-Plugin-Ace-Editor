<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>Editor de código Ace integrado con servicios de lenguaje</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### Idiomas (Languages)

******

El README.md actual admite los siguientes idiomas:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- Español [es] # actual
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- [العربية [ar]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ar.md)

******

### Introducción

******

El complemento AutoJs6 Ace Editor separa del APK anfitrión el runtime de Ace WebView, el puente JavaScript, la adaptación de los métodos de entrada, los servicios de lenguaje integrados y los recursos del editor. Se instala como un APK Android normal y se ejecuta dentro del proceso de AutoJs6 mediante la Editor API tipada.

******

### Funciones

******

- Proporciona el ID de complemento `ace-editor`, el motor `editor` y la variante `ace`, con descubrimiento mediante `org.autojs.plugin.INFO` y `org.autojs.plugin.EDITOR`.
- Usa el contrato 5 de Editor API y requiere AutoJs6 build 5276 o posterior y Android API 24 o posterior.
- Admite edición de texto, deshacer y rehacer, búsqueda y reemplazo, búsqueda por expresiones regulares y palabras completas, navegación del cursor y la selección, operaciones con líneas, puntos de interrupción, activación y desactivación de comentarios y formato de código.
- Incluye servicios de lenguaje JavaScript/TypeScript y declaraciones de tipos de AutoJs6 con autocompletado, información al pasar el cursor, diagnósticos y ayuda de firmas, mientras que el servicio JSON solo proporciona diagnósticos de sintaxis.
- Añade análisis semántico de Python 3.12 mediante un WebWorker Pyright 1.1.413 cargado bajo demanda: autocompletado con tipos, información al pasar el cursor, ayuda de firmas, diagnósticos y definiciones; los WebView antiguos incompatibles conservan P2 silenciosamente.
- Añade semántica de Lua totalmente sin conexión mediante un proceso complementario LuaLS 3.18.2 en el dispositivo: autocompletado, hover, ayuda de firmas, diagnósticos y definiciones se activan por defecto en arm64-v8a, armeabi-v7a y x86_64; los ABI no compatibles y los fallos del runtime conservan P2 silenciosamente.
- Admite la conservación de CRLF, la sincronización incremental de texto, la carga por bloques de textos grandes, un modo ligero para líneas muy largas, la adaptación de IME, la supervisión del estado del runtime y las notificaciones para volver al editor nativo del anfitrión.
- Proporciona temas y ajustes de visualización, además de gestión de fuentes con verificación de catálogos firmados, validación SHA-256/WOFF2, descarga, almacenamiento en caché, instalación y eliminación.
- Los metadatos del complemento, el README y el CHANGELOG están localizados en español, francés, ruso, árabe, japonés, coreano, inglés, chino simplificado, chino tradicional de Hong Kong y chino tradicional de Taiwán.
- Elige el APK para la ABI del dispositivo o el APK universal. El análisis semántico de Lua está disponible en arm64-v8a, armeabi-v7a y x86_64; x86 conserva el editor y el autocompletado estático.

******

### Compatibilidad con lenguajes de programación

******

La tabla siguiente describe las capacidades de lenguaje incluidas actualmente. La compatibilidad semántica incluye completado con tipos, diagnósticos de tipos, hover y ayuda de firmas:

| Lenguaje | Resaltado de sintaxis | Completado de palabras clave | Fragmentos | Autocompletado local | Compatibilidad semántica |
|---|---:|---:|---:|---:|---:|
| JavaScript | Sí | Sí | Sí | Sí | Sí |
| JSX | Sí | No | No | Sí | Sí |
| TypeScript | Sí | Sí | Sí | Sí | Sí |
| TSX | Parcial | Sí | Sí | Sí | Sí |
| JSON | Sí | No | No | No | Solo diagnósticos de sintaxis |
| Python | Sí | Sí | Sí | Sí | Sí |
| Lua | Sí | Sí | Sí | Sí | Sí |
| Java | Sí | Sí | Sí | Sí | Diagnósticos de un solo archivo |
| Kotlin | Sí | Sí | Sí | P2+ | No |

TSX usa el modo TypeScript de Ace 1.4.12, por lo que el resaltado de etiquetas JSX es parcial. Python usa por defecto un Worker Pyright 1.1.413 totalmente sin conexión con stubs de la biblioteca estándar de Python 3.12 y vuelve silenciosamente a P2 si un WebView antiguo es incompatible o falla el runtime. Lua usa por defecto un proceso complementario LuaLS 3.18.2 sin conexión en arm64-v8a, armeabi-v7a y x86_64, y vuelve silenciosamente a P2 si el runtime nativo no está disponible o falla. Java combina el autocompletado P2 aislado de la biblioteca estándar y el documento actual con diagnósticos ECJ de un solo archivo. Kotlin proporciona autocompletado P2+ sin proveedor semántico.

Los ajustes del editor de código de AutoJs6 muestran esta misma matriz de nueve modos. El interruptor LSP global controla todos los servicios semánticos, con interruptores por lenguaje para TypeScript/JavaScript, Python, Lua y Java; Kotlin permanece visible pero no disponible. La lista de tipos de archivo se evalúa primero: quitar un sufijo reconocido desactiva su semántica, mientras que añadir un sufijo personalizado solo admite el archivo en la ruta LSP sin reclasificarlo ni crear un proveedor semántico.

******

### Compilación

******

Utilice el Gradle Wrapper incluido con JDK 17 o posterior y Android SDK 36:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

Compilación Release:

```powershell
.\gradlew.bat :app:assembleRelease
```

Los parámetros de compilación y la versión provienen de `version.properties`; el SDK mínimo actual es 24 y el SDK de destino es 36.

Después de actualizar o añadir `autojs6/types/**/*.d.ts`, puede ejecutar directamente esta tarea:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

La tarea valida las referencias de las declaraciones y la sintaxis de TypeScript 6, y después genera los recursos LSP `core`, `android`, `libraries`, `resources` y `main-app` junto con su manifest. `assemble` y `mergeAssets` ya dependen de ella, por lo que las compilaciones normales no requieren pasos adicionales; los scripts externos también pueden invocarla directamente. Los archivos generados solo se escriben en `app/build/generated/aceLspAssets` y nunca sobrescriben ni eliminan las declaraciones fuente completas de `src/main/assets`. Si Node no está en `PATH`, indique `-Pautojs6.nodeExecutable=<ruta-de-node>`.

Después de cambiar las fuentes de los índices estáticos de Python, Lua, Java o Kotlin en `tools/ace-lsp/generate-language-indices.mjs`, regenere los recursos versionados con esta tarea:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

El generador fija la versión base de cada lenguaje y produce recursos deterministas separados en `autojs6/indices`; el editor solo carga el lenguaje activo en su primer uso. `verifyAutoJs6LanguageIndices` detecta archivos obsoletos y forma parte de la cadena de verificación normal.

Tras cambiar el código fuente fijado del Worker de Pyright, regenere explícitamente los recursos semánticos de Python confirmados mediante esta tarea:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

Verifique la versión del Worker, los hashes de typeshed y licencias, el presupuesto de tamaño, la semántica, la degradación y el ciclo de vida con:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

El ensamblado normal del APK empaqueta el Worker confirmado y verificado, sin descargarlo ni regenerarlo. Los recursos semánticos ocupan 4.822 MiB, por debajo del umbral opcional de 8 MiB; los WebView antiguos que no analizan su sintaxis ES2022 continúan con P2 sin mostrar errores.

Después de cambiar el código fuente fijado de LuaLS o el bloqueo de compilación, reconstruya explícitamente el runtime Android versionado con:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

Verifique la versión de LuaLS, los hashes del runtime y ELF, el inventario de licencias, la semántica, la degradación por ABI y el ciclo de vida con:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

El ensamblado normal del APK empaqueta la distribución LuaLS versionada y verificada, sin descargarla ni reconstruirla. Su carga de 7.900 MiB está por debajo del umbral de 8 MiB por lenguaje y admite arm64-v8a, armeabi-v7a y x86_64; los ABI no compatibles continúan con P2 sin mostrar errores.

******

### Instalación

******

Instale el APK generado después de la compilación:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.6.0-universal.apk
```

A continuación, active `ace-editor` en el centro de complementos de AutoJs6, cierre AutoJs6 por completo y reinícielo. Reinicie el anfitrión después de instalar, actualizar o revertir el complemento.

Las instalaciones de producción deben utilizar una firma en la que confíe AutoJs6. El código del complemento que se ejecuta en el mismo proceso hereda los permisos del proceso anfitrión, así que no instale APK de fuentes desconocidas o no auditadas.

******

### Historial de versiones

******

# v1.6.0

###### 2026/09/14

* `Mejora` Sincronizar las declaraciones AutoJs6 4.15.0 de la opción scales de images.matchTemplate, los campos geométricos de las coincidencias de plantilla y los métodos auxiliares de MatchingResult, regenerar las declaraciones de recursos y dependencias y los grupos LSP

# v1.5.0

###### 2026/09/14

* `Mejora` Sincronizar las declaraciones AutoJs6 4.14.0 de images.countPointsByColor, images.getMeanColor, images.readPixels y la familia colors.distance / invert / blend / contrast, regenerar las declaraciones de recursos y dependencias y los grupos LSP

# v1.4.0

###### 2026/09/14

* `Mejora` Sincronizar las declaraciones AutoJs6 4.13.0 de LaunchConfig.requiresSharedStorage, regenerar las declaraciones de recursos y dependencias y los grupos LSP

##### Para ver más historial de versiones

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-es.md)

******

### Estructura de recursos

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

`strings.xml` contiene los metadatos localizados del complemento y los textos de la interfaz del editor. Los archivos README y CHANGELOG se generan desde fuentes JSON mediante `.python/generate_markdown.py`, y el changelog localizado más reciente también se escribe en el directorio `assets/doc` del APK.

******

### Enlaces

******

- Proyecto AutoJs6: https://github.com/SuperMonster003/AutoJs6
- Sitio web de Ace: https://ace.c9.io
- Avisos de terceros: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- Licencia del proyecto: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
