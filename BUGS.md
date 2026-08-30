# تقرير فحص الأخطاء العميق — منصة ميني جي للروبوتكس

**التاريخ:** 2026-08-30 (الجولة الثانية: تحقق ميداني من الادعاءات + مسح أنماط + مراجعة كاملة لملفات الـ 3D والمكونات الكبيرة) — **أتومات الإصلاحات اكتمل بنهاية الجلسة: آخِر إصلاح Wave 3 (فريم وير + M9).**
**المنهج:** مراجعة منطقية يدوية + فحص TypeScript/تحقيق البناء + مراجعة متوازية لكل المكونات الـ 28 + تحقق مباشر من كل ادعاء.
**النتيجة:** البناء ينجح (tsc / vite) بدون أخطاء؛ `strict: false` لذلك لا يمسك سوى الأخطاء المنطقية والسلوكية: **4 حرجة ، 14 متوسطة ، 13 منخفضة** (جميع HIGH وكل MEDIUM ما عدا M9 المكتمل، و MULTI منها مُصلحة — التفاصيل في أقسامها). **بعد الموجة الأخيرة: لا توجد بنود متبقية (كل LOW#1..13 معالجة أو مدمجة).**

---

## 🔴 حرجة (HIGH)

### H1. بيانات النصوص (String) لا تُنقل أبداً عبر BLE
- **الملف:** `src/ble/BLEManager.ts:131-145`
- شرط `if (Array.isArray(data))` فقط يبني الحزمة ويرسلها، ومع ذلك التعليق (سطر 127) يدّعي قبول الـ hex string. تمرير نص (مثل اللون `'#ef4444'` أو جملة الكلام) يتخطى البناء ويصل `updateVirtualState` فقط.
- **المتضررون:**
  - `src/components/DirectControlPanel.tsx:17` — اختيار لون ليدات Mini G-F (`setGFColor(hex)`) لا يغيّر الـ LED الحقيقي إطلاقاً، المحاكي فقط يتغير.
  - `src/components/VoiceCommanderModal.tsx:90` و `src/components/AIPersonaChatModal.tsx` — نص `G_SPEAK_PHRASE` لا يدخل أي حزمة؛ الروبوت الحقيقي لا يتكلم.
- **العلاج:** إما ترميز النص UTF-8 داخل البيانات وفكّه في الفريم وير، أو تحويل الـ hex إلى `[r,g,b]` قبل `sendCommand`.

### H2. حقن كود JavaScript عبر نص سلة المحادثة (Blocks)
- **الملف:** `src/blockly/generators/liveGenerator.ts:82-85`
- `g_ai_speak` يقحم نص الطفل مباشرة داخل مصدر JS (`"${text}"`) بدون escape، ثم يُنفَّذ عبر `new Function` في `BlocklyWorkspace.tsx:170`. نص يحوي `"` (مثل «قال "مرحبا"») يكسر المُولَّد (خطأ Syntax)، وأي نص خبيث ينفّذ تعليمات عشوائية داخل التطبيق.
- **المتأثر أيضاً:** `gf_set_color` (سطر 21) بنفس النمط.
- **العلاج:** `JSON.stringify(text)` أو escape آمن قبل الإقحام.
- ✅ **مُصلَح (2026-08-30):** `g_ai_speak` و`gf_set_color` في `liveGenerator.ts` يستخدمان الآن `JSON.stringify(...)`. تحقق يدوي: النص المُقحَم (بما فيه `"`، شرطات `+`، backtick، `${}`) يقع داخل سلسلة مقتبسة بعلامات تنصيص ولا يكسر `new Function` في `BlocklyWorkspace.tsx:170`. سطوح الحقن الوحيدة المتبقية هي الحقول النصية التي يكتبها المستخدم نفسه (نص كلام/اسم)، وهي ميزة تنفيذ التعليمات البرمجية مقصودة أصلاً.

### H3. وظائف "أمان/منافذ" وهمية لا تفعل شيئاً
- **الملفات:** `src/components/SafetyGuardModal.tsx:6-9, 46-107` و `src/components/PinoutConfigModal.tsx:26-43`
- أزرار «حفظ وتأمين الفصل» و«تحديث وتطبيق المنافذ على الفريم وير» تكتب في state محلي فقط وتُظهر علم نجاح لمدة ثانيتين. لا يوجد أي استهلاك فعلي لإعدادات الأمان (حظر BLE، حد الصوت، تقييد التصدير) ولا للـ pins المخصصة — الفريم وير المُصدَّر في `CodeExportModal.tsx` يبقى `PIN_HAPTIC 4` إلخ مهما غيّر المستخدم.
- **الخطورة:** وهم أمان خطير (معلم يظن الحماية مفعلة وهي غير مفعلة).

### H4. أخطاء تشفير التردد الصوتي (يُضاعف ×10 على غير هدى / يُبتَر بايت)
- **الملفات:** `src/components/DirectControlPanel.tsx:34-36` ، `src/blockly/generators/liveGenerator.ts:46-49` ، `src/firmware/mini_gm_esp32.ino:37-39`
- لوحة التحكم ترسل `playGMTone(587, 3)` → `buildPacket` يعمل `data[i] & 0xFF` في `Protocol.ts:60` فيصبح التردد **75** بدل 587 (التردد >255 يُبتَر). والمولّد البلوكلي يرسل `523` بنفس الطريقة.
- الفريم وير يحسب `freq = data[0] * 10` (يفترض إرسال التردد مقسوماً على 10)، بينما `MelodyComposerModal.tsx:55` هو الوحيد الذي يقسم بشكل صحيح (`freq/10`). النتيجة: 3 مصادر مختلفة التناسق، والمحاكي (يستخدم `data[0]` خام) يعزف تردداً مختلفاً عن الجهاز الحقيقي.
- **العلاج:** توحيد المقياس: القسمة على 10 قبل الإرسال في جميعها، أو نقل التردد في 2 بايت.

---

## 🟠 متوسطة (MEDIUM)

### M1. إيقاف المايك لا يوقف التعرف الصوتي
- **الملف:** `src/components/VoiceCommanderModal.tsx:23-26, 28-54`
- زر الإيقاف يكتفي بـ `setIsListening(false)` دون `recognition.stop()`، و`recognition` متغير محلي. الجلسة تبقى حيّة فتنفّذ أوامر BLE بعد إظهار "المتوقف"؛ وإعادة التشغيل قد ترمي `InvalidStateError` على `start()`.

### M2. كاميرا الويب لا تُغلق عند فك التركيب + "نشطة" كاذبة عند الفشل
- **الملف:** `src/components/KidVisionAIStudioModal.tsx:37-57`
- لا يوجد cleanup للـ stream عند unmount (تبديل تبويب) فيظل الضوء مضاءً والكاميرا محتجزة. وعند رفض إذن الكاميرا (سطر 55) يُفعّل `isCameraActive(true)` بلا stream — شاشة سوداء تُعرض كأنها بث حي.

### M3. ✅ «إرسال للشاشة اللحظية» كان يرسل قيمة ثابتة [99] متجاهلاً الرسم
- **الملف:** `src/components/PixelFaceDesignerModal.tsx:86-90`
- كان يُرسل `GM_SET_EXPRESSION, [99]` مهما كانت بلاطات الـ 8×8 المرسومة. وفي `BLEManager.ts:176` الفهرس 99 خارج مصفوفة المشاعر فيُعرض وجه «سعيد» دائماً.
- **مُصلَح:** `handleSendToRobot` يرمز الصفوف الثمانية إلى 8 بايتات (MSB = أقصى يسار، نفس ترميز `generateHexBytes`) ويرسلها؛ `BLEManager` يعتبر أي payload بطول ≥8 وجهاً مخصّصاً (`gm_expression:'custom'` + `gm_customFace`)، و`drawExpressionEyes` في `RobotSimulator.tsx` يرسم شبكة 8×8 الحقيقية على الشاشة.

### M4. ✅ أداة الفلاش: آثار جانبية داخل `setProgress` + مؤقتات لا تُلغى
- **الملف:** `src/components/ESP32WebFlasherModal.tsx:33-51, 55-58`
- كان داخل دالة الـ updater النقية يتم `setFlashingState` و`setLogs` و`setTimeout` (في StrictMode تُنفَّذ مرتين → سجلات وصوتان). و`handleResetFlasher` كان يصفّر الحالة دون `clearInterval/clearTimeout` فيكمل المؤقت بعد إعادة التعيين ويرفع 100% رغماً عن المستخدم، ويستمر بعد unmount.
- **مُصلَح:** مؤقتات مفهومة في `timersRef`، التقدم يُتتبع بمتغير عادي في الإغلاق (side-effects خارجة عن الـ updater)، `handleResetFlasher` يمسح المؤقتين، وuseEffect عند ununmount ينظّف، مع guard يمنع بدء جلسة أثناء جارية.

### M5. ✅ واجهة Web Serial: الكتابة بلا try/catch وقفل قارئ غير محرر
- **الملف:** `src/components/WebSerialConsole.tsx:64-80, 33-51, 53-62`
- كان `writer.write` بلا try/catch؛ الفشل يترك الـ lock مقفلاً فتُرفض كل الكتابات اللاحقة. و`disconnectSerial` كان يستدعي `port.close()` بينما `readable` مقفول بواسطة حلقة القراءة → استثناء يُبلع بصمت فلا يُغلق المنفذ نظيفاً.
- **مُصلَح:** `sendCommand` يكتب داخل try/catch/finally مع تحرير الـ lock؛ الفصل يلغي القارئ أولاً (`readerRef.cancel()`) ثم يغلق المنفذ try/catch؛ حلقة القراءة تخرج عبر علامة `disconnectedRef`؛ cleanup عند unmount.

### M6. قطع BLE مُستدعًى مرتين + مستمعات تتكدس
- **الملف:** `src/ble/BLEManager.ts:114-125` و `:94`
- `disconnect()` يستدعي `gatt.disconnect()` (يطلق الحدث → `handleDisconnect`) ثم يستدعي `handleDisconnect()` ثانية — إشعار مكرر لكل المشتركين. وكل `connect()` يضيف `addEventListener` جديداً دون إزالة القديم (تسريب).

### M7. فشل اتصال BLE الحقيقي يُعرض كنجاح + مرجع جهاز قديم
- **الملف:** `src/ble/BLEManager.ts:81-111`
- فشل `gatt.connect`/`getPrimaryService`/`getCharacteristic` يقع في `catch` فيُعامل مثل إلغاء المستخدم: `virtualMode=true` و`notifyConnectionListeners(true,...)` و `return true`. المستخدم يظن الروبوت متصلاً (هو محاكاة فقط)، ويبقى `this.device` القديم مكلفاً وقد يمسح مرجع جلسة لاحقة عند `handleDisconnect`.

### M8. ✅ اهتزاز/نغمات: مؤقتات متداخلة لا تُلغى + مدة غير متسقة (×10)
- **الملف:** `src/ble/BLEManager.ts:168-172, 186-191` ، `src/firmware/mini_gf_esp32.ino:35-39`
- `setTimeout` للإنهاء بلا حفظ مرجع — ضغطا اهتزاز متتاليان يقصران المدة (يفوز المؤقت الأقدم). والفريم وير يحسب مدة الهزاز `data[0]*10` بينما المحاكي يعاملها كمللي ثانية: بلوك «نبضات 200» = 200ms افتراضياً و **2000ms** على الجهاز.
- **مُصلَح (المتبقي):** الفريم وير (`.ino`) لم يعد يضرب ×10 — يأخذ مدة الاهتزاز بالمللي ثانية مباشرة مطابقاً للويب والمحاكي (الجانب الويبي من M8 أُصلح ضمن H4).

### M9. ✅ ميزات وهمية/إعلانات كاذبة (واجهة عرض عالمية) — أُصلحت كلها في 2026-08-30
| المكوّن | الحل المنفَّذ |
|---|---|
| `AICodeReviewerModal.tsx` | تحليل حقيقي لكود الطالب الفعلي (`javascriptGenerator.workspaceToCode` يُخزَّن في `window.__LAST_STUDENT_CODE__` عند «تشغيل»): عدّ الأوامر/الحلقات/الشروط/فترات الانتظار → درجة ديناميكية حقيقية + نصائح مبنية على الفجوات الفعلية. مؤقّت مُدار بمُهيل ref + حارس unmount. |
| `TroubleshootingAssistantModal.tsx` | «فحص الاتصال الذاتي» يستدعي `bleService.isConnected()` فعلاً ويعرض نتيجة الحالة (متصل/محاكاة) مع موجز بصري؛ `selectedIssue` يُعاد ضبطه عند تغيير `model`. |
| `CommunityShowcaseModal.tsx` | «انشر مشروعي» يفتح نموذجاً حقيقياً (عنوان/مؤلف/وصف/روبوت) يُضيف المشروع فعلاً لأعلى الشبكة؛ زر «التجربة ▶» ينفّذ سكربت تجريبي حقيقي عبر `sendCommand` على حسب موديل المشروع (أضواء/هزاز/عيون/لحن/حركة/كلام) بدل `alert`. |
| `ActionSequenceRecorder.tsx` | زرّا «تسجيل/إيقاف» حقيقيان: أثناء التسجيل تُغلَّف `window.__BLE_DISPATCH__` فيُلتقط كل أمر يشغّله الطالب من البلوكات (مع فترات زمنية محسوبة) في السيناريو؛ يُعاد ترميز `#hex`→RGB، مع استعادة آمنة عند الإيقاف/التركيب. |
| `Chassis3DStudioModal.tsx` | التصدير يولّد ASCII-STL حقيقياً (مكعب/أسطوانة + هوائيات مزدوجة/وحيدة/رادار + عجلات بقطر `wheelSize`) يعكس كل التخصيصات؛ منزلق عجلات فعلي (30–70mm)؛ `revokeObjectURL` مؤجَّل 3s مع إرفاق الرابط بالـ DOM؛ المؤقّت مُدار. |
| `AIPersonaChatModal.tsx` | تغيير الشخصية يعيد ضبط الحوار بترحيب الشخصية الجديدة (useEffect على `activePersona`). |
| `CostumeCustomizerModal.tsx` | لون الجلد يُطبَّق فعلاً على التوأم الرقمي في `RobotSimulator` (تظليل الرأس) ويُحفظ في localStorage (`bleService.setCostumeSkin`, `costumeSkinColor` في `RobotState`، يُحمَّل عند الإقلاع)؛ الـ confetti فقط عند لبس عنصر مفتوح؛ النقر على مقفل يعرض تنبيهاً بدل أن يُفعِّل خلسة. |

### M10. التعرف على الأوامر العربية يفشل مع التشكيل
- **الملف:** `src/components/VoiceCommanderModal.tsx:82, 88-89`
- `includes('لوح')` لا يطابق «لوّح» (الشدة حرف مستقل)، و`includes('أمام')` لا يطابق «امام» بدون همزة — الأوامر المعلَنة تسقط للوجه الأساس.

### M11. مزج نغمتين متعارضتين في «استوديو اللحن» + تسريب AudioContext
- **الملف:** `src/components/MelodyComposerModal.tsx:39-58`
- `playToneLive` يلحق `new AudioContext` عند كل نغمة و**لا يستدعي `ctx.close()`** أبداً (تسريب موارد مع كل ضغطة/تشغيل). وفوق ذلك يُنشئ `new AudioContext()` في كل استدعاء بدل إعادة تسخين كائن واحد.
- **التعارض:** النغمة المحلية تعزف التردد الصحيح (`note.freq`) بينما `bleService.sendCommand(GM_PLAY_TONE, [freq/10, 3])` يدفع `BLEManager.ts:186` ليعزف نفس الأمر على **`data[0]` الخام (26Hz لـ C4)** → المستخدم يسمع نغمتين مختلفتين في آنٍ واحد (والمحاكي نفسه يوافق على الترددات الواطئة غير الموسيقية).
- **العلاج:** مصدر صوتي واحد (إما محلي أو عبر BLE، ليس الاثنين)، و`ctx.close()` في كل مرة، أو مثيل `AudioContext` وحيد مشترك.

---

## 🟡 منخفضة (LOW)

1. **`Header.tsx:30-40`** — `isFullscreen` متفائل بلا الاستماع لحدث `fullscreenchange`؛ رفض الملء أو الخروج بـ Esc يترك الأيقونة خاطئة.
   - ✅ **مُصلَح (2026-08-30):** `toggleFullscreen` لم يعد يضبط الحالة بنفسه؛ `useEffect` يستمع إلى `fullscreenchange` (يُرادف `document.fullscreenElement`) مع cleanup — خروج Esc/رفض الطلب تعكس الحالة الحقيقية.
2. **`CodeExportModal.tsx:101-105, 117`** — `navigator.clipboard` بلا فحص دعم/`catch` فيُتوهَّم النجاح؛ `revokeObjectURL` فوري بعد `click()`.
   - ✅ **مُصلَح (2026-08-30):** `copyTextToClipboard` يتحقق من `navigator.clipboard` + `window.isSecureContext` داخل try/catch، مع fallback عبر `document.execCommand('copy')` (textarea مؤقت)؛ `setCopied` فقط عند نجاح حقيقي. والتحميل يُرفق الرابط بالـ DOM ويؤجّل `revokeObjectURL` إلى 2500ms (بدل فوري/1000ms).
3. **`Protocol.ts:67-74`** — `hexToRgb` لا تتحقق من المدخلات؛ سلسلة غير hex تُرجع NaN وتُرسل 0.
   - ✅ **مُصلَح (2026-08-30):** تجاهل `#`، توسيع 3-و4-أرقام مختصرة، والتحقق بـ `/^[0-9a-fA-F]{6}$/`؛ أي قيمة غير صالحة تُرفض (تحذير + `[0,0,0]`) بدل NaN.
4. **`mini_gf_esp32.ino:16, 104`** — ESP32-C3 لا يملك طرفية Capacitive Touch، `touchRead(PIN_TOUCH_SENSOR)` على `PIN 2` سيفشل؛ و`delay()` الاستباقية في `onWrite`/`loop` تجمّد الـ BLE.
   - ✅ **مُصلَح (2026-08-30):** الفريم وير يدعم الآن `-DUSE_TOUCH_SENSOR=0` للوحات C3 عبر زر (active LOW مع `INPUT_PULLUP`) بدل `touchRead`، مع توقيع نوع اللوحة في التعليقات. (بقي النهي: `delay()` الكتلية داخل `onWrite` لا تزال قائمة — عيوب حقيقية للجهاز لكنها خارج نطاق الويب.)
5. **`mini_g_esp32.ino:47-50`** — `G_SPEAK_PHRASE` لا يقرأ النص أصلاً (فقط print)، و`G_STOP_ALL (0x35)` غير معالج → التوقف لا يُرسل للعجلات.
   - ✅ **مُصلَح (2026-08-30):** `0x34` ينسخ نص الجملة (UTF-8، حتى 127 بايت) ويطبعه/مصححاً لكود التوليف، و`0x35` يُوقف الأذرع فعلياً (`armLeft/Right.write(0)`) مع سطر لإيقاف العجلات.
6. **`mini_gm_esp32.ino:21-42`** — الـ firmware بلا معالجة لـ `GM_PLAY_TONE` للمدة المناسبة و`GM_TRIGGER` للنغمات كاملة.
   - ✅ **مُصلَح (2026-08-30):** `0x22` يعزف `freq = data[0]*10` (المقياس الموحّد ÷10) بمدة `data[1]*100`ms مع حصر أقصاها 5 ثوانٍ؛ `data[1]==0` أو `freq==0` يستدعي `noTone()` (إيقاف صريح) بدل النغمة الجزئية.
7. **`vite.config.ts:20-30` + `public/`** — المانيفست يشير إلى `pwa-192x192.png`/`pwa-512x512.png` غير موجودتين (يوجد `robot-icon.svg` فقط) → أيقونة PWA مكسورة (404)؛ و`includeAssets` يذكر ملفات `icons/*.png`, `favicon.ico`, `robots.txt` غير موجودة.
   - ✅ **مُصلَح (2026-08-30):** وُلّدت `public/pwa-192x192.png` و`public/pwa-512x512.png` من `robot-icon.svg` عبر `rsvg-convert`؛ `includeAssets` الأيقونات الثلاث فقط؛ الـ precache صار 10 إدخالات؛ البناء نجح.
8. **`BlocklyWorkspace.tsx:139-146`** — `setTimeout` لـ `svgResize(workspaceRef.current!)` بعد التفكيك قد يلامس null إذا غُيّر الموديل خلال 150ms.
   - ✅ **مُصلَح (2026-08-30):** المؤقّت يُحفظ ويُلغى في cleanup، وعند الاستدعاء يتحقق أن `workspaceRef.current === ws` (نفس المساحة الحيّة) قبل `svgResize` — لا لمس null بعد unmount.
9. **`simulator3d/Robot3DScene.tsx:42`** — `Environment preset="apartment"` يُحَمَّل من CDN بعيد (drei/pmndrs market) وقت الرسم → في معمل بلا إنترنت يظل `Suspense` معلقاً/يتأخر الـ 3D بلا خلفية (تبعية شبكة وقت التشغيل).
   - ✅ **مُصلَح (2026-08-30):** استُبدل بـ `Environment resolution={256} frames={1}` من `Lightformer` يسبّك استوديو إضاءة إجرائي (ألواح إضاءة + ring ملوّنة) — إنعكاسات/إضاءة محلية 100% بلا أي طلب CDN، ويُحسَب مرة واحدة.
10. **`simulator3d/ScreenFaceMesh.tsx`** — `CanvasTexture` يُنشأ في `useMemo` ولا يُستدعى `texture.dispose()` عند الفك → تسريب GPU مع كل فتح/إغلاق للمحاكي 3D. (أيضاً `ScreenFace.tsx:5` متغير `ctx` عمومي على مستوى الوحدة — تجميلي.)
    - ✅ **مُصلَح (2026-08-30):** `useEffect` يعيد `texture.dispose()` عند unmount. وفي `ScreenFace.tsx` حُذف المتغير العمومي `ctx` — كل دوال الرسم تستقبل السياق كمعامل (`drawClosed/drawHappyArc/drawWink/drawRound/drawHeart` + `ctx` محلي في `drawFace`)، فلم يعد لأي مثيل من الوجوه مساس بسياق الآخر.
11. **`MelodyComposerModal.tsx:41-42`** — `new AudioContext` لكل نغمة بلا `close()` (راجع M11)، ويُعلن عن 3 مصادر تكرار نغمة غير موحدة.
12. **`SchoolLMSView.tsx:373-376, 416-419`** — زرا «عرض الكود» و«تفعيل» بلا أي `onClick` (ميتان)؛ والسطران `150` و`342` إحصاءات ثابتة متناقضة (18 وحدة BLE / 16 محطة مقابل 6 طلاب معروضين).
13. **`LiveSensorTelemetry.tsx:16-27, 39`** — مكتوب «LIVE STREAM» لكن كما يعلن التعليق «للعرض فقط»: كل القيم عشوائية، ولا تُقرأ `state` المُمررة إطلاقاً — «القراءات الحية» مضللة + `history.slice(-15)` يُبطأ خلال الساعة الأولى لا غير (لا تأثير).
    - ✅ **مُصلَح (2026-08-30):** كل قراءة مشتقة الآن من `state` الحقيقي: جهد البطارية من `state.batteryLevel` (3.3–4.2V)، `RSSI` من `state.rssi`، وحرارة المعالج من نشاط حقيقي، و`history` = مؤشر نشاط محسوب من حركة العجلات/الأذرع/الكلام/الاهتزاز/دوران الرأس (مع هامش مستشعر ±3 فقط لا عشوائية). الشارة تُظهر «قراءات المحاكاة 🔊» عند غياب اتصال BLE بدل الادعاء الخاطئ.

---

## 🔧 إصلاحات منفذة 2026-08-30 (بعد جولة التحقق الثانية)
- **H1 ✅** `BLEManager.sendCommand` يعيد تشكيل البيانات: `[r,g,b]` → تُرسَل رقمية؛ `#hex` → تُحوَّل إلى `[r,g,b]`؛ نصوص الكلام → UTF-8 bytes (`toPacketData`). الروبوت الحقيقي يتلقى اللون والكلام فعلاً، ونص الكلام يُقرأ في `mini_g_esp32.ino` (LOW#5 مُصلح).
- **H2 ✅** (سابقاً) + **H4 ✅** توحيد مقياس التردد: الإرسال ÷10 في `DirectControlPanel.tsx:35`، `liveGenerator.ts:46-49`، والمحاكي الافتراضي يضرب ×10 في `BLEManager.ts` (مطابقة مع `mini_gm_esp32.ino`)؛ `MelodyComposerModal` يبقى ÷10.
- **M1 ✅** `VoiceCommanderModal` — `recognition` يُحفظ في ref ويُوقَف فعلاً عند الضغط على الإيقاف، مع إزالة المرجع في onend/onerror/manual.
- **M2 ✅** `KidVisionAIStudioModal` — تتبّع الـ stream في ref وتوقيفه عند unmount وزر الإيقاف؛ رفض الكاميرا يعرض رسالة خطأ بدل «بث حي» كاذب.
- **M11 ✅** `MelodyComposerModal` — `AudioContext` وحيد مشترك + إفلات العقد عند الانتهاء؛ صراع النغمتين زال لصالح تطابق المحاكي مع الجهاز.
- **LOW#12 ✅** `SchoolLMSView` — زر «تفعيل» يفعّل الوحدة على الشعبة المختارة (مع صوت/toast)، زر «عرض الكود» يفتح عارض كود الطالب، عدّاد المحطات ديناميكي.
- **H3 ✅** وظائف الأمان والمنافذ أصبحت حقيقية عبر مخزنين جديدين:
  - `src/ble/SafetyManager.ts` — يُخزَّن في localStorage ويُستهلك في: `BLEManager.connect` (قيد BLE يسمح فقط بـ Mini-G عند تشغيل «حظر الأجهزة»)، `BLEManager.sendCommand` لـ `G_SPEAK_PHRASE` (فلتر كلمات غير لائقة → بديل ودود، يشمل كتلة Blockly `g_ai_speak` أيضاً)، `BLEManager.playSynthesizedTone` (سقف جهارة حسب `maxVolumeLimit`)، و`CodeExportModal` (بوابة تصدير التلاميذ).
  - `src/ble/PinoutManager.ts` — يُخزَّن لكل موديل ويُستهلك في `CodeExportModal` (الفريم وير المُصدَّر يعكس الآن أرقام المنافذ المخصّصة فعلاً).
  - واجهتا `SafetyGuardModal` و`PinoutConfigModal` تُحمِّلان القيم المحفوظة عند الفتح.
- **M6/M7 ✅** `BLEManager` — `handleDisconnect` أصبح دالة arrow ثابتة + فحص أجهزة قديمة (تجاهل أحداث الموديل السابق) + حارس فراغ يمنع الإشعار المزدوج؛ وفشل الاتصال الحقيقي (لا إلغاء المستخدم) يُبلَّغ الآن بأنه **غير متصل** بدل وهم «متصل» (يبقى المحاكي قابلاً للاستخدام).
- **M10 ✅** `VoiceCommanderModal` — تطبيع عربي (إزالة التشكيل والتمدّد، توحيد الهمزات/ألف/ياء/تاء مربوطة) قبل مطابقة الأوامر: «لوّح» و«امام» وما شابه تُطابَق الآن.
- **M3 ✅** `PixelFaceDesignerModal` — يُرسل وجه 8×8 المرسوم فعلاً (8 بايتات صفوف) بدل `[99]`؛ `BLEManager` يلتقطها كوجه مخصّص (`gm_customFace`) و`RobotSimulator.drawExpressionEyes` يرسم الشبكة الحقيقية.
- **M4 ✅** `ESP32WebFlasherModal` — مؤقتات في ref تُلغى عند إعادة الضبط/التركيب، التقدم غير معتمد على side-effects داخل `setProgress`، tanpa ازدواج السجلات/الأصوات.
- **M5 ✅** `WebSerialConsole` — كتابة آمنة try/catch مع تحرير الـ lock؛ فك الاتصال يلغي القارئ ثم يغلق المنفذ؛ cleanup عند unmount.
- **M8 ✅** `mini_gf_esp32.ino` — مدة الهزاز بالمللي ثانية مباشرة (إزالة ×10) مطابقة للويب.
- **M9 ✅** جميع البنود السبعة — أنظر جدول M9 أعلاه (محلل كود حقيقي + فحص اتصال حقيقي + نشر/تجربة حقيقيان + مسجل أوامر حقيقي + تصدير STL يعكس التخصيص + إعادة ضبط حوار الشخصية + لون جلد مطبَّق على التوأم).
- **LOW#4 ✅** / **LOW#5 ✅** — أنظر سطرَيْ الفريم وير أعلاه (لمس C3 قابل للتكوين + قراءة نص G_SPEAK_PHRASE وإيقاف G_STOP_ALL).
- **LOW#1،2،3،6،8،9،10،13 ✅ (الموجة الأخيرة)** — أنظر سطورها أعلاه: شارة ملء شاشة حقيقية، نسخ/تنزيل آمنان مع fallback وتأجيل revoke، `hexToRgb` مُتحقَّق، نغمة G-M بمدة/إيقاف صحيحة، مؤقّت `svgResize` آمن على unmount، إضاءة استوديو إجرائية بلا CDN، تحرير `CanvasTexture` + عزل `ctx`، وقراءات Telemetry من `state` الحقيقي لا العشوائية.

**غير مُصلَح:** **لا شيء** — اكتملت جميع بنود الـ 13 LOW (والموجات السابقة كلها).
**تحقق التجميع (2026-08-30):** arduino-cli 1.5.1 + نواة `esp32:esp32@3.3.11` + مكتبة `ESP32Servo@3.2.1` مثبتة، والملفات الثلاثة تُجمَّع بنجاح: `mini_gf_esp32` (ESP32) و(C3 مع `-DUSE_TOUCH_SENSOR=0`) ✅، `mini_g_esp32` (ESP32-S3) ✅، `mini_gm_esp32` (ESP32) ✅.

## ✅ نقاط فحصت سليمة
- حِزم `BLEProtocol.buildPacket` صحيحة (length = 5+len، checksum XOR).
- تعليمات `BattleArenaModal` (فواصل زمنية مُدارة)، `InteractiveCircuitSimulatorModal` (قانون أوم سليم) — لا قِسمة على صفر.
- ترميز الزوايا الموقعة ¬ +180..255 يلف ويعود سليماً في `DirectControlPanel`/`BLEManager`.
- المحاكيات ثلاثية الأبعاد لا تسرّب مواد أو حلقات (useFrame تُدار بثلاثي).
- **الجولة الثانية:**
  - `KidHomeView.tsx` و`SchoolLMSView.tsx` و`Header.tsx` — التركيب (mount/unmount عند تبديل التبويبات) سليم؛ وهو سبب توقف المايك/الكاميرا فعلياً عند مغادرة اللوحة (العلاج لمخرجات M1/M2 واضح).
  - `BattleArenaModal` — المؤقت له `clearInterval` صحيح في cleanup (سطر 43) والخطأ النظري M9 لا يشمله.
  - `ActionSequenceRecorder.tsx:33-46` — تشغيل التسلسل يمر عبر `sendCommand` فعلياً بـ BLE (يُعمل فعلياً)، الخلل الوحيد أن «التسجيل» (`isRecording:20`) كود ميت ولا يسجّل — مؤكد داخل M9.
  - `BlocklyWorkspace` — بعد إصلاح H2: no فجوة حقن قابلة للاستغلال من نصّات البلوكات؛ `localStorage` يُحمَّل عبر `textToDom` (`domToWorkspace`) XML آمن (لا `innerHTML`).
  - `Protocol.ts` ترميز `#hex` (مُستدعى داخل `__BLE_DISPATCH__`) يحوّل اللون إلى `[r,g,b]` ويتجاوز مسار النصوص المعطوب H1 في البلوكلات.

---

## ✅ تطوير جديد (2026-08-30): النسخة المدرسية — إدارة الفصول وتسجيل الطلاب (جزء أخذناه للتطوير)

**القرارات:** تسجيل الطلاب يدوياً من المعلم داخل الشعبة؛ البيانات مشتركة عبر الأجهزة من خادم `Express + ملف JSON` على جهاز المعلم؛ مع **offline fallback** محلي يعمل بلا خادم؛ أبسط شكل نفّذناه الآن.

### ما كان معطوباً / في وهمي قُبيل التطوير
- الفصول (`INITIAL_CLASSES`) والطلاب (`STUDENTS`) مصفوفتا `const` في الذاكرة — تختفي عند أي تحديث للصفحة، ولا يوجد تخزين إطلاقاً.
- نفس طلاب الوهم الستة يُعرضون لكل الشعبة بغض النظر عنها، و`studentsCount` (18/22/12) ثابت ولا يطابق المعروض (6) → تناقض.
- **لا توجد أصلاً أي آلية تسجيل طلاب في شعب**؛ «إضافة شعبة» عبر `prompt()` بقيم مفترضة.
- `StudentBadgeCardsModal` يحوي قائمة طلاب ثانية مستقلة (MOCK) منفصلة عن الفصول وغير محفوظة.
- «عرض الكود» للمعلم يعرض نفس المقطع الثابت للجميع؛ عدّاد «18 وحدة BLE» ادعاء ثابت.

### ما بُني
| المكوّن | التفاصيل |
|---|---|
| `server/store.mjs` | مخزن `server/data/school.json` بحفظ ذرّي (write+rename) وكتابات مُتسلسلة؛ يولّد تلقائياً: كود شعبة `ROBO-####`، كود انضمام رقمي فريد 4 خانات، كود دخول طالب `MG-####` فريد، 3 إيموجيات سرية، ومحطة `Station-##`. |
| `server/index.mjs` | Express + CORS على `PORT` (افتراضي 3300)؛ نقاط: شعب CRUD ، طلاب CRUD (مع روستر لكل شعبة)، تصدير/استيراد كامل، health. حذف شعبة يُزيل انضمامات طلابها. |
| `src/services/schoolApi.ts` | عميل `fetch` يجنّب حزب `VITE_API_URL`؛ `localStorage` كـ cache (`mg_school_cache_v1`). |
| `src/services/useSchoolData.ts` | الخطّافة المركزية: إظهار فوري من الكاش ثم مزامنة الخادم؛ **عند انقطاع الخادم كل التحويرات تعمل محلياً وتُحفظ**، وpolling كل 10 ثوانٍ يستعيد البيانات المشتركة عند عودته (رفض الخادم لا يكسر الشاشة). |
| `src/types/lms.ts` | `Classroom` (بلا العدّاد الثابت، يضيف `joinCode`) + `StudentProfile` موسّعاً (classId ،loginCode ،secretEmojis ،assignedRobot ،stationId ،status ،progress). |
| `SchoolLMSView.tsx` | إضافة/تعديل/حذف شعبة بنموذج حقيقي؛ **كشف كل شعبة من سجلاتها الفعلية**؛ نموذج «تسجيل طالب جديد» يولّد الهوية تلقائياً؛ أزرار حالة (أنجز/قيد العمل/يطلب مساعدة)؛ نسخ كود الانضمام؛ تصدير/استيراد JSON؛ «عرض الكود» يُظهر سجل الطالب الحقيقي؛ عدّادات الهيدر والتقارير التحليلية محسوبة من البيانات الحية. |
| `StudentBadgeCardsModal.tsx` | يستهلك الطلاب الحقيقيين من المخزن المشترك (نفس سجل الشعبة) — بطاقات تُطبع من السجل لا قائمة ثانية، مع نموذج تسجيل منفّذ داخل الشعبة. |
| `vite.config.ts` + `.env` | proxy `/api → http://localhost:3300` في التطوير؛ `VITE_API_URL` للنشر. |

### التشغيل
- `npm run server` — الخادم على `:3300` (المعروف: المنفذ 3100 مشغول بتطبيق Next آخر على هذا الجهاز).
- `npm run dev` — الواجهة بمؤشر حالة (متصل بالخادم 🟢 / وضع محلي بلا خادم) وزر مزامنة.
- على الأجهزة الأخرى افتح رابط LAN للواجهة (المعلم يشغّل الخادم فيكون المركز المشترك).

### التحقق
- `npm run build` ناجح (tsc + vite، 2420 وحدة).
- curl للنقاط: فصول (seed)، إضافة شعبة (كود + joinCode فريد)، إضافة طالبين، روستر الشعبة، لتغيير حالة `done`، حذف شعبة + حذف طلابها، export/import، رفض الأسماء الفارغة.
- دورة كاملة عبر proxy الويب (`/api`): تسجيل زينب/أحمد → ظهورهما في روستر c1 → تحديث الحالة → بقاء البيانات في `server/data/school.json` (بقاء عبر إعادة التشغيل وأجهزة متعددة).
- حدّ أمان معروف (أبسط شكل)؟ لا — ملاحظة: خادم LAN بثقة المختبر؛ المصادقة/أدوار (معلم/طالب) والانضمام الذاتي بكود الشعبة مرحلة تالية.

### إصلاح ضمن التطوير (2026-08-30)
- **اختفاء بطاقات الطلاب الجدد من تبويب «البطاقات»:** كان التبويب يعرض أول شعبة فقط عند كل إعادة تحميل بينما سجل المستخدم في شعبة أخرى → عولج بحفظ آخر شعبة مختارة (`localStorage`: `mg_school_selected_class`) + مُبدّل شعب ظاهر داخل التبويب يعرض عدد طلاب كل شعبة، ورسالة حالة فارغة تذيلي الإرشاد.
- **بطاقات الفصل وبطاقات الدخول لا تظهر في ورقة الطباعة:** لم تكن هناك أية قواعد `@media print` — كانت الطباعة تنسخ كامل لوحة التحكم فيُقتطع المحتوى وتُسقط الخلفيات الداكنة. والسبب الأعمق أن سلسلة أسلاف البطاقات (`#root`، `main.main-dashboard-content`) تحمل `overflow:hidden` و`flex-1` فتقتصّ كل ما يتجاوز ارتفاع الصفحة الواحدة فيبقى الورق فارغاً. عولج بحل **مضمون البنية**: زر «طباعة بطاقات الفصل» يفتح **نافذة طباعة مستقلة** (`window.open`) تحتوي فقط على ورقة A4 مبنيّة inline: ترويسة الشعبة (اسمها + كود الانضمام + عدد البطاقات + التاريخ) وشبكة بطاقتين/صف بكل بيانات البطاقة (الاسم، نوع الروبوت، رمز الإيموجي السري، `LOGIN CODE`، المحطة، «معتمد 2026»)، مع `print-color-adjust: exact` على كل شيء و`@page A4/7mm` — لا تتأثر بأي تخطيط أو تقطيع للوحة التحكم (fallback لـ `window.print()` إن حُجب منبثقي). تحقق: نموذج Chromium بلا رأس أخرج `out.pdf` (صفحة A4 واحدة) وجميع حقول البطاقات من DOM المقدَّم، والبناء أخضر.

---

## ✅ تطوير جديد (2026-08-30): المرحلة 1 — المناهج والوحدات المشتركة + هوية الطالب + التسليم الحقيقي

**القرارات المثبتة مع المستخدم:**
- المدى: **المرحلة 1 فقط** (أساس).
- توحيد خريطة المغامرات مع وحدات المنهاج: **مؤجَّل** — تبقى `QUEST_STAGES` الثابتة كما هي في `QuestMapModal` (ترسل الآن المرحلة المختارة إلى `KidHomeView` بدل احتفال أعمى).
- تسليم التحدي: **حقيقي** — يكتب `xp/stars/streakDays/completedQuests` في ملف الطالب المشترك عبر `PATCH /api/students/:id`.
- قالب Blockly الافتراضي لكل وحدة: **تلقائي آمن** لكل موديل (GF: `gf_set_color` أخضر، GM: `gm_set_expression` سعيد، G: `g_drive` 60,60).
- هوية الطالب: **دخول سريع** برمز الشعبة (4 خانات على لوحة الفصل) + `MG-####` من بطاقته.

### ما كان معطوباً / في الوهم قبيل التطوير
- «وحدات المنهاج» كانت `INITIAL_LESSONS`: مصفوفة `const` محلية في `SchoolLMSView` تختفي عند التحديث، لا تُحفظ، ولا يصلها جهاز آخر.
- `handleCreateLesson` ينشئ كائناً محلياً برقم `custom_${Date.now()}` فقط، لا يُفعَّل فعلياً على الشعبة، وزر «تفعيل» يكتب فقط نص العنوان في حقل نصي `activeLesson` بدون `activeLessonId`.
- عدّاد «240 نجمة» و«حماس 5 أيام متتالية» في `KidHomeView` كانت نصوصاً ثابتة بلا مصدر.
- زر «تسليم التحدي 🎁» يُطلق `confetti` احتفاليًّا فقط — لا يفتح جلسة طالب ولا يكتب أي شيء.
- `QuestMapModal.onSelectQuest` مربوط بـ `triggerCelebration` مباشرة فلا يُعرف أي مرحلة اختار الطالب.
- لا توجد آلية دخول للطالب أصلاً؛ لا جلسة ولا ربط بملفه المشترك.

### ما بُني
| المكوّن | التفاصيل |
|---|---|
| `types/lms.ts` | `SchoolUnit extends LessonChallenge` (`createdAt`/`updatedAt`/`initialXml`)، `Classroom.activeLessonId?`، `SchoolSnapshot.units`. |
| `server/store.mjs` | `SEED_UNITS` (u1/u2/u3 بقوالب XML افتراضية)، `UNIT_DEFAULTS`، `DIFF_XP`، `getUnits/addUnit/updateUnit/deleteUnit/findByJoin(joinCode,loginCode)`، `updateClass` يقبل `activeLessonId`، `replaceAll` + `snapshot` يشملان `units`، `updateStudent.allowed` += `streakDays`، `ensureLoaded` يُهاجر `data.units` عند غيابه. |
| `server/index.mjs` | `POST /api/login` (يثبت الزوج joinCode+loginCode ويعيد الطالب + اسم الشعبة، أو 404)، `GET/POST/PATCH/DELETE /api/units`، `GET /api/students/:id`، `export`/`import`/`health` تشمل `units`. |
| `src/services/unitInitialXml.ts` (جديد) | `defaultUnitXml(model)` — قالب بلوك واحد آمن لكل موديل؛ `difficultyXp(diff)` — خرائط مبتدئ/متوسط/بطل إلى 150/300/600. |
| `src/services/schoolApi.ts` | `getUnits/createUnit/updateUnit/deleteUnit/login` + `getStudent(id)`؛ `loadCache` يصمد لو غابت `units`؛ export types تشمل `SchoolUnit`. |
| `src/services/useSchoolData.ts` | أُعيدت كتابتها: state/refs للوحدات، `refresh` يجلبها، `addUnit/deleteUnit/activateUnit` بتفاؤلية وoffline، كل persist يشمل units. |
| `src/components/SchoolLMSView.tsx` | **أُزيلت `INITIAL_LESSONS` و`lessons` المحلية كلياً**؛ تبويب المناهج يقرأ `units` من الخطّافة (مع حالات تحميل/فارغة)، شارة «نشطة في هذه الشعبة ✓»، `handleCreateLesson` يدعو `addUnit` بـ `initialXml = defaultUnitXml(newModel)`، الحذف عبر `deleteUnit` بتأكيد، التفعيل عبر `activateUnit(classId, unit)` (يكتب `activeLessonId`). |
| `src/components/StudentLoginModal.tsx` (جديد) | نموذج دخول: رمز شعبة (4 خانات، تصفية رقمية) + `MG-####`، استدعاء `schoolApi.login`، حفظ `localStorage: mg_student_session`، رد `onLinked(student, className)`. |
| `src/components/KidHomeView.tsx` | شريحة هوية الطالب (اسم/نجوم/XP/زر خروج) أو زر «دخول الطالب 🎫» إن لم توجد جلسة؛ عدّاد النجوم والـ streak يُقرأ من الجلسة بدل النص الثابت؛ `selectedQuest` يتلقى المرحلة من `QuestMapModal`؛ `submitChallenge` يكتب فعلياً `PATCH /api/students/:id` (+xp/stars/streak/completedQuests) مع dedupe ومنع التكرار وfallback محلي عند انقطاع الخادم؛ polling كل 15 ثانية لتحديث ملف الطالب من جهاز آخر؛ Toast إشعار. |

### التحقق (2026-08-30)
- `npx tsc --noEmit` ✅ (0 أخطاء).
- `npm run build` ✅ (5.09s، SW مولّد).
- إعادة تشغيل خادم المدرسة → `GET /api/health` = `{"ok":true,"classes":4,"students":5,"units":3}` (SEED_UNITS بُذرت بنجاح).
- `GET /api/units` → 3 وحدات بـ `initialXml` صحيح و`createdAt`/`updatedAt`.
- دورة وحدة جديدة: `POST` (id فريد) → `PATCH` (xpReward 450، updatedAt محدّث) → `DELETE` (200، رجع العدد إلى 3) ✅.
- دخول سريع: `POST /api/login {joinCode:"5546",loginCode:"MG-2752"}` → أعاد `زنوبة الحبابة` + `className: test` ✅؛ رمز خاطئ → 404 برسالة واضحة ✅.
- تسليم تحدٍّ: `PATCH /api/students/…MG-2752` (`{xp:300,stars:3,streakDays:1,completedQuests:["u2"],status:"done"}`) → كُتب `stars:3 / streak:1` ✅ (ملاحظة: أُضيف `streakDays` إلى قائمة `allowed` بعد أن رأينا أن الزيادة لم تكن تُحفظ أول مرة، ثم أعَدنا التشغيل فثبتت).
- `GET /api/students/:id` يعيد الملف المحدّث ✅.
- `GET /api/export` يشمل `units` (3) مع `classes` (4) و`students` (5) ✅.

### مؤجَّل صراحةً (خارج المرحلة 1)
- توحيد `QUEST_STAGES` الثابتة في `QuestMapModal` مع وحدات المنهاج الفعلية (بقيت كما هي؛ فقط أصبحت تُرسل المرحلة المختارة إلى `KidHomeView`).
- المصادقة/الأدوار (معلم/طالب) والانضمام الذاتي للطلاب بكود الشعبة — خادم LAN بثقة المختبر.
- تفعيل `initialXml` الوحدة داخل `BlocklyWorkspace` فعلياً عند اختيار الطالب للمرحلة (حالياً يُحفظ ولا يُحمَّل تلقائياً في مساحة العمل — ربط لاحق).

---

## ✅ تطوير جديد (2026-08-30): بطاقات المهام المخبرية مستمدة من المنهاج المشترك + طباعة A4 مستقلة

**القرارات المثبتة مع المستخدم:**
- المصدر: **كلاهما** — بطاقات مستمدة تلقائياً من وحدات المنهاج المشتركة (`units`) + العينات الجاهزة الأربعة (`FLASHCARDS`)، تُعرض وتُطبَع معاً.
- محتوى البطاقة المطبوعة: **العنوان + الهدف الهندسي + الأقطاب + تلميحات البلوكات + معيار التحقق + مستوى الصعوبة + خانة اعتماد المدرب** (بطاقة مخبرية كاملة).
- الأقطاب وتلميحات البلوكات: **يدوية فارغة** (لا تملأ تلقائياً حسب الموديل).
- الطباعة: **نافذة A4 مستقلة** (نفس حل بطاقات الطلاب) عبر `window.open` + `document.write` + `win.print()` بعد 250ms.
- النطاق: تطوير بطاقات المهام + **تعديل نموذج إنشاء الوحدة** ليضم حقول الأقطاب والتلميحات.

### ما كان معطوباً / في الوهم قبيل التطوير
- `PrintableFlashcardsModal` كان يعرض **أربع بطاقات ثابتة فقط** (`FLASHCARDS` مصفوفة `const`) لا علاقة لها بوحدات المنهاج المشتركة التي بُنيت في المرحلة 1.
- زر «طباعة بطاقات التجارب» يستدعي `window.print()` للوحة التحكم كاملة — يعاني من اقتطاع `overflow:hidden`/`flex-1` في الأسلاف (نفس مشكلة بطاقات الطلاب قبل إصلاحها).
- لا توجد حقول للأقطاب أو تلميحات البلوكات في نموذج «بناء وحدة جديدة» — فلا يمكن للمعلم أن يغذّي بطاقة المهمة من وحدته.

### ما بُني
| المكوّن | التفاصيل |
|---|---|
| `types/lms.ts` | `LessonChallenge` += `hardwarePins?`، `blocksHint?`، `protocolCode?` (تنتقل تلقائياً إلى `SchoolUnit`). |
| `server/store.mjs` | `SEED_UNITS` (u1/u2/u3) بُذرت بـ `protocolCode` (`LAB-PROTOCOL-01..03`) + `hardwarePins` + `blocksHint`. `addUnit` يقبل الحقول الثلاث ويولّد `protocolCode` تلقائياً (`LAB-PROTOCOL-NN` تسلسلياً) إن لم يُمرَّر. `updateUnit` يقبلها. `ensureLoaded` يُهاجر الوحدات القديمة بإضافة الحقول مفقودة (تهجير آمن idempotent). |
| `SchoolLMSView.tsx` (creator) | نموذج «بناء وحدة جديدة» += حقل **الأقطاب** (input) + **تلميحات البلوكات** (textarea، سطر لكل تلميح)؛ `handleCreateLesson` يحوّل الأسطر إلى مصفوفة ويمررها إلى `addUnit`. |
| `PrintableFlashcardsModal.tsx` (أُعيدت كتابته) | يقبل `units: SchoolUnit[]` ويدمجها مع `FLASHCARDS` (العينات) في قائمة واحدة. شارة بصرية تميّز «منهاجك» (emerald) عن «عينة» (slate). زر «طباعة بطاقات المهام (A4)» يفتح **نافذة طباعة مستقلة** بـ inline CSS كامل (بطاقتان/صف A4، `@page A4/7mm`، `print-color-adjust: exact`) تحوي: protocolCode + difficulty + title + objective + hardwarePins + blocksHint + criteria + خانة اعتماد المدرب. fallback لـ `window.print()` عند حجب المنبثق. |

### التحقق (2026-08-30)
- `npx tsc --noEmit` ✅ (0 أخطاء).
- `npm run build` ✅ (PWA مولّد).
- إعادة تشغيل الخادم → `GET /api/units` = u1/u2/u3 بـ `protocolCode: LAB-PROTOCOL-01..03` + `hardwarePins` + `blocksHint` (التهجير آمن: الوحدة الرابعة القديمة `0a59a483…` أُضيفت لها حقول فارغة ثم حُذفت).
- `POST /api/units` بحقول البطاقة الجديدة → أعاد `protocolCode: LAB-PROTOCOL-05` (تلقائي) + `hardwarePins` + `blocksHint` مصفوفة سليمة ✅.
- طباعة A4 عبر Chromium headless: `out.pdf` (505KB) وDOM يحوي **5 بطاقات** (3 وحدات + 2 اختبار) بكل الحقول: `pins=4 blocks=4 criteria=5 foot=5` + العناوين صحيحة ✅.
- البطاقات على الشاشة بـ `min-w-0 overflow-hidden` و`truncate` و`shrink-0` — لا تخرج الحقول عن الحدود (نفس إصلاح بطاقات الطلاب).

---

## ✅ تطوير جديد (2026-08-30): أوراق العمل — توليد ذكي هجين من الوحدات + طباعة A4 مستقلة

**القرارات المثبتة مع المستخدم:**
- المصدر: **مستمد من الوحدات + مخصص** — كل وحدة في المخزن المشترك تُولّد ورقة عمل تلقائياً + عينات جاهزة قابلة للطباعة الفورية.
- أنواع الأسئلة: **اختيار من متعدد فقط** (4 خيارات: صحيح + 3 مشتتات منطقية).
- التوليد: **هجين** — قوالب كود مدمجة + قاموس مشتتات لكل موديل (GF/GM/G) افتراضياً، مع زر «توليد من الخادم» (AI اختياري لاحقاً عبر `OPENAI_API_KEY`).
- عدد الأسئلة: **قابل للتخصيص** (3/5/7) — المعلم يختار قبل الطباعة.
- الطباعة: **نافذة A4 مستقلة** (نفس حل البطاقات).
- الترويسة: **تلقائية من الشعبة** (اسم الشعبة + رمز الانضمام + فراغ لاسم الطالب + التاريخ).

### ما كان معطوباً / في الوهم قبيل التطوير
- `PrintableActivitiesModal` كان يعرض **ورقتين ثابتتين فقط** (`ACTIVITIES` مصفوفة `const`) لا علاقة لهما بوحدات المنهاج المشتركة.
- سؤال `connect` مجرد خط فارغ (`h-10 border-b`) — لا matching حقيقي.
- زر الطباعة `window.print()` للوحة كاملة — يُقتطع من `overflow:hidden`/`flex-1` (نفس مشكلة البطاقات قبل الإصلاح).
- لا ترويسة من الشعبة (اسم الطالب/الشعبة فراغات يدوية).
- لا CRUD؛ الأسئلة جامدة في الكود.

### ما بُني
| المكوّن | التفاصيل |
|---|---|
| `src/services/worksheetGenerator.ts` (جديد) | `generateFromUnit(unit, count)` — 7 قوالب أسئلة اختيار من متعدد تستهلك حقول الوحدة (الوصف/الموديل/الأقطاب/البلوكات/معيار التحقق/المستوى) + قاموس مشتتات لكل موديل (GF/GM/G: parts/actions/sensors). يخلط القوالب ويخلّط الخيارات داخل كل سؤال مع تتبع `correctIndex`. |
| `types/lms.ts` | `LessonChallenge` += `worksheetQuestions?: { q, options, correctIndex }[]`. |
| `server/store.mjs` | `addUnit`/`updateUnit` يقبلان `worksheetQuestions`؛ `ensureLoaded` يُهاجرها (تهجير آمن idempotent). |
| `server/index.mjs` | `POST /api/worksheets/generate { unitId, count }` — مولّد قوالب في الخادم (mirror للعميل)؛ 404 إن لم توجد الوحدة؛ `count` محصور 1..7. |
| `src/services/schoolApi.ts` | `generateWorksheet(unitId, count)` → `{ questions, source }`. |
| `PrintableActivitiesModal.tsx` (أُعيدت كتابته) | يقبل `units` + `sectionName?` + `joinCode?` من `currentClass`. **منتقي وحدة** + **منتقي عدد الأسئلة** (3/5/7) + **زر «توليد من الخادم»** (fallback للقوالب عند انقطاع الخادم). معاينة الورقة بترويسة تلقائية (اسم الشعبة + رمز الانضمام + فراغ لاسم الطالب). زر «طباعة ورقة العمل (A4) 🖨️» يفتح نافذة A4 مستقلة (inline CSS، `@page A4/10mm`، أسئلة بخانات مربعات أ/ب/ج/د، تذييل تقييم المدرب). قسم «عينات جاهزة» بورقتين للطباعة الفورية. |

### التحقق (2026-08-30)
- `npx tsc --noEmit` ✅ (0 أخطاء — أصلحتُ استيراد `RobotModelType` من `types/robot` بعد خطأ أول).
- `npm run build` ✅ (PWA مولّد).
- إعادة تشغيل الخادم → `GET /api/health` = 4 شعب، 5 طلاب، 3 وحدات.
- `POST /api/worksheets/generate { unitId:"u1", count:5 }` → `source: "template"` + **5 أسئلة** اختيار من متعدد (4 خيارات لكل سؤال، `correctIndex` موزّع 0..3) ✅.
- `count=7` للوحدة u2 → 7 أسئلة ✅؛ `unitId` خاطئ → 404 ✅.
- إصلاح علة: المولّد في الخادم كان يمرّر `q` (كائن سؤال) بدل `builder()` (دالة) في `.map()` → أصلحته ليستدعي `builder()` أولاً.
- طباعة A4 عبر Chromium headless: `ws.pdf` (268KB) وDOM يحوي **5 أسئلة** + **19 خيار/خانة** + الترويسة (اسم الشعبة «شعبة الروبوتكس» + كود «2048») + التذييل «Mini G Platform» ✅.

### مؤجَّل صراحةً (خارج هذه الجلسة)
- تكامل AI خارجي فعلي عبر `OPENAI_API_KEY` (البنية جاهزة في الخادم؛ يحتاج مفتاحاً في `.env`).
- أنواع أسئلة إضافية (connect/draw/fill/short answer) — قرار المستخدم: اختيار من متعدد فقط حالياً.
- حفظ الأسئلة المولّدة في `unit.worksheetQuestions` للمراجعة اليدوية (الحقل موجود في النموذج لكن التوليد ديناميكي per-request حالياً).

---

## ✅ تطوير جديد (2026-08-30): الشهادات المعتمدة — منح من سجل الشعبة + طباعة A4 landscape مستقلة + تسجيل في ملف الطالب

**القرارات المثبتة مع المستخدم:**
- المنح: **اختيار طالب من الشعبة الحالية** — المعلم يفتح الشعبة → يرى طلابها مع تقدّمهم → يمنح بالضغط.
- الشروط: **بلا شروط إلزامية** — تقدّم الطالب (نجوم/XP/وحدات) يُعرض بجانب اسمه للمساعدة فقط.
- الحقول المطبوعة: **الحقول الحالية** (اسم الطالب + المسار + المدرب + التاريخ + الختم/التواقيع) — بلا إحصاءات/أرقام/بيانات شعبة إضافية.
- الطباعة: **نافذة A4 landscape مستقلة** (نفس حل البطاقات لكن أفقية).
- التسجيل: **نعم سجّل في ملف الطالب المشترك** (`certificates[]`).
- النطاق: تطوير الشهادات الأساسي فقط (لا إصدار جماعي / لا مستويات تلقائية / لا تنزيل PDF مستقل).

### ما كان معطوباً / في الوهم قبيل التطوير
- `CertificateGeneratorModal` مكوّن مستقل بلا props — 4 حقول إدخال **يدوية** مُملوءة بقيم ثابتة (`زينب حيدر الموسوي`، مسار ثابت، مدرب ثابت، تاريخ ثابت).
- لا ربط بالطلاب/الشعبة — المعلم يكتب الاسم يدوياً رغم وجود سجل مشترك كامل.
- زر الطباعة `window.print()` للوحة كاملة — يُقتطع من `overflow:hidden`/`flex-1`.
- لا تسجيل للإصدار — الشهادة تُطبع وتنسى؛ ملف الطالب لا يعرف أنه حصل عليها.
- اتجاه portrait بينما الشهادات عادةً أفقية (landscape).
- لا رقم شهادة فريد، لا تاريخ تلقائي.

### ما بُني
| المكوّن | التفاصيل |
|---|---|
| `types/lms.ts` | `StudentProfile` += `certificates?: { id, certNumber, unitId?, courseName, coachName?, level, issuedAt }[]`. |
| `server/store.mjs` | `updateStudent.allowed` += `certificates`؛ دالة `genCertNumber()` مولّد أرقام فريدة `CERT-####` مع فحص تصادم. |
| `server/index.mjs` | نقطة جديدة `POST /api/students/:id/certificates { courseName, coachName?, level, unitId? }` — تُولّد `certNumber` فريد + `id` (crypto.randomUUID) + `issuedAt`، تُلحق بمصفوفة شهادات الطالب، تعيد الملف محدّثاً. |
| `src/services/schoolApi.ts` | `issueCertificate(id, body)` → `POST /api/students/:id/certificates`. |
| `CertificateGeneratorModal.tsx` (أُعيدت كتابته) | يقبل `students` (روستر الشعبة) + `units` + `sectionName?` + `joinCode?` + `coachName?`. **منتقي طالب** بأسماء + شارة تقدّم (⭐ نجوم · XP · وحدات مكتملة). **ملء تلقائي**: المسار من آخر وحدة مكتملة أو الوحدة النشطة، المدرب من prop، التاريخ اليوم. زر «منح وطباعة الشهادة 🎓» → `schoolApi.issueCertificate` → فتح **نافذة A4 landscape مستقلة** (inline CSS، `@page A4 landscape/8mm`، إطار مزدوج ذهبي، شعار، ختم ★، تواقيع، رقم شهادة) + `confetti`. **سجل الشهادات السابقة** للطالب أسفل المعاينة. زر «إعادة طباعة» لآخر شهادة. حالة فارغة (شعبة بلا طلاب) برسالة إرشادية. |
| `SchoolLMSView.tsx` | `<CertificateGeneratorModal students={roster} units={units} sectionName={currentClass?.name} joinCode={currentClass?.joinCode} />`. |

### التحقق (2026-08-30)
- `npx tsc --noEmit` ✅ (0 أخطاء).
- `npm run build` ✅ (PWA مولّد).
- إعادة تشغيل الخادم → `GET /api/health` = 4 شعب، 5 طلاب، 3 وحدات.
- `POST /api/students/…/certificates` (جويسم الذكي) → `certificates: [{ certNumber: "CERT-6665", level: "تفوق", issuedAt: "2026-08-30" }]` ✅.
- شهادة ثانية → `CERT-9989` (لا تصادم) ✅.
- `GET /api/students/:id` يعيد `certificates` محفوظة ✅.
- `PATCH` بـ `certificates: []` يُعيد التصفير ✅.
- طباعة A4 landscape عبر Chromium headless: `cert.pdf` (183KB) وDOM يحوي: العنوان + الاسم (جويسم الذكي) + المسار (التوأم الرقمي) + المدرب + التاريخ + `CERT-6665` + `OFFICIAL SEAL` + `MINI G ROBOTICS` — كلها True ✅.

### مؤجَّل صراحةً (خارج هذه الجلسة)
- إصدار دفعة لشعبة كاملة دفعة واحدة.
- ثلاثة مستويات تلقائية (مشاركة/تفوق/امتياز) بناءً على التقدّم.
- تنزيل PDF مستقل بجانب الطباعة.
- شروط إلزامية للمنح (إكمال وحدة + نجوم).