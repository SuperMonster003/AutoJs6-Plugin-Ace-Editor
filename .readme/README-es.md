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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.1-universal.apk
```

A continuación, active `ace-editor` en el centro de complementos de AutoJs6, cierre AutoJs6 por completo y reinícielo. Reinicie el anfitrión después de instalar, actualizar o revertir el complemento.

Las instalaciones de producción deben utilizar una firma en la que confíe AutoJs6. El código del complemento que se ejecuta en el mismo proceso hereda los permisos del proceso anfitrión, así que no instale APK de fuentes desconocidas o no auditadas.

******

### Historial de versiones

******

# v1.1.1

###### 2026/07/28

* `Corrección` Se corrigió el autocompletado de miembros estáticos de los grupos de declaraciones opcionales, incluidos `App.CHROME` y los grandes conjuntos de recursos `R.string.text_*`; las listas de candidatos truncadas de Ace ahora se actualizan con antirrebote cuando cambia el prefijo
* `Corrección` Se corrigió que los documentos grandes normales se confundieran con líneas muy largas y pasaran al modo de texto sin formato, lo que deshabilitaba el resaltado de JavaScript, el autocompletado y los servicios semánticos; las líneas individuales realmente muy largas siguen usando el modo seguro
* `Corrección` Se corrigió que la burbuja de ayuda de firmas/parámetros de Ace usara siempre un fondo claro; ahora adopta dinámicamente los colores de fondo y primer plano del tema del editor, mientras que una ventana emergente de candidatos de autocompletado ya abierta se actualiza por separado al cambiar el tema
* `Corrección` Se corrigió que el ActionMode de selección de texto del sistema no siguiera los colores de Ace sustituyéndolo por una barra de herramientas de selección propia del editor y sensible a la paleta; las acciones de selección, los estados pulsados y el panel de desbordamiento ahora siguen los colores actuales de Ace en todas las versiones de Android

# v1.1.0

###### 2026/07/27

* `Función` Se conservaron las declaraciones fuente completas y se añadieron grupos seleccionables de declaraciones LSP de AutoJs6: `core` permanece siempre habilitado, mientras que `android`, `libraries`, `resources` y `main-app` están deshabilitados de forma predeterminada; seleccionar `libraries` también habilita `android`, y seleccionar `main-app` también habilita `android`, `libraries` y `resources`
* `Función` Se añadió la tarea de Gradle `:app:generateAutoJs6LspDeclarations` para validar las declaraciones y generar los cinco grupos LSP y su manifest; la combinación normal de recursos la ejecuta automáticamente y los scripts externos pueden invocarla directamente
* `Dependencia` Se actualizaron el servicio de lenguaje TypeScript integrado y las declaraciones de la biblioteca estándar de `4.2.4` a `6.0.3`

# v1.0.0

###### 2026/07/21

* `Función` Se añadió el complemento independiente del editor Ace con ID de complemento `ace-editor`, motor `editor` y variante `ace`
* `Función` Se añadió el descubrimiento mediante los componentes `org.autojs.plugin.INFO` y `org.autojs.plugin.EDITOR` protegidos por `org.autojs.permission.PLUGIN`, con el contrato Editor API 1 y el build mínimo del anfitrión `5234`
* `Función` Se añadieron las funciones de edición de Ace `1.4.12`, que incluyen deshacer y rehacer, búsqueda y reemplazo, búsqueda por expresiones regulares y palabras completas, navegación del cursor y la selección, operaciones con líneas, puntos de interrupción, activación y desactivación de comentarios y formato de código
* `Función` Se añadieron servicios de lenguaje JavaScript/TypeScript integrados y declaraciones de tipos de AutoJs6 con autocompletado, información al pasar el cursor, diagnósticos y ayuda de firmas, mientras que el servicio JSON solo proporciona diagnósticos de sintaxis
* `Función` Se añadieron sincronización incremental de texto, conservación de CRLF, carga por bloques de textos grandes, un modo ligero para líneas muy largas y adaptación de IME
* `Función` Se añadieron temas y ajustes de visualización, además de descarga, almacenamiento en caché, instalación y eliminación de fuentes con verificación del catálogo firmado y de la integridad de los archivos
* `Función` Se añadieron supervisión del estado del runtime de WebView, detección de latidos y notificaciones de retorno al editor nativo del anfitrión
* `Función` Se añadieron los metadatos del complemento y el contenido del README y el CHANGELOG localizados en español, francés, ruso, árabe, japonés, coreano, inglés, chino simplificado, chino tradicional de Hong Kong y chino tradicional de Taiwán

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
