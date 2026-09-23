// ফোন নম্বর, ইমেইল, সোশ্যাল/মেসেজিং লিংক শনাক্ত করে মাস্ক করার জন্য

const PATTERNS = [
  // বাংলাদেশি ও সাধারণ ফোন নম্বর (স্পেস/ড্যাশ সহ)
  /(?:\+?88)?0?1[3-9]\d{1}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{3}/g,
  // যেকোনো ৭+ ডিজিটের নম্বর সিকোয়েন্স (স্পেস/ড্যাশ দিয়ে ভাঙা থাকলেও)
  /\b\d[\d\s-]{6,}\d\b/g,
  // ইমেইল
  /[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/g,
  // URL / ডোমেইন
  /(https?:\/\/[^\s]+)|(\b(?:www\.)?[a-zA-Z0-9-]+\.(?:com|net|org|me|im|io)\b\S*)/gi,
  // সাধারণ মেসেজিং অ্যাপের নাম উল্লেখ (হালকা সিগন্যাল হিসেবে, শুধু নাম মাস্ক হবে না — regex উপরের গুলোই যথেষ্ট)
];

const APP_MENTION = /\b(whatsapp|imo|telegram|messenger|facebook|fb id|instagram|insta)\b/gi;

export function scanSensitive(text) {
  if (!text) return { hasSensitive: false, ranges: [] };
  const ranges = [];
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      ranges.push([m.index, m.index + m[0].length]);
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  // অ্যাপের নাম উল্লেখ থাকলেও ফ্ল্যাগ করি (নম্বর না থাকলেও সতর্কতা)
  APP_MENTION.lastIndex = 0;
  const mentionsApp = APP_MENTION.test(text);

  return { hasSensitive: ranges.length > 0 || mentionsApp, ranges: mergeRanges(ranges) };
}

function mergeRanges(ranges) {
  if (ranges.length === 0) return ranges;
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i][0] <= last[1]) {
      last[1] = Math.max(last[1], sorted[i][1]);
    } else {
      merged.push(sorted[i]);
    }
  }
  return merged;
}

// টেক্সটকে অংশে ভাঙে — প্রতিটা অংশ { text, masked: bool }
// UI তে masked=true অংশটুকু ব্লার/ডট দিয়ে রেন্ডার করবেন
export function splitMasked(text) {
  const { ranges } = scanSensitive(text);
  if (ranges.length === 0) return [{ text, masked: false }];
  const parts = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), masked: false });
    parts.push({ text: text.slice(start, end), masked: true });
    cursor = end;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), masked: false });
  return parts;
}
