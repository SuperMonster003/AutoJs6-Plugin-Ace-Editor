<!--suppress HtmlDeprecatedAttribute, HttpUrlsUsage -->

<div align="center">
  <p>
    <picture>
      <source srcset="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap-night/ic_launcher.png?raw=true" media="(prefers-color-scheme: dark)" />
      <img src="https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/app/src/main/res/mipmap/ic_launcher.png?raw=true" alt="autojs6-plugin-ace-editor-ic-launcher" border="0" width="128" />
    </picture>
  </p>

  <p>محرر أكواد Ace مضمن مع خدمات لغوية</p>

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
- يستخدم عقد Editor API 5 ويتطلب AutoJs6 بالإصدار 5276 أو أحدث و Android API 24 أو أحدث.
- يدعم تحرير النص والتراجع/الإعادة والبحث والاستبدال والبحث بالتعبيرات النمطية والكلمات الكاملة والتنقل بالمؤشر والتحديد وعمليات الأسطر ونقاط التوقف وتبديل التعليقات وتنسيق الأكواد.
- يتضمن خدمات لغات JavaScript/TypeScript وتصريحات الأنواع الخاصة بـ AutoJs6, مع الإكمال وhover وdiagnostics وsignature help. ويوفر syntax diagnostics فقط لملفات JSON.
- يضيف تحليلا دلاليا مضمنا لـ Python 3.12 عبر WebWorker من Pyright 1.1.413 ينشأ عند الحاجة: إكمال مدرك للأنواع وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف؛ وتبقى WebView القديمة غير المتوافقة على P2 بصمت.
- يضيف دلالات Lua تعمل بالكامل دون اتصال عبر عملية مرافقة على الجهاز من LuaLS 3.18.2: الإكمال وhover ومساعدة التوقيع والتشخيص والانتقال إلى التعريف مفعلة افتراضيا على arm64-v8a وarmeabi-v7a وx86_64؛ وتحتفظ معماريات ABI غير المدعومة وأعطال التشغيل بـ P2 بصمت.
- يدعم الحفاظ على CRLF ومزامنة النص التزايدية والتحميل المجزأ للنصوص الكبيرة ووضعا خفيفا للأسطر الطويلة جدا وتكييف IME ومراقبة سلامة بيئة التشغيل وإشعارات الرجوع إلى محرر المضيف الأصلي.
- يوفر السمات وإعدادات العرض, بالإضافة إلى إدارة الخطوط مع التحقق من الكتالوج الموقع رقميا والتحقق من SHA-256/WOFF2 والتنزيل والتخزين المؤقت والتثبيت والإزالة.
- تمت ترجمة بيانات المكون الإضافي ومحتوى README وCHANGELOG إلى الإسبانية والفرنسية والروسية والعربية واليابانية والكورية والإنجليزية والصينية المبسطة والصينية التقليدية في هونغ كونغ والصينية التقليدية في تايوان.
- اختر APK المناسب لمعمارية جهازك أو استخدم universal. يتوفر التحليل الدلالي للغة Lua على arm64-v8a و armeabi-v7a و x86_64; يحتفظ x86 بالمحرر والإكمال الثابت.

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
| Java | نعم | نعم | نعم | نعم | تشخيص ملف واحد |
| Kotlin | نعم | نعم | نعم | P2+ | لا |

يستخدم TSX وضع TypeScript في Ace 1.4.12 ولذلك يكون تمييز وسوم JSX جزئيا. تستخدم Python افتراضيا Worker من Pyright 1.1.413 يعمل بالكامل دون اتصال مع stubs مكتبة Python 3.12 القياسية، وتعود بصمت إلى P2 عند عدم توافق WebView قديمة أو فشل runtime. تستخدم Lua افتراضيا عملية مرافقة تعمل دون اتصال من LuaLS 3.18.2 على arm64-v8a وarmeabi-v7a وx86_64، وتعود بصمت إلى P2 عندما يكون runtime الأصلي غير متاح أو يفشل. تجمع Java بين إكمال P2 المعزول للمكتبة القياسية والمستند الحالي وتشخيص ECJ لملف واحد. توفر Kotlin إكمال P2+ من دون Provider دلالي.

تعرض إعدادات محرر الشفرة في AutoJs6 مصفوفة الأوضاع التسعة نفسها. يتحكم مفتاح LSP العام في كل الخدمات الدلالية، مع مفاتيح مستقلة لـ TypeScript/JavaScript وPython وLua وJava; تبقى Kotlin ظاهرة لكنها غير متاحة. تفحص قائمة أنواع الملفات أولا: إزالة لاحقة معروفة تعطل دلالتها، بينما إضافة لاحقة مخصصة تسمح للملف بدخول مسار LSP فقط ولا تعيد تصنيفه كلغة أخرى ولا تنشئ Provider دلاليا.

