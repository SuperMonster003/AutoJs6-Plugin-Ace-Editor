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
- يدعم الحفاظ على CRLF ومزامنة النص التزايدية والتحميل المجزأ للنصوص الكبيرة ووضعا خفيفا للأسطر الطويلة جدا وتكييف IME ومراقبة سلامة بيئة التشغيل وإشعارات الرجوع إلى محرر المضيف الأصلي.
- يوفر السمات وإعدادات العرض, بالإضافة إلى إدارة الخطوط مع التحقق من الكتالوج الموقع رقميا والتحقق من SHA-256/WOFF2 والتنزيل والتخزين المؤقت والتثبيت والإزالة.
- تمت ترجمة بيانات المكون الإضافي ومحتوى README وCHANGELOG إلى الإسبانية والفرنسية والروسية والعربية واليابانية والكورية والإنجليزية والصينية المبسطة والصينية التقليدية في هونغ كونغ والصينية التقليدية في تايوان.

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

******

### التثبيت

******

ثبت ملف APK الناتج بعد البناء:

```powershell
adb install -r .\app\build\outputs\apk\debug\autojs6-plugin-ace-editor-v1.1.14-universal.apk
```

ثم فعل `ace-editor` في مركز المكونات الإضافية في AutoJs6, واخرج من AutoJs6 بالكامل ثم أعد تشغيله. أعد تشغيل المضيف بعد تثبيت المكون الإضافي أو تحديثه أو الرجوع إلى إصدار سابق منه.

يجب أن تستخدم عمليات التثبيت في بيئة الإنتاج توقيعا يثق به AutoJs6. ترث شيفرة المكون الإضافي التي تعمل داخل العملية أذونات عملية المضيف, لذلك لا تثبت ملفات APK من مصادر مجهولة أو غير مدققة.

******

### سجل الإصدارات

******

# v1.1.14

###### 2026/08/29

* `ميزة` أضيفت إعادة تسمية رموز TypeScript على مستوى المشروع عبر F2 وإجراء الهاتف `إعادة تسمية`: يستخرج Ace تعديلات محدودة بين الملفات من لقطة المشروع الدقيقة, ويطلب تفويض contract 5 من AutoJs6, ويترك المعاينة وفحص التعارض والنشر الذري والتراجع وكل عمليات الكتابة على القرص بالكامل لـ Host
* `ميزة` أضيفت إصلاحات TypeScript السريعة للاستيراد التلقائي وتصحيح الإملاء عبر Ctrl/Command+. وإجراء الهاتف `إصلاح سريع`: يقصر Ace الإصلاحات على تعديلات مرتبة في المخزن النشط, ويطلب تفويض contract 4 من AutoJs6 6.8.0 (5276), ويطبق النتيجة المعتمدة كتغيير واحد قابل للتراجع
* `ميزة` يغطي ذكاء TypeScript بين الملفات الآن الإكمال وhover ومساعدة التوقيع والتنقل إلى التعريف عبر مصادر المشروع وتصريحات التبعيات المجمدة; ترسل F12 وCtrl/Command-click وإجراء الهاتف `الانتقال إلى التعريف` أهداف contract 3 يتحقق منها AutoJs6 6.8.0 (5276) بشكل مستقل قبل الفتح وتحديد الموضع
* `ميزة` أضيفت تشخيصات مشاريع TypeScript المدعومة من المضيف: يتحقق Ace الآن من لقطة المصدر المحدودة والكاملة ويحملها، ويحل الاستيرادات بين ملفات المشروع، ويبرز الوحدات المفقودة بما يطابق فحص ما قبل التشغيل؛ يتطلب AutoJs6 6.8.0 (5276) أو أحدث
* `ميزة` تكتشف طبقات أنواع مشاريع TypeScript الآن إشارات الإضافات الأصلية وخطافات دورة حياة التثبيت قبل متابعة التحرير, وتنشر نفس خطأ حدود التبعيات المستقر وإرشادات JavaScript الخالصة/WASM التي ينشرها المضيف والcompiler
* `ميزة` وُحّدت مرجعية أنواع التبعيات في Ace مع سياسة resolver بالمراجعة 3، وأضيفت تغطية lodash 4.17.21 مع `@types/lodash` 4.17.25 للحفاظ على تشخيصات متطابقة بين Rhino وNode عندما لا تتضمن حزم وقت التشغيل تصريحات مدمجة
* `ميزة` تمت اضافة frozen project dependency type layer مشتركة مع TypeScript compiler: يحل Ace الان package `types`/`typings` وTypeScript 6 `typesVersions` وnested declarations و`@types` المثبتة مع تطابق dayjs completion وhover وstrict diagnostics في Rhino وNode
* `ميزة` تضمين تعريفات R8 الخاصة بـ AutoJs6 `4.2.0` ومجموعات LSP المولدة: تضيف التحميلات الستة لـ `ScriptRuntime.loadJarWithR8` تصدير mapping/seeds/usage/retrace metadata بعد التحقق, بينما ينفذ `retraceR8Stack` استعادة المكدس المرتبطة بالمصدر عبر البروتوكول 1.1 مع فشل مغلق عند تعذر اختيار Provider

# v1.1.13

###### 2026/08/26

* `ميزة` تضمين تعريفات AI النهائية الخاصة بالإضافة فقط في AutoJs6 `4.1.0`: عند حذف المحدد يستخدم الهدف الافتراضي لإضافة 3-Stone AI الرسمية, ولا تقبل الطلبات سوى توجيه `target` عبر الإضافة و`timeout` القياسي, مع إزالة أنواع الاتصال المباشر وبيانات الاعتماد والأحداث الانتقالية من المضيف

# v1.1.12

###### 2026/08/26

* `ميزة` تضمين تعريفات أهداف الذكاء الاصطناعي الموحدة في AutoJs6: ‏`ai.catalog` والتوجيه الدقيق عبر `target` والأهداف المحلية والمتصلة وبيانات الاستجابة والجلسة الكاملة ومخرجات الاستدلال والأخطاء الثابتة من دون رجوع؛ مع إزالة جميع واجهات وأسماء كتالوج الذكاء الاصطناعي القديمة غير المنشورة

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
