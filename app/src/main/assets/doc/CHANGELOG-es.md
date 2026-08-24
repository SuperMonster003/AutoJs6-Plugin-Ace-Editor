******

### Historial de versiones

******

# v1.1.10

###### 2026/08/24

* `Función` Alinea los diagnósticos TypeScript de Ace con los perfiles Rhino/Node revisión 2 de TypeScript 6.0.3 del complemento compilador (ES2018, strict, CommonJS/Node10 o NodeNext), incluido el enrutamiento de proyectos Node y la compatibilidad predeterminada con declaraciones .mts/.cts, conservando el modo alternativo estático

# v1.1.9

###### 2026/08/21

* `Función` Declarar perfiles backend explícitos para `ai.ask`/`ai.chat`/`ai.stream` y `ai.session` persistente, incluidos `cpu`/`gpu`/`npu`, disponibilidad por dispositivo en `ai.models`, razones estables de no disponibilidad y ausencia de fallback a CPU

# v1.1.8

###### 2026/08/21

* `Función` Declara JSON estructurado nativo para `ai.ask`/`ai.chat`/`ai.stream` y la sesión persistente `ai.session`, con `structuredJson`, el objeto JSON `responseSchema` y un schema fijo por sesión

# v1.1.7

###### 2026/08/21

* `Función` Añade las declaraciones de conversación persistente en el dispositivo de `ai.session`, con opciones fijas de sesión, métodos `ask`/`chat`/`stream` de un prompt nuevo por turno, estado del ciclo de vida y cierre explícito

# v1.1.6

###### 2026/08/21

* `Función` Completa las declaraciones del plugin de IA local de AutoJs6 con historial de mensajes multirrol, selectores oficiales y de terceros, controles de generación, cargas útiles exactas de uso y streaming, y el descubrimiento de modelos mediante `ai.models`

# v1.1.5

###### 2026/08/21

* `Función` Sincronización de las declaraciones de tipos de detección de objetos del plugin YOLO independiente de AutoJs6, incluidos el componente Provider explícito, las opciones de sesión y detección, los resultados y los códigos de error estables

# v1.1.4

###### 2026/08/20

* `Función` Sincronización de las declaraciones de tipos `Ask`, `Chat` y `Stream` del plugin de IA de AutoJs6, incluidas la selección de plugins oficiales y de terceros, los controles de generación local, las respuestas de ruta y los tipos de eventos de streaming

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
