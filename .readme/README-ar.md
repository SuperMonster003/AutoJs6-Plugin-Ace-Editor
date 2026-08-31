<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <h1>AutoJs6 Ace Editor Plugin</h1>

  <p>مكون إضافي مستقل لمحرر أكواد Ace في AutoJs6</p>

  <p>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/releases"><img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/SuperMonster003/AutoJs6-Plugin-Ace-Editor?label=Release"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/issues"><img alt="GitHub closed issues" src="https://img.shields.io/github/issues/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=A24232&label=Issues"/></a>
    <a href="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE"><img alt="GitHub License" src="https://img.shields.io/github/license/SuperMonster003/AutoJs6-Plugin-Ace-Editor?color=534BAE&label=License"/></a>
  </p>
</div>

******

### اللغات (Languages)

******

يدعم README.md الحالي اللغات التالية:

- [简体中文 [zh-Hans]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hans.md)
- [繁體中文 (香港) [zh-Hant-HK]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-HK.md)
- [繁體中文 (台灣) [zh-Hant-TW]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-zh-Hant-TW.md)
- [English [en]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-en.md)
- [Français [fr]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-fr.md)
- [Español [es]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-es.md)
- [日本語 [ja]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ja.md)
- [한국어 [ko]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ko.md)
- [Русский [ru]](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/.readme/README-ru.md)
- العربية [ar] # الحالي

******

### مقدمة

******

يفصل مكون AutoJs6 Ace Editor الإضافي بيئة تشغيل Ace WebView وجسر JavaScript وتكييف أسلوب الإدخال وخدمات اللغات المضمنة وأصول المحرر عن ملف APK المضيف. يتم تثبيته كملف Android APK عادي ويعمل داخل عملية AutoJs6 من خلال Editor API محددة الأنواع.

******

### الميزات

******

- يوفر معرف المكون الإضافي `ace-editor` والمحرك `editor` والمتغير `ace`, مع الاكتشاف عبر `org.autojs.plugin.INFO` و`org.autojs.plugin.EDITOR`.
- يستخدم عقد Editor API 1 ويتطلب AutoJs6 `6.8.0 Alpha7` build `5235` أو أحدث وAndroid API 24 أو أحدث.
- يدعم تحرير النص والتراجع/الإعادة والبحث والاستبدال والبحث بالتعبيرات النمطية والكلمات الكاملة والتنقل بالمؤشر والتحديد وعمليات الأسطر ونقاط التوقف وتبديل التعليقات وتنسيق الأكواد.
- يتضمن خدمات لغات JavaScript/TypeScript وتصريحات الأنواع الخاصة بـ AutoJs6, مع الإكمال وhover وdiagnostics وsignature help. ويوفر syntax diagnostics فقط لملفات JSON.
- يضيف تحليلا دلاليا مضمنا لـ Python 3.12 عبر WebWorker من Pyright 1.1.413 ينشأ عند الحاجة: إكمال مدرك للأنواع وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف؛ وتبقى WebView القديمة غير المتوافقة على P2 بصمت.
- يضيف دلالات Lua تعمل بالكامل دون اتصال عبر عملية مرافقة على الجهاز من LuaLS 3.18.2: الإكمال وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف مفعلة افتراضيا على arm64-v8a وarmeabi-v7a وx86_64؛ وتحتفظ معماريات ABI غير المدعومة وأعطال التشغيل بـ P2 بصمت.
- يدعم الحفاظ على CRLF ومزامنة النص التزايدية والتحميل المجزأ للنصوص الكبيرة ووضعا خفيفا للأسطر الطويلة جدا وتكييف IME ومراقبة سلامة بيئة التشغيل وإشعارات الرجوع إلى محرر المضيف الأصلي.
- يوفر السمات وإعدادات العرض, بالإضافة إلى إدارة الخطوط مع التحقق من الكتالوج الموقع رقميا والتحقق من SHA-256/WOFF2 والتنزيل والتخزين المؤقت والتثبيت والإزالة.
- تمت ترجمة بيانات المكون الإضافي ومحتوى README وCHANGELOG إلى الإسبانية والفرنسية والروسية والعربية واليابانية والكورية والإنجليزية والصينية المبسطة والصينية التقليدية في هونغ كونغ والصينية التقليدية في تايوان.