******

### البناء

******

استخدم Gradle Wrapper المرفق مع JDK 17 أو أحدث وAndroid SDK 37:

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
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.12.0-universal.apk
```

ثم فعل `ace-editor` في مركز المكونات الإضافية في AutoJs6, واخرج من AutoJs6 بالكامل ثم أعد تشغيله. أعد تشغيل المضيف بعد تثبيت المكون الإضافي أو تحديثه أو الرجوع إلى إصدار سابق منه.

يجب أن تستخدم عمليات التثبيت في بيئة الإنتاج توقيعا يثق به AutoJs6. ترث شيفرة المكون الإضافي التي تعمل داخل العملية أذونات عملية المضيف, لذلك لا تثبت ملفات APK من مصادر مجهولة أو غير مدققة.

******

### سجل الإصدارات

******

# v1.12.0

###### 2026/09/21

* `تحسين` تحديث إعلانات AutoJs6 المدمجة إلى `4.19.0`: إضافة الكائنين العامين `epub` / `$epub` ومساحة الأسماء `Internal.Epub` لإضافة Readium EPUB Reader (فتح الكتب والطبقة المريحة بالشكلين المتزامن و `Async`, أعضاء `Book` للبيانات الوصفية وجدول المحتويات وترتيب القراءة واستخراج النص وتصدير الغلاف والموارد والبحث, أحداث `ReaderSession` وأساليب التحكم, تفضيلات القراءة, كائن الموضع, مستندات النتائج ورموز الأخطاء), فأصبح إكمال المحرر وفحص الأنواع يشملان واجهة EPUB
* `تحسين` إعادة توليد فهارس الإكمال في المحرر `autojs6_indices.js` والإعلان المجمع `lib.autojs6.d.ts` بواسطة `tools/ace-completion` في المضيف من الإعلانات المدمجة `4.19.0`: إكمال ومساعدة توقيعات لوحدة `epub`; نجاح سكربتات التحقق الأربعة واختبار المكمل جميعا

# v1.11.0

###### 2026/09/20

* `تحسين` تحديث إعلانات AutoJs6 المدمجة إلى `4.18.0`: إضافة الكائنين العامين `mail` / `$mail` ومساحة الأسماء `Internal.Mail` لإضافة Angus Mail (أساليب العميل والأساليب المحوّلة بالشكلين المتزامن و `Async`, أحداث المراقبة, كائنات الرسالة / المرفق / العنوان, خيارات الحساب وإعدادات مزودي الخدمة المسبقة, شروط البحث, مستندات النتائج ورموز الأخطاء), فأصبح إكمال المحرر وفحص الأنواع يشملان واجهة البريد
* `تحسين` إعادة توليد فهارس الإكمال في المحرر `autojs6_indices.js` والإعلان المجمع `lib.autojs6.d.ts` بواسطة `tools/ace-completion` في المضيف من الإعلانات المدمجة `4.18.0`: إكمال ومساعدة توقيعات لوحدات `mail` و `ai` و `tts` و `flow` و `pangu` و `settings` و `yolo` و `powerManager` و `workManager`, وإعادة فهرس الإعلانات `index.d.ts` و `BUNDLED_DECLARATIONS.md` إلى الشكل الذي ينتجه سكربت الاستيراد; نجاح سكربتات التحقق الأربعة واختبار المكمل جميعا

# v1.10.0

###### 2026/09/19

* `إصلاح` تحذيرات قراءة SDK XML v4 مع AGP 9.1 وتشغيل فحص محاذاة مكتبات APK الأصلية خطأ عند تجميع اختبارات JVM, باستخدام إضافات البناء المشتركة 1.8.3
* `تحسين` تحديث إعلانات AutoJs6 المدمجة إلى `4.17.0`: وكلاء السجل Level / LogConfigurator / LogManager يشيرون الآن إلى فئات `org.autojs.autojs.core.console.log` المدمجة, وإعلانات المكتبات لم تعد تتضمن المكتبات التي أزيلت من المضيف (log4j و Flexmark و JavaMail و JUnit و github-api و Jackson و commons-io / lang3 و kotlin-reflect و SpongyCastle و media3 و Guava)

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


[16 KB page alignment and build verification](https://github.com/SuperMonster003/AutoJs6-Plugin-Ace-Editor/blob/master/docs/16kb.md)
