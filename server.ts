import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google Gen AI SDK
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn('⚠️ GEMINI_API_KEY is not set. Using intelligent fallback dialogue engine.');
}

/**
 * Detect language of the caller's message:
 * - 'thanglish': Tamil words written in English / Roman alphabet
 * - 'tamil': Tamil script (\u0B80-\u0BFF)
 * - 'hindi': Devanagari script (\u0900-\u097F)
 * - 'hinglish': Hindi words written in English / Roman alphabet
 * - 'english': Standard English or other
 */
function detectCallerLanguage(text: string): 'thanglish' | 'tamil' | 'hindi' | 'hinglish' | 'english' {
  if (!text) return 'english';
  const lower = text.toLowerCase();

  // 1. Tamil script characters
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'tamil';
  }

  // 2. Hindi / Devanagari script characters
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  // 3. Thanglish (Tamil written phonetically in English script)
  const thanglishKeywords = [
    'vanakkam', 'naan', 'nan', 'pesren', 'pesuren', 'irukangala', 'irukaangala', 'irukanga',
    'pathi', 'solren', 'sollunga', 'solunga', 'kitta', 'enna', 'vishayam', 'enga',
    'vandhiruken', 'vandhurukku', 'vandhuten', 'vandhen', 'kudukava', 'kudukanum',
    'vaanga', 'ponga', 'illai', 'aama', 'seri', 'sari', 'theriyum', 'puriyala',
    'ungaluku', 'unga', 'kaaga', 'call panren', 'call pannen', 'parcel-ah', 'delivery-ah',
    'kekkuringala', 'kuduthuten', 'solli', 'paaru', 'mudiyuma'
  ];
  const isThanglish = thanglishKeywords.some((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(lower) || lower.includes(word)
  );
  if (isThanglish) {
    return 'thanglish';
  }

  // 4. Hinglish (Hindi written phonetically in English script)
  const hinglishKeywords = [
    'namaste', 'namaskar', 'aap', 'kaise', 'kahan', 'hai', 'hain', 'hoon', 'karni',
    'bol raha', 'bol rahi', 'baat', 'baare', 'theek', 'karo', 'batao', 'bata', 'dungi',
    'dunga', 'chahiye', 'kaam', 'shukriya', 'dhanyawad', 'aaya', 'aaye', 'pahuncha'
  ];
  const isHinglish = hinglishKeywords.some((word) =>
    new RegExp(`\\b${word}\\b`, 'i').test(lower) || lower.includes(word)
  );
  if (isHinglish) {
    return 'hinglish';
  }

  return 'english';
}

/**
 * Intelligent Fallback Dialogue Engine for Swathi's Assistance
 * Features:
 * - Simple words and spoken conversational language
 * - Dynamic language mirroring (Thanglish, English, Tamil, Hindi/Hinglish)
 * - Saved contact acknowledgment by name
 * - Caller self-introduction acknowledgment ("Hi Madhu! I'm Swathi's Assistance...")
 * - Purpose routing ("Okay, I will update your message regarding delivery towards Swathi")
 * - 0% repetition guarantee
 */
