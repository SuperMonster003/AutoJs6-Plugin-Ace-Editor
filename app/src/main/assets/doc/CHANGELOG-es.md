******

### Historial de versiones

******

# v1.1.1

###### 2026/07/27

* `Corrección` Se corrigió el autocompletado de miembros estáticos de los grupos de declaraciones opcionales, incluidos `App.CHROME` y los grandes conjuntos de recursos `R.string.text_*`; las listas de candidatos truncadas de Ace ahora se actualizan con antirrebote cuando cambia el prefijo

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
