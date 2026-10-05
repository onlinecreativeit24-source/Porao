# Porao — Build & Release Guide (বাংলা)

এই README টেমপ্লেটটি তোমাকে production-ready AAB তৈরি ও Amazon Appstore-এ সাবমিট করার ধাপগুলো স্মরণ করাতে দেয়। বিস্তারিত ধাপে EAS_BUILD_AND_KEYSTORE.md ফাইলে আছে; নিচে দ্রুত গাইড দেওয়া হলো।

প্রয়োজনীয়তা
- Node.js, npm/yarn
- eas-cli (npm install -g eas-cli)
- Java JDK (keytool)
- Expo account (eas login)

দ্রুত ধাপ (Copy & run)
1) লোকালি release keystore তৈরি:

   keytool -genkeypair -v -keystore porao-release.jks -alias porao -keyalg RSA -keysize 2048 -validity 10000

   - prompts অনুযায়ী password ও তথ্য দাও। porao-release.jks তৈরি হবে — কখনো রিপোতে রাখবে না।

2) eas-এ লগইন:

   eas login

3) EAS credentials ম্যানেজ করো (keystore upload বা EAS-managed):

   eas credentials -p android

   - interactive flow-এ "Upload Keystore" নির্বাচন করলে তোমাকে keystore path ও passwords দেবার জন্য বলবে।

4) Production build (AAB):

   eas build --platform android --profile production --wait

   - সফল হলে build artifact (.aab) ডাউনলোড করে Amazon Console-এ আপলোড করো।

5) (ঐচ্ছিক) লোকালভাবে AAB থেকে APK বানিয়ে পরীক্ষা করার জন্য EAS_BUILD_AND_KEYSTORE.md দেখো (bundletool ব্যবহার) ।

নোটস ও সতর্কতা
- porao-release.jks অথবা কোনো সিক্রেট কখনো GitHub-এ commit করো না।
- app.json-এ expo.android.versionCode প্রতিটি রিলিজে ইনক্রিমেন্ট করো।
- privacyUrl public ও HTTPS হওয়া ভাল — তুমি এখন raw.githubusercontent.com ব্যবহার করেছো, যদি সম্ভব হবে নিজের ডোমেইনে হোস্ট করো।
- যদি অ্যাপে virtual coins/ডিজিটাল আইটেম বাইরের payments (UddoktaPay) দিয়ে বিক্রি করা হয়, Amazon-এর IAP পলিসি চেক করে নিবে; প্রয়োজনে Amazon IAP-এ মাইগ্রেটের পরিকল্পনা করো।

পরবর্তী আমি সাহায্য করব
- তুমি build চালালে build URL বা লোগস পেলে আমি দেখে debugging/compatibility সাহায্য করব।
- আমি repo-তে Keeystore/Passwords কখনো যোগ করব না — তোমাকে লোকালি বা EAS-এ সেট করতে হবে।

(ফাইলটি prod/eas-keystore-setup ব্রাঞ্চে রয়েছে)।
