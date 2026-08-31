******

### Historial de versiones

******

# v1.1.18

###### 2026/08/31

* `Función` Incluye las declaraciones de cuantizacion PNG segura en recursos de AutoJs6 `4.6.0` y el grupo LSP main-app regenerado: los presupuestos configurables `maxPixels` y `maxMemoryBytes` fallan con detalles tipados, los resultados exponen `peakWorkingMemoryBytes` y las API de cancelacion cubren solicitudes explicitas y el cierre del script
* `Función` Añade compatibilidad P1 sin conexión para Python, Lua, Java y Kotlin: las extensiones se enrutan a modos Ace dedicados con resaltado, palabras clave, fragmentos y completado de palabras del documento; Lua también activa diagnósticos de sintaxis mediante worker y los cuatro lenguajes quedan aislados de candidatos AutoJs6/TypeScript
* `Función` Añade autocompletado P2 sin conexión para Python, Lua, Java y Kotlin: índices versionados de bibliotecas estándar cargados bajo demanda se combinan con la extracción de imports, funciones, clases, métodos, parámetros y variables del documento actual, manteniendo el aislamiento entre lenguajes y el comportamiento JavaScript/TypeScript existente
* `Función` Añade un Provider semántico conectable de ocho capacidades, un núcleo JSON-RPC/LSP general y transportes WebWorker/stdio en el dispositivo; TypeScript migra sin regresiones, los fallos vuelven a P2 y los interruptores semánticos de los cuatro nuevos lenguajes están apagados por defecto
* `Función` Integra semántica de Python 3.12 totalmente sin conexión con un Worker Pyright 1.1.413 fijado y un subconjunto de 271 archivos de typeshed: autocompletado con tipos, información al pasar el cursor, ayuda de firmas, diagnósticos y definiciones se activan por defecto, mientras que WebView antiguos incompatibles y fallos del runtime vuelven silenciosamente a P2
* `Función` Integra semántica de Lua totalmente sin conexión con un proceso complementario LuaLS 3.18.2 fijado en el dispositivo: autocompletado, hover, ayuda de firmas, diagnósticos y definiciones se activan por defecto en arm64-v8a, armeabi-v7a y x86_64; recursos nativos ausentes o dañados, ABI no compatibles y fallos del proceso vuelven silenciosamente a P2 con recuperación por reintentos acotados
* `Función` Integra diagnósticos Java de un solo archivo totalmente sin conexión con ECJ 3.26.0 fijado y stubs recortados de Android API 36: los errores de sintaxis y símbolos no resueltos reciben rangos exactos por defecto; el autocompletado permanece en P2 porque JDT Code Assist requiere un entorno Eclipse Workspace/OSGi no disponible en ART
* `Función` Añade autocompletado Kotlin P2+ sin conexión con API de instancia de Kotlin 2.2.21, inferencias conservadoras del archivo actual, safe-call e índices Java/Android reutilizados; la puerta del compilador en el dispositivo falló por tamaño, ejecución ART, memoria y compatibilidad con el SDK mínimo, por lo que no se incluye compilador ni runtime semántico de Kotlin
* `Función` Muestra la misma matriz de nueve modos en los ajustes del editor de código de AutoJs6 con interruptores semánticos para TypeScript/JavaScript, Python, Lua y Java; Kotlin permanece visible pero no disponible en P2+, y la personalización de tipos de archivo se explica como una lista de permitidos en vez de una reclasificación del lenguaje

# v1.1.17

###### 2026/08/31

* `Función` Incluye las declaraciones de cuantizacion PNG con color correcto de AutoJs6 `4.5.0` y el grupo LSP main-app regenerado: `images.quantizeToFile` escribe directamente en un archivo y devuelve tamano y metricas de calidad, mientras `preserveAlpha` controla la salida transparente u opaca

# v1.1.16

###### 2026/08/30

* `Función` Incluye las declaraciones de resultado de cuantizacion PNG de AutoJs6 `4.4.0` y el grupo LSP main-app regenerado: `images.quantize` devuelve bytes codificados, tamano, calidad alcanzada y error de cuantizacion; un limite minimo explicito no alcanzable expone `QualityTooLowException` tipada

# v1.1.15

###### 2026/08/30

* `Función` Incluye las declaraciones de opciones de cuantizacion PNG de AutoJs6 `4.3.0` y los grupos LSP main-app/resources regenerados: `Images.PngQuantizationOptions` cubre tamano de paleta, velocidad, limites de calidad, tramado y posterize, manteniendo compatible el `quality` numerico

# v1.1.14

###### 2026/08/29

* `Función` Se añadió el cambio de nombre de símbolos TypeScript en todo el proyecto mediante F2 y la acción móvil `Renombrar`: Ace obtiene ediciones acotadas entre archivos desde la instantánea exacta, solicita autorización contract 5 a AutoJs6 y deja por completo al host la vista previa, los conflictos, la publicación atómica, la reversión y todas las escrituras en disco
* `Función` Se añadieron correcciones rápidas de TypeScript para importación automática y ortografía mediante Ctrl/Command+. y la acción móvil `Corrección rápida`: Ace limita las correcciones a ediciones ordenadas del búfer activo, solicita autorización de contrato 4 a AutoJs6 6.8.0 (5276) y aplica el resultado aprobado como un único cambio que se puede deshacer
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

# v1.1.11

###### 2026/08/25

* `Función` Incluir las tres sobrecargas explícitas de `ScriptRuntime.loadJarWithR8` en las declaraciones de AutoJs6 y los grupos LSP generados, abarcando keep rules, classpath ordenado y enlaces ordinales de consumer rules

# v1.1.10

###### 2026/08/24

* `Función` Alinea los diagnósticos TypeScript de Ace con los perfiles Rhino/Node revisión 2 de TypeScript 6.0.3 del complemento compilador (ES2018, strict, CommonJS/Node10 o NodeNext), incluido el enrutamiento de proyectos Node y la compatibilidad predeterminada con declaraciones .mts/.cts, conservando el modo alternativo estático

# v1.1.9

###### 2026/08/21

* `Función` Declarar perfiles backend explícitos para `ai.ask`/`ai.chat`/`ai.stream` y `ai.session` persistente, incluidos `cpu`/`gpu`/`npu`, disponibilidad por dispositivo en `ai.catalog`, razones estables de no disponibilidad y ausencia de fallback a CPU

# v1.1.8

###### 2026/08/21

* `Función` Declara JSON estructurado nativo para `ai.ask`/`ai.chat`/`ai.stream` y la sesión persistente `ai.session`, con `structuredJson`, el objeto JSON `responseSchema` y un schema fijo por sesión

# v1.1.7

###### 2026/08/21

* `Función` Añade las declaraciones de conversación persistente en el dispositivo de `ai.session`, con opciones fijas de sesión, métodos `ask`/`chat`/`stream` de un prompt nuevo por turno, estado del ciclo de vida y cierre explícito

# v1.1.6

###### 2026/08/21

* `Función` Completa las declaraciones del plugin de IA local de AutoJs6 con historial de mensajes multirrol, selectores oficiales y de terceros, controles de generación, cargas útiles exactas de uso y streaming, y el descubrimiento de modelos mediante `ai.catalog`

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