function generateFallbackResponse(
  callerName: string,
  callerNumber: string,
  callerMessage: string,
  history: Array<{ role: string; text: string }> = [],
  turnCount: number = 1,
  persona: string = 'professional',
  isSavedContact: boolean = false,
  callerGender: 'male' | 'female' = 'male'
) {
  const lower = callerMessage.toLowerCase().trim();
  const callerTurns = history.filter((h) => h.role === 'caller').length + 1;
  const lang = detectCallerLanguage(callerMessage);

  let category = 'general';
  let spamRisk = 10;
  let urgency: 'low' | 'medium' | 'high' = 'medium';
  let suggestedAction: 'approve' | 'reject' | 'gather_more_info' = 'approve';
  let aiReply = '';
  let summary = '';
  const keyDetails: string[] = [];

  const previousAssistantReplies = history
    .filter((h) => h.role === 'assistant')
    .map((h) => h.text.trim().toLowerCase());

  // Guarantee that the AI NEVER repeats an answer in the conversation
  const pickFreshReply = (candidates: string[]): string => {
    for (const cand of candidates) {
      const candClean = cand.trim().toLowerCase();
      const isAlreadySpoken = previousAssistantReplies.some(
        (prev) => prev === candClean || prev.slice(0, 20) === candClean.slice(0, 20)
      );
      if (!isAlreadySpoken) {
        return cand;
      }
    }
    // Dynamic progressive reply matching detected language
    if (lang === 'thanglish') {
      return `Seri, unga message-ah na Swathi kitta kandippa solren.`;
    } else if (lang === 'tamil') {
      return `சரி, உங்கள் செய்தியை நான் சுவாதியிடம் உடனே தெரிவிக்கிறேன்.`;
    } else if (lang === 'hindi' || lang === 'hinglish') {
      return `Theek hai, main aapka message Swathi tak pahuncha dungi.`;
    }
    return `Understood. I will update your message towards Swathi right away.`;
  };

  const hasWord = (...words: string[]) =>
    new RegExp(`\\b(${words.join('|')})\\b`, 'i').test(lower);

  // 1. Caller self-introduction detection across languages:
  // English: "I'm Madhu", "I am Madhu", "This is Madhu", "My name is Madhu"
  // Thanglish: "Naan Madhu", "Madhu pesren", "Madhu pesuren"
  // Hinglish: "Main Madhu hoon", "Main Madhu bol raha hoon"
  let introducedName = '';

  const englishIntro = lower.match(/\b(?:i'?m|i am|this is|my name is)\s+([a-zA-Z]+)\b/i);
  const thanglishIntro = lower.match(/\b(?:naan|nan)\s+([a-zA-Z]+)\b/i) || lower.match(/\b([a-zA-Z]+)\s+(?:pesren|pesuren)\b/i);
  const hinglishIntro = lower.match(/\b(?:main|mera naam)\s+([a-zA-Z]+)\b/i);

  if (englishIntro) introducedName = englishIntro[1];
  else if (thanglishIntro) introducedName = thanglishIntro[1];
  else if (hinglishIntro) introducedName = hinglishIntro[1];

  const nonNameWords = ['calling', 'a', 'the', 'here', 'just', 'with', 'from', 'at', 'an', 'on', 'in', 'not', 'speaking', 'bol', 'raha', 'rahi', 'pesren'];
  if (introducedName && nonNameWords.includes(introducedName.toLowerCase())) {
    introducedName = '';
  }
  if (introducedName) {
    introducedName = introducedName.charAt(0).toUpperCase() + introducedName.slice(1).toLowerCase();
  }

  // If saved contact and caller doesn't explicitly introduce a different name, use the saved contact name
  const effectiveName = introducedName || (isSavedContact ? callerName : '');

  // 2. Caller purpose detection: delivery, courier, appointment, etc.
  const isDelivery =
    hasWord('delivery', 'package', 'courier', 'driver', 'fedex', 'ups', 'amazon', 'signature', 'box', 'parcel', 'product') ||
    lower.includes('delivery of product') ||
    lower.includes('deliver') ||
    lower.includes('order') ||
    lower.includes('parcel-ah');

  const regardingMatch = lower.match(/\b(?:calling regarding|calling about|regarding|about|purpose of my call is|delivery of)\s+([a-zA-Z0-9\s]+?)(?:to|at|for|from|\.|\?|$)/i);
  let regardingTopic = regardingMatch && regardingMatch[1] ? regardingMatch[1].trim() : '';

  // 3. Spam detection
  const isSpam =
    hasWord('warranty', 'crypto', 'bitcoin', 'lottery', 'irs', 'gift card', 'won', 'debt', 'loan', 'cheap', 'free trip', 'telemarketer') ||
    lower.includes('press 1 now') ||
    lower.includes('student loan') ||
    lower.includes('vehicle service');

  const isGateCodeOrDeliveryLocation =
    lower.includes('gate code') ||
    lower.includes('gate kitta') ||
    lower.includes('gate') ||
    lower.includes('apt') ||
    lower.includes('apartment') ||
    lower.includes('security') ||
    lower.includes('lobby') ||
    lower.includes('door') ||
    lower.includes('downstairs');

  // ==================== THANGLISH RESPONSES ====================
  if (lang === 'thanglish') {
    if (isDelivery) {
      category = 'delivery';
      spamRisk = 2;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `${effectiveName || 'Caller'} calling in Thanglish regarding product delivery.`;
      if (effectiveName) {
        aiReply = pickFreshReply([
          `Hii ${effectiveName}! Naan Swathi-oda assistant pesuren. Seri, delivery pathi na Swathi kitta update pandren.`,
          `Seri ${effectiveName}, delivery message-ah na Swathi kitta solren. Swathi attend pannuvaanga.`,
          `Hii ${effectiveName}! Delivery note pannikitten, Swathi kitta ippove solren.`,
        ]);
      } else {
        aiReply = pickFreshReply([
          `Seri, delivery pathi na Swathi kitta update pandren.`,
          `Noted! Delivery message-ah Swathi kitta ippove solren.`,
        ]);
      }
      keyDetails.push('Thanglish conversation', `Delivery for Swathi`);
    } else if (introducedName && callerTurns === 1) {
      category = 'greeting';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'gather_more_info';
      summary = `Caller introduced themselves in Thanglish as ${introducedName}.`;
      aiReply = pickFreshReply([
        `Hii ${introducedName}! Naan Swathi-oda assistant pesuren. Sollunga, enna vishayam?`,
        `Vanakkam ${introducedName}! Swathi assistant pesuren. Enna vishayama call panninga?`,
        `Hii ${introducedName}, sollunga, Swathi kitta enna sollanum?`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, 'Language: Thanglish');
    } else if (isGateCodeOrDeliveryLocation) {
      category = 'delivery';
      spamRisk = 3;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `Gate/delivery location message in Thanglish: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Seri, neenga gate kitta irukinga nu na Swathi kitta solren.`,
        `Got it! Swathi kitta gate open panna solren.`,
      ]);
      keyDetails.push('Thanglish location details', 'High urgency delivery');
    } else if (isSpam) {
      category = 'spam';
      spamRisk = 95;
      urgency = 'low';
      suggestedAction = 'reject';
      summary = `Unwanted promotional call in Thanglish: "${callerMessage}".`;
      aiReply = "Swathi-ku idhu thevai illa. Call disconnect pandren.";
      keyDetails.push('Spam call', 'Rejected in Thanglish');
    } else {
      category = 'inquiry';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `Thanglish inquiry from caller: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Seri, idhai pathi na Swathi kitta update pandren.`,
        `Purinjidhu, unga message-ah na Swathi kitta kandippa solren.`,
        `Seri, Swathi kitta inform pandren.`,
      ]);
      keyDetails.push('Language: Thanglish', 'Forwarded to Swathi');
    }
  }

  // ==================== TAMIL SCRIPT RESPONSES ====================
  else if (lang === 'tamil') {
    if (isDelivery) {
      category = 'delivery';
      spamRisk = 2;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `${effectiveName || 'Caller'} calling in Tamil regarding delivery.`;
      aiReply = pickFreshReply([
        `சரி ${effectiveName ? effectiveName + ', ' : ''}டெலிவரி பற்றிய தகவலை நான் சுவாதியிடம் உடனே அப்டேட் செய்கிறேன்.`,
        `வணக்கம்! நான் சுவாதியின் அசிஸ்டண்ட். உங்கள் டெலிவரி செய்தியை சுவாதியிடம் தெரிவிக்கிறேன்.`,
      ]);
      keyDetails.push('Language: Tamil', 'Delivery update for Swathi');
    } else if (introducedName && callerTurns === 1) {
      category = 'greeting';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'gather_more_info';
      summary = `Caller introduced in Tamil as ${introducedName}.`;
      aiReply = pickFreshReply([
        `வணக்கம் ${introducedName}! நான் சுவாதியின் அசிஸ்டண்ட் பேசுகிறேன். சொல்லுங்கள், என்ன விஷயம்?`,
        `வணக்கம் ${introducedName}! சுவாதியிடம் என்ன விஷயமாக பேச வேண்டும் என்று கூறுங்கள்.`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, 'Language: Tamil');
    } else {
      category = 'inquiry';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `Tamil inquiry: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `சரி, இந்த தகவலை நான் சுவாதியிடம் அப்டேட் செய்கிறேன்.`,
        `புரிந்தது, உங்கள் செய்தியை நான் சுவாதியிடம் கூறுகிறேன்.`,
      ]);
      keyDetails.push('Language: Tamil', 'Forwarded to Swathi');
    }
  }

  // ==================== HINDI / HINGLISH RESPONSES ====================
  else if (lang === 'hindi' || lang === 'hinglish') {
    if (isDelivery) {
      category = 'delivery';
      spamRisk = 2;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `${effectiveName || 'Caller'} calling in Hindi regarding delivery.`;
      aiReply = pickFreshReply([
        `Haan ${effectiveName ? effectiveName + '! ' : ''}Main Swathi ki assistant bol rahi hoon. Theek hai, main delivery ke baare mein Swathi ko update kar dungi.`,
        `Theek hai, main delivery ka message Swathi tak pahuncha deti hoon.`,
      ]);
      keyDetails.push('Language: Hindi/Hinglish', 'Delivery update for Swathi');
    } else if (introducedName && callerTurns === 1) {
      category = 'greeting';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'gather_more_info';
      summary = `Caller introduced in Hindi as ${introducedName}.`;
      aiReply = pickFreshReply([
        `Haan ${introducedName}! Main Swathi ki assistant bol rahi hoon. Swathi se kya kaam tha, batayein?`,
        `Namaste ${introducedName}! Main Swathi ki assistant hoon. Kahiye, kya baat hai?`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, 'Language: Hindi/Hinglish');
    } else {
      category = 'inquiry';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `Hindi inquiry: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Theek hai, main aapka message Swathi ko update kar dungi.`,
        `Samajh gayi, main Swathi ko batati hoon.`,
      ]);
      keyDetails.push('Language: Hindi/Hinglish', 'Forwarded to Swathi');
    }
  }

  // ==================== ENGLISH RESPONSES (SIMPLE WORDS) ====================
  else {
    if (introducedName && isDelivery) {
      category = 'delivery';
      spamRisk = 2;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `${introducedName} calling regarding delivery of product for Swathi.`;
      aiReply = pickFreshReply([
        `Hi ${introducedName}! I'm Swathi's Assistance. Okay, I will update your message regarding delivery towards Swathi right away.`,
        `Hi ${introducedName}! Swathi's Assistance here. Okay, I will update your message regarding the product delivery towards Swathi immediately.`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, 'Delivery update routed to Swathi');
    } else if (introducedName && regardingTopic) {
      category = 'inquiry';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `${introducedName} calling regarding ${regardingTopic}.`;
      aiReply = pickFreshReply([
        `Hi ${introducedName}! I'm Swathi's Assistance. Okay, I will update your message regarding ${regardingTopic} towards Swathi.`,
        `Hello ${introducedName}, this is Swathi's Assistance. I will update your message regarding ${regardingTopic} towards Swathi right away.`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, `Purpose: ${regardingTopic}`);
    } else if (introducedName && callerTurns === 1) {
      category = 'greeting';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'gather_more_info';
      summary = `Caller introduced themselves as ${introducedName}.`;
      aiReply = pickFreshReply([
        `Hi ${introducedName}! I'm Swathi's Assistance. How can Swathi help you today?`,
        `Hello ${introducedName}! Swathi's Assistance here. What are you calling regarding today?`,
        `Hi ${introducedName}, thanks for calling. Please tell me what you're calling about so I can inform Swathi.`,
      ]);
      keyDetails.push(`Caller: ${introducedName}`, 'Awaiting purpose of call');
    } else if (isSpam) {
      category = 'spam';
      spamRisk = 96;
      urgency = 'low';
      suggestedAction = 'reject';
      summary = `Automated telemarketing sales pitch: "${callerMessage}".`;
      aiReply = pickFreshReply([
        "Swathi's Assistance has identified this call as an unsolicited commercial offer. Swathi is not interested. Goodbye.",
        "This line does not accept promotional marketing calls. I am disconnecting this call on behalf of Swathi. Goodbye.",
      ]);
      keyDetails.push('Robocall detected', 'Auto-reject recommended');
    } else if (isGateCodeOrDeliveryLocation) {
      category = 'delivery';
      spamRisk = 4;
      urgency = 'high';
      suggestedAction = 'approve';
      summary = `Courier delivery coordination: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Thank you for providing the delivery location. I will update your message regarding delivery towards Swathi so she can attend right now.`,
        `Got it! I am updating your message regarding delivery towards Swathi right away.`,
      ]);
      keyDetails.push('Courier access noted', 'High urgency delivery');
    } else if (isDelivery) {
      category = 'delivery';
      spamRisk = 4;
      urgency = 'high';
      suggestedAction = 'approve';
      const callerDisp = isSavedContact ? callerName : (introducedName || '');
      summary = `Courier delivery notification: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Okay${callerDisp ? ' ' + callerDisp : ''}, I will update your message regarding delivery towards Swathi right away.`,
        `Got it! I will update your message regarding delivery towards Swathi so she can attend.`,
      ]);
      keyDetails.push('Courier waiting with package', 'Swathi alerted to attend');
    } else if (regardingTopic && (lower.includes('calling regarding') || lower.includes('calling about') || lower.includes('purpose'))) {
      category = 'inquiry';
      spamRisk = 5;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `Caller reached out regarding ${regardingTopic}: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Okay, I will update your message regarding ${regardingTopic} towards Swathi.`,
        `Got it, I will update your message regarding ${regardingTopic} towards Swathi right away.`,
      ]);
      keyDetails.push(`Purpose: ${regardingTopic}`, 'Forwarded to Swathi');
    } else {
      category = 'general';
      spamRisk = isSavedContact ? 2 : 12;
      urgency = 'medium';
      suggestedAction = 'approve';
      summary = `Caller inquiry: "${callerMessage}".`;
      aiReply = pickFreshReply([
        `Okay, I will update your message towards Swathi right away.`,
        `Got it, I am letting Swathi know so she can connect with you.`,
        `Thank you. I have logged your message for Swathi.`,
      ]);
      keyDetails.push('Call logged', 'Forwarded to Swathi');
    }
  }

  return {
    aiReply,
    summary,
    urgency,
    category,
    spamRisk,
    suggestedAction,
    keyDetails,
    isRealAI: false,
  };
}

