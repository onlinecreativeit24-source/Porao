# EAS Build & Keystore Steps (বাংলা)

এই ডকুমেন্টে Expo Application Services (EAS) ব্যবহার করে production-signed Android AAB বানানোর, এবং release keystore তৈরি ও নিরাপদভাবে সেটাপ করার নির্দিষ্ট ধাপগুলো দেয়া আছে। এগুলো লোকালি তুমি চালাবেই — আমি কেবল নির্দেশ ও টেম্পলেট ফাইল যোগ করছি, কিন্তু keystore/পাসওয়ার্ড কখনো রিপোতে রাখবে না।

প্রয়োজনীয়তা
- Java JDK (keytool) ইনস্টল করা থাকতে হবে
- Node.js ও npm/yarn ইনস্টল
- eas-cli ইনস্টল: `npm install -g eas-cli` (বা yarn global add)
- তোমার Expo project (app.json) এবং EAS configured (eas.json আছে)
- Expo account ও eas login করা: `eas login`

১) লোকালি release keystore তৈরি করা

সংক্ষিপ্ত কমান্ড (সরাসরি রান করো এবং prompts অনুসরণ করো):

keytool -genkeypair -v -keystore porao-release.jks -alias porao -keyalg RSA -keysize 2048 -validity 10000

- এই কমান্ড চালালে তোমাকে keystore password, name, organization ইত্যাদি দিতে বলা হবে।
- ফলাফল: `porao-release.jks` ফাইল। এটাকে কখনো git-এ commit কোরো না।

২) keystore থেকে প্রয়োজনীয় মানগুলো বের করা (EAS-এ দেবার জন্য)

keytool -list -v -keystore porao-release.jks -alias porao

এই আউটপুটে দেখবে:
- Entry type
- SHA1 / SHA256 fingerprints
- প্রতিটি ভ্যালু ও alias

প্রতিটি মান নোট করো:
- KEYSTORE_PATH (উদাহরণ: ./porao-release.jks)
- KEYSTORE_PASSWORD (store password)
- KEY_ALIAS (alias, এখানে: porao)
- KEY_PASSWORD (alias password)

৩) .gitignore এবং লোকাল টেমপ্লেট (রিপোতে রাখার জন্য)

গতিতে একটি example ফাইল যোগ করো (commit করা যাবে):

keystore.properties.example
```
# DO NOT COMMIT your real keystore or passwords
storeFile=./porao-release.jks
storePassword=***REPLACE_ME***
keyAlias=porao
keyPassword=***REPLACE_ME***
```

.gitignore তে নিশ্চিত করো যে keystore/properties excluded আছে:
```
# keystore
*.jks
keystore.properties
*/porao-release.jks
```

(মনে রেখো: আমি keystore ফাইল রিপোতে commit করব না।)

৪) EAS-managed credentials বা নিজস্ব keystore আপলোড

A) EAS-managed credentials (সরাসরি সহজ):

# eas-cli interactive
eas credentials -p android

এই interactive flow-এ তুমি `Use EAS managed keystore` নির্বাচন করতে পারো — EAS নিজে keystore তৈরি ও ম্যানেজ করবে।

B) তোমার নিজের keystore আপলোড (secure):

# interactive টুল
eas credentials -p android

(বা) সরাসরি আপলোড কমান্ড নেই, interactive flow-এ `Upload Keystore` অপশন নাও।

যথারীতি interactive flow-এ তুমি files path ও passwords দেবে। CLI শেষ হলে EAS সার্ভিস-এ keystore সংরক্ষিত হবে।

৫) EAS build (production profile)

app.json-এ versionCode ঠিক আছে কি নিশ্চিত করো (প্রতি রিলিজে বাড়াতে হবে)।

Build command:

eas build --platform android --profile production

- EAS interactive হলে credentials ব্যবহার করবে (যদি upload না করো)।
- Completed build থেকে signed AAB (.aab) ডাউনলোড করবে।

৬) AAB থেকে APK বানিয়ে লোকাল টেস্ট (ঐচ্ছিক)

Amazon Appstore-এ AAB সরাসরি আপলোড করা যায়। কিন্তু লোকালে APK টেস্ট করতে চাইলে bundletool ব্যবহার করে APK বের করা যেতে পারে:

- bundletool.jar ডাউনলোড: https://github.com/google/bundletool/releases

# AAB থেকে .apks (universal বা device-specific)
java -jar bundletool.jar build-apks --bundle=app-release.aab --output=app.apks --mode=universal --ks=./porao-release.jks --ks-pass=pass:YOUR_STORE_PASSWORD --ks-key-alias=porao --key-pass=pass:YOUR_KEY_PASSWORD

# apks ফাইল extract করে ইনস্টলযোগ্য universal.apk বের করা:
unzip app.apks -d out_dir
# তারপর out_dir/universal.apk পাবেন
adb install -r out_dir/universal.apk

৭) EAS build logs ও troubleshooting

- build error দেখলে `eas build -p android --profile production --non-interactive` চালালে বিস্তারিত লগ পাওয়া যায়।
- EAS build URL-এ (dashboard) artifacts ও বিশদ লোগস আছে। আমাকে যদি লোগস পাঠাও, আমি help করব।

৮) Amazon Appstore এ আপলোডের জন্য টিপস

- Amazon Console-এ নতুন অ্যাপ রেকর্ড তৈরি করো এবং AAB আপলোড করো। (বা APK যদি AAB-এ সমস্যা হয়)
- privacy policy URL app.json-এ দিন (তুমি ইতোমধ্যেই update করেছো) — নিশ্চিত করো যে URL public ও HTTPS।
- যদি অ্যাপে external payment (UddoktaPay) দিয়ে virtual coins দেয়ো, Amazon IAP policy চেক করো — সম্ভাব্যভাবে reviewer reject করতে পারে।

৯) নিরাপত্তা best-practices

- Keystore কখনই GitHub এ commit করো না।
- Keystore password/alias/key password গোপন রাখো (password manager বা cloud secret manager ব্যবহার করো)।
- প্রয়োজনে keystore rotate করো যদি leak ঘটে থাকে।

10) উদাহরণ workflow (শর্ট)

1. লোকালি key তৈরি:
   keytool -genkeypair -v -keystore porao-release.jks -alias porao -keyalg RSA -keysize 2048 -validity 10000
2. eas login
   eas login
3. eas credentials -p android  (upload keystore বা use EAS-managed)
4. eas build --platform android --profile production
5. ডাউনলোড করা .aab পরীক্ষা করে Amazon Console-এ আপলোড


---

আমি এই ডকুমেন্টটি prod/eas-keystore-setup ব্রাঞ্চে যোগ করে দিলাম।

পরবর্তী কাজ (আমি করতে পারি):
- .gitignore আপডেট করে keystore pattern যোগ করা
- keystore.properties.example ফাইল যোগ করা
- README তে সংক্ষিপ্ত নির্দেশ যোগ করা

বলো তুমি এগুলোও ADD করতে চাও কিনা, আমি করে দেবো (কোনো সিক্রেট কখনো commit করব না)।