******

### دعم لغات البرمجة

******

يوضح الجدول التالي قدرات اللغات المضمنة حاليا. يشمل الدعم الدلالي الإكمال المدرك للأنواع وتشخيص الأنواع وhover ومساعدة التوقيع:

| اللغة | تمييز الصياغة | إكمال الكلمات المفتاحية | المقتطفات | الإكمال المحلي | الدعم الدلالي |
|---|---:|---:|---:|---:|---:|
| JavaScript | نعم | نعم | نعم | نعم | نعم |
| JSX | نعم | لا | لا | نعم | نعم |
| TypeScript | نعم | نعم | نعم | نعم | نعم |
| TSX | جزئي | نعم | نعم | نعم | نعم |
| JSON | نعم | لا | لا | لا | تشخيص الصياغة فقط |
| Python | نعم | نعم | نعم | نعم | نعم |
| Lua | نعم | نعم | نعم | نعم | نعم |
| Java | نعم | نعم | نعم | نعم | لا |
| Kotlin | نعم | نعم | نعم | نعم | لا |

يستخدم TSX وضع TypeScript في Ace 1.4.12 ولذلك يكون تمييز وسوم JSX جزئيا. تستخدم Python افتراضيا Worker من Pyright 1.1.413 يعمل بالكامل دون اتصال مع stubs مكتبة Python 3.12 القياسية، وتعود بصمت إلى P2 عند عدم توافق WebView قديمة أو فشل runtime. تستخدم Lua افتراضيا عملية مرافقة تعمل دون اتصال من LuaLS 3.18.2 على arm64-v8a وarmeabi-v7a وx86_64، وتعود بصمت إلى P2 عندما يكون runtime الأصلي غير متاح أو يفشل. تحتفظ Java وKotlin بإكمال P2 المعزول والمحمل عند الحاجة من المكتبة القياسية والمستند الحالي من دون استنتاج أنواع المتغيرات. يحتفظ TypeScript بسلوكه الدلالي الحالي وتبقى مفاتيح دلالة Java وKotlin معطلة حتى مراحلهما اللاحقة.

******

### البناء

******

استخدم Gradle Wrapper المرفق مع JDK 17 أو أحدث وAndroid SDK 36:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

بناء Release:

```powershell
.\gradlew.bat :app:assembleRelease
```

تأتي معلمات البناء والإصدار من `version.properties`; الحد الأدنى الحالي لـ SDK هو 24 والـ SDK المستهدف هو 36.

بعد تحديث أو إضافة `autojs6/types/**/*.d.ts`, يمكن تشغيل المهمة التالية مباشرة:

```powershell
.\gradlew.bat :app:generateAutoJs6LspDeclarations
```

تتحقق المهمة من مراجع التصريحات وصياغة TypeScript 6, ثم تنشئ أصول مجموعات LSP الخمس `core` و`android` و`libraries` و`resources` و`main-app` وملف manifest الخاص بها. تعتمد `assemble` و`mergeAssets` عليها بالفعل, لذلك لا يتطلب البناء المعتاد أي خطوة إضافية; ويمكن للبرامج النصية الخارجية استدعاؤها مباشرة أيضا. تكتب الملفات الناتجة في `app/build/generated/aceLspAssets` فقط ولا تستبدل أو تحذف التصريحات المصدرية الكاملة ضمن `src/main/assets`. إذا لم يكن Node موجودا في `PATH`, فمرر `-Pautojs6.nodeExecutable=<node-path>`.