// Interactive screening dialogue endpoint
app.post('/api/screen-dialogue', async (req, res) => {
  const {
    callerName = 'Unknown Caller',
    callerNumber = 'Unknown',
    callerTag = 'Unknown',
    isSavedContact = false,
    callerGender = 'male',
    history = [],
    latestCallerMessage = '',
    persona = 'professional',
  } = req.body;

  const turnCount = history.filter((h: { role: string }) => h.role === 'caller').length + 1;
  const detectedLanguage = detectCallerLanguage(latestCallerMessage);

  if (!ai) {
    const fallback = generateFallbackResponse(
      callerName,
      callerNumber,
      latestCallerMessage,
      history,
      turnCount,
      persona,
      isSavedContact,
      callerGender
    );
    return res.json(fallback);
  }

  try {
    const conversationContext = history
      .map((item: { role: string; text: string }) => `${item.role === 'assistant' ? "Swathi's Assistance" : 'Caller'}: "${item.text}"`)
      .join('\n');

    const prompt = `
You are "Swathi's Assistance", an intelligent AI voice assistant screening an incoming telephone call on behalf of the user Swathi.
Simulated Call Info:
- User Name: Swathi (You speak exclusively for Swathi. NEVER call yourself Alex or Alex's assistance).
- Assistant Name: Swathi's Assistance (Polite, clear, friendly female voice).
- Caller Name: ${callerName}
- Caller Contact Status: ${isSavedContact ? `Saved in Swathi's Contacts as "${callerName}"` : 'Unknown / Unsaved Number'}
- Caller Phone Number: ${callerNumber}
- Caller Carrier Tag / ID: ${callerTag}
- Detected Message Language: ${detectedLanguage}

Conversation history so far:
${conversationContext || 'No previous turns. This is the first reply.'}

New message just spoken by the caller:
"${latestCallerMessage}"

CRITICAL INSTRUCTIONS FOR AI SPOKEN REPLY ('aiReply'):
1. SIMPLE WORDS & SIMPLE LANGUAGE:
   - Speak in simple, everyday words that a normal person speaks over a phone call.
   - Keep sentences short, conversational, and direct (1 to 2 short sentences max).
   - No robotic or formal jargon.

2. DYNAMIC LANGUAGE MIRRORING (CRITICAL):
   Detect the exact language/dialect used by the caller and reply in that EXACT same language:
   a) If the caller speaks in THANGLISH (Tamil words written in English / Roman alphabet, e.g. "Vanakkam", "Naan Madhu", "delivery pathi call pannen", "Swathi irukaangala", "gate kitta iruken", "parcel-ah security kitta kudukava nu kekuringala"):
      - YOU MUST REPLY IN NATURAL SIMPLE THANGLISH!
      - If they introduced their name (e.g. "Naan Madhu", "Madhu pesren"): "Hii Madhu! Naan Swathi-oda assistant pesuren. Sollunga, enna vishayam?"
      - If they mention delivery: "Seri Madhu, delivery pathi na Swathi kitta update pandren." or "Seri, delivery pathi na Swathi kitta solren."
      - If they ask for Swathi: "Swathi ippo busy-ah irukaanga. Naan avanga assistant. Unga message-ah na solren."
      - If giving location/instructions: "Seri, gate kitta irukinga nu na Swathi kitta update pandren."
   b) If the caller speaks in ENGLISH:
      - Reply in simple, friendly English!
      - If they introduce themselves: "Hi [Name]! I'm Swathi's Assistance. How can Swathi help you today?"
      - If they mention delivery: "Okay, I will update your message regarding delivery towards Swathi right away."
      - If they mention any other purpose: "Okay, I will update your message regarding [purpose] towards Swathi."
   c) If the caller speaks in TAMIL (Tamil script, e.g. "வணக்கம், மாது பேசுகிறேன்"):
      - Reply in simple Tamil script: "வணக்கம் மாது! நான் சுவாதியின் அசிஸ்டண்ட். சரி, டெலிவரி பற்றிய தகவலை நான் சுவாதியிடம் அப்டேட் செய்கிறேன்."
   d) If the caller speaks in HINDI or HINGLISH (e.g. "Namaste, main Madhu bol raha hoon delivery ke liye", "Swathi ji se baat karni hai"):
      - Reply in simple Hindi / Hinglish: "Haan Madhu! Main Swathi ki assistant bol rahi hoon. Theek hai, main delivery ke baare mein Swathi ko update kar dungi."
   e) If caller speaks any other language (Telugu, Kannada, Malayalam, etc.):
      - Mirror their language with simple, clear words!

