<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>Complemento independiente del editor de código Ace para AutoJs6</p>

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
- Utiliza el contrato Editor API 1 y requiere AutoJs6 `6.8.0 Alpha7` build `5235` o posterior y Android API 24 o posterior.
- Admite edición de texto, deshacer y rehacer, búsqueda y reemplazo, búsqueda por expresiones regulares y palabras completas, navegación del cursor y la selección, operaciones con líneas, puntos de interrupción, activación y desactivación de comentarios y formato de código.
- Incluye servicios de lenguaje JavaScript/TypeScript y declaraciones de tipos de AutoJs6 con autocompletado, información al pasar el cursor, diagnósticos y ayuda de firmas, mientras que el servicio JSON solo proporciona diagnósticos de sintaxis.
- Admite la conservación de CRLF, la sincronización incremental de texto, la carga por bloques de textos grandes, un modo ligero para líneas muy largas, la adaptación de IME, la supervisión del estado del runtime y las notificaciones para volver al editor nativo del anfitrión.
- Proporciona temas y ajustes de visualización, además de gestión de fuentes con verificación de catálogos firmados, validación SHA-256/WOFF2, descarga, almacenamiento en caché, instalación y eliminación.
- Los metadatos del complemento, el README y el CHANGELOG están localizados en español, francés, ruso, árabe, japonés, coreano, inglés, chino simplificado, chino tradicional de Hong Kong y chino tradicional de Taiwán.

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

******

### Instalación

******

Instale el APK generado después de la compilación:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.14-universal.apk
```

A continuación, active `ace-editor` en el centro de complementos de AutoJs6, cierre AutoJs6 por completo y reinícielo. Reinicie el anfitrión después de instalar, actualizar o revertir el complemento.

Las instalaciones de producción deben utilizar una firma en la que confíe AutoJs6. El código del complemento que se ejecuta en el mismo proceso hereda los permisos del proceso anfitrión, así que no instale APK de fuentes desconocidas o no auditadas.

******

### Historial de versiones

******

# v1.1.14

###### 2026/08/28

* `Función` La inteligencia TypeScript entre archivos cubre ahora completado, hover, ayuda de firmas y navegación a definiciones en fuentes del proyecto y declaraciones de dependencias congeladas; F12, Ctrl/Command-click y la acción móvil `Ir a la definición` emiten destinos de contrato 3 que AutoJs6 6.8.0 (5276) valida de forma independiente antes de abrir y posicionar
* `Función` Se añadieron diagnósticos de proyectos TypeScript respaldados por el host: Ace valida y carga ahora la instantánea de fuentes completa y acotada, resuelve importaciones entre archivos del proyecto y resalta módulos ausentes de forma coherente con la compilación previa a la ejecución; requiere AutoJs6 6.8.0 (5276) o posterior
* `Función` Las capas de tipos de proyectos TypeScript ahora detectan señales de addons nativos y hooks del ciclo de instalación antes de continuar la edición, publicando el mismo error estable de límite de dependencias y la misma orientación hacia JavaScript puro/WASM que el host y el compilador
* `Función` Se alineó la autoridad de tipos de dependencias de Ace con la revisión 3 de la política del resolver y se añadió cobertura para lodash 4.17.21 junto con `@types/lodash` 4.17.25, manteniendo diagnósticos coincidentes entre Rhino y Node cuando los paquetes de ejecución no incluyen declaraciones
* `Función` Añadida una capa congelada de tipos de dependencias compartida con el compilador TypeScript: Ace resuelve ahora `types`/`typings`, `typesVersions` de TypeScript 6, declaraciones anidadas y `@types` instalados, con completado de dayjs, hover y diagnosticos strict iguales para Rhino y Node
* `Función` Incluye las declaraciones R8 de AutoJs6 `4.2.0` y los grupos LSP generados: seis sobrecargas de `ScriptRuntime.loadJarWithR8` añaden la exportación verificada de mapping/seeds/usage/retrace metadata, mientras `retraceR8Stack` restaura la pila vinculada a la procedencia mediante el protocolo 1.1 con selección de proveedor sin fallback

# v1.1.13

###### 2026/08/26

* `Función` Incluye las declaraciones de AI finales de AutoJs6 `4.1.0`, exclusivamente mediante plugin: al omitir el selector se usa el objetivo predeterminado del plugin oficial 3-Stone AI, cada solicitud solo acepta el enrutamiento `target` del plugin y el `timeout` canónico, y se eliminan los tipos de conexión directa, credenciales y eventos transitorios del anfitrión

# v1.1.12

###### 2026/08/26

* `Función` Incluye las declaraciones unificadas de destinos de IA de AutoJs6: `ai.catalog`, enrutamiento exacto mediante `target`, destinos locales y en línea, metadatos completos de respuestas y sesiones, salida de razonamiento y errores estables sin retroceso; elimina todas las API y alias antiguos del catálogo de IA que no se publicaron

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