بعد تغيير مصادر الفهارس الثابتة للغات Python أو Lua أو Java أو Kotlin في `tools/ace-lsp/generate-language-indices.mjs`, أعد إنشاء الأصول الملتزم بها عبر هذه المهمة:

```powershell
.\gradlew.bat :app:generateAutoJs6LanguageIndices
```

يثبت المولد إصدار الأساس لكل لغة وينتج أصولا منفصلة وحتمية تحت `autojs6/indices`; لا يحمل المحرر إلا اللغة النشطة عند أول استخدام. تكشف `verifyAutoJs6LanguageIndices` الملفات القديمة وهي جزء من سلسلة التحقق العادية.

بعد تغيير مصدر Worker المثبت لـ Pyright، أعد صراحة إنشاء أصول Python الدلالية الملتزم بها عبر هذه المهمة:

```powershell
.\gradlew.bat :app:generateAutoJs6PythonWorker
```

تحقق من إصدار Worker الملتزم به وتجزئات typeshed والتراخيص وميزانية الحجم والسلوك الدلالي والرجوع ودورة الحياة باستخدام:

```powershell
.\gradlew.bat :app:verifyAutoJs6PythonWorker
```

يجمع بناء APK العادي Worker الملتزم به والمتحقق منه ولا ينزله أو يعيد إنشاءه. يبلغ حجم الأصول الدلالية 4.822 MiB، وهو أقل من حد التسليم الاختياري 8 MiB؛ وتستمر WebView القديمة التي لا تحلل صياغة ES2022 الخاصة به في استخدام P2 من دون مربع خطأ.

بعد تغيير مصدر LuaLS المثبت أو قفل البناء، أعد صراحة بناء runtime Android الملتزم به باستخدام:

```powershell
.\tools\ace-lsp\build-luals-android.ps1 `
  -NdkRoot <android-sdk>\ndk\29.0.14206865 `
  -OutputRoot build\luals-android\dist
```

تحقق من إصدار LuaLS الملتزم به وتجزئات runtime وELF وجرد التراخيص والسلوك الدلالي والرجوع حسب ABI ودورة الحياة باستخدام:

```powershell
.\gradlew.bat :app:verifyAutoJs6LuaLanguageServer
```

يجمع بناء APK العادي توزيعة LuaLS الملتزم بها والمتحقق منها ولا ينزلها أو يعيد بناءها. يبلغ حجمها 7.900 MiB، وهو أقل من حد 8 MiB لكل لغة، وتدعم arm64-v8a وarmeabi-v7a وx86_64؛ وتستمر معماريات ABI غير المدعومة في استخدام P2 من دون مربع خطأ.

******

### التثبيت

******