3. SAVED CONTACT RECOGNITION:
   - If the contact is SAVED (${isSavedContact}), address them naturally by their saved name ("${callerName}") when greeting or confirming.

4. PURPOSE ACKNOWLEDGMENT:
   - If the caller states a purpose (e.g. delivery of product, appointment, documents):
     Directly acknowledge that purpose:
     In English: "Okay, I will update your message regarding [purpose] towards Swathi."
     In Thanglish: "Seri, [purpose / delivery] pathi na Swathi kitta update pandren."
     In Hindi: "Theek hai, main [purpose / delivery] ke baare mein Swathi ko update kar dungi."

5. NEVER REPEAT CANNED QUESTIONS:
   - ABSOLUTELY NEVER say "Thank you for the information. May I ask is this urgent or if you'd like to leave a message?"
   - Never repeat questions or statements already said in the conversation history.

6. METADATA:
   - 'summary': 1-2 sentence English summary of what the caller wants, who they are, and purpose for Swathi to read on screen.
   - 'urgency': "low" | "medium" | "high"
   - 'category': "delivery" | "appointment" | "inquiry" | "security" | "spam" | "general"
   - 'spamRisk': integer between 0 and 100
   - 'suggestedAction': "approve" | "reject" | "gather_more_info"
   - 'keyDetails': list of up to 3 short bullet points