ثبت ملف APK الناتج بعد البناء:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.18-universal.apk
```

ثم فعل `ace-editor` في مركز المكونات الإضافية في AutoJs6, واخرج من AutoJs6 بالكامل ثم أعد تشغيله. أعد تشغيل المضيف بعد تثبيت المكون الإضافي أو تحديثه أو الرجوع إلى إصدار سابق منه.

يجب أن تستخدم عمليات التثبيت في بيئة الإنتاج توقيعا يثق به AutoJs6. ترث شيفرة المكون الإضافي التي تعمل داخل العملية أذونات عملية المضيف, لذلك لا تثبت ملفات APK من مصادر مجهولة أو غير مدققة.

******

### سجل الإصدارات

******

# v1.1.18

###### 2026/08/31

* `ميزة` تضمين تعريفات تكميم PNG الآمن للموارد في AutoJs6 `4.6.0` ومجموعة LSP المعاد توليدها لـ main-app: تؤدي ميزانيتا `maxPixels` و`maxMemoryBytes` القابلتان للضبط إلى فشل بتفاصيل نوعية عند تجاوزهما, وتعرض النتائج `peakWorkingMemoryBytes`, وتغطي واجهات الإلغاء الطلبات الصريحة وإيقاف البرنامج النصي
* `ميزة` إضافة دعم P1 دون اتصال للغات Python وLua وJava وKotlin: توجه الامتدادات إلى أوضاع Ace مخصصة مع تمييز الصياغة والكلمات المفتاحية والمقتطفات وإكمال كلمات المستند; تفعل Lua أيضا تشخيص الصياغة عبر worker وتبقى اللغات الأربع معزولة عن مرشحات AutoJs6/TypeScript
* `ميزة` إضافة إكمال P2 دون اتصال للغات Python وLua وJava وKotlin: تجمع فهارس المكتبات القياسية ثابتة الإصدار والمحملة عند الطلب مع استخراج imports والدوال والفئات والأساليب والمعلمات والمتغيرات من المستند الحالي مع الحفاظ على العزل بين اللغات وسلوك JavaScript/TypeScript الحالي
* `ميزة` إضافة Provider دلالي قابل للتبديل بثماني قدرات ونواة JSON-RPC/LSP عامة ونقلي WebWorker/stdio داخل الجهاز; ينتقل TypeScript دون تراجع وتعود أعطال provider إلى P2 وتبقى مفاتيح الدلالة للغات الأربع الجديدة معطلة افتراضيا
* `ميزة` تضمين دلالات Python 3.12 تعمل بالكامل دون اتصال باستخدام Worker مثبت من Pyright 1.1.413 ومجموعة فرعية من 271 ملف typeshed: يصبح الإكمال المدرك للأنواع وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف مفعلا افتراضيا، بينما تعود WebView القديمة غير المتوافقة وأعطال runtime بصمت إلى P2
* `ميزة` تضمين دلالات Lua تعمل بالكامل دون اتصال باستخدام عملية مرافقة مثبتة على الجهاز من LuaLS 3.18.2: يفعل الإكمال وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف افتراضيا على arm64-v8a وarmeabi-v7a وx86_64؛ وتعود الأصول الأصلية المفقودة أو التالفة ومعماريات ABI غير المدعومة وأعطال العملية بصمت إلى P2 مع استعادة بتراجع زمني محدود

# v1.1.17

###### 2026/08/31

* `ميزة` تضمين تعريفات تكميم PNG الصحيحة لونيا في AutoJs6 `4.5.0` ومجموعة LSP المعاد توليدها لـ main-app: تكتب `images.quantizeToFile` مباشرة إلى ملف وتعيد الحجم ومقاييس الجودة, بينما يتحكم `preserveAlpha` في الإخراج الشفاف أو المعتم

# v1.1.16

###### 2026/08/30

* `ميزة` تضمين تعريفات نتائج تكميم PNG في AutoJs6 `4.4.0` ومجموعة LSP المعاد توليدها لـ main-app: تعيد `images.quantize` البايتات المشفرة والحجم والجودة المحققة وخطأ التكميم; ويكشف تعذر تحقيق حد جودة صريح `QualityTooLowException` ذا نوع محدد

##### لمزيد من سجل الإصدارات

* [CHANGELOG.md](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/assets/doc/CHANGELOG-ar.md)

******

### بنية الموارد

******

```text
.readme/lang_*.json
.changelog/lang_*.json
.python/generate_markdown.py
app/src/main/res/values-*/strings.xml
app/src/main/assets/doc/CHANGELOG*.md
```

يحتوي `strings.xml` على بيانات المكون الإضافي ونصوص واجهة المحرر المترجمة. يتم إنشاء README وCHANGELOG من مصادر JSON بواسطة `.python/generate_markdown.py`, كما تتم كتابة أحدث سجل تغييرات مترجم إلى دليل `assets/doc` في ملف APK.

******

### الروابط

******

- مشروع AutoJs6: https://github.com/SuperMonster003/AutoJs6
- موقع Ace: https://ace.c9.io
- إشعارات الجهات الخارجية: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/THIRD_PARTY_NOTICES.md
- ترخيص المشروع: https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/LICENSE