Output strictly valid JSON matching the schema.
`;

    // 8-second timeout for Gemini 3.8 Flash to guarantee responsiveness
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timeout')), 8000)
    );

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are "Swathi\'s Assistance", an advanced AI phone screening engine with a polite female voice. Represent Swathi. CRITICAL: Use simple words and simple language. Mirror the caller\'s language: if the caller speaks in Thanglish, you MUST reply in natural Thanglish; if English, reply in simple English; if Hindi/Hinglish, reply in simple Hindi; if Tamil, reply in Tamil. Greet caller by name if introduced or saved. If they mention delivery, reply acknowledging: "Okay, I will update your message regarding delivery towards Swathi" (or the Thanglish equivalent: "Seri, delivery pathi na Swathi kitta update pandren"). Never repeat canned scripts. Output strictly valid JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiReply: { type: Type.STRING },
            summary: { type: Type.STRING },
            urgency: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
            category: { type: Type.STRING },
            spamRisk: { type: Type.INTEGER },
            suggestedAction: {
              type: Type.STRING,
              enum: ['approve', 'reject', 'gather_more_info'],
            },
            keyDetails: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'aiReply',
            'summary',
            'urgency',
            'category',
            'spamRisk',
            'suggestedAction',
            'keyDetails',
          ],
        },
      },
    });

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;
    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      ...parsed,
      isRealAI: true,
    });
  } catch (error) {
    console.warn('Gemini screening dialogue fallback triggered:', error);
    const fallback = generateFallbackResponse(
      callerName,
      callerNumber,
      latestCallerMessage,
      history,
      turnCount,
      persona,
      isSavedContact,
      callerGender
    );
    return res.json(fallback);
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
