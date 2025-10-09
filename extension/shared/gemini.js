import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory
} from '@google/generative-ai';

const apiKey = 'AIzaSyAVG_uJrEm5mtCgajxTMtOIdz6O96HCLHM'; // Replace with your actual key or inject securely

let genAI = null;
let model = null;

function initModel(generationConfig = { temperature: 1 }) {
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ];
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
    generationConfig
  });
  return model;
}

export async function geminiTranscribeFile(file, prompt = 'Generate a transcript of the speech.') {
  try {
    if (!model) initModel();
    const arrayBuffer = await file.arrayBuffer();
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [
          { inlineData: { data: arrayBuffer, mimeType: file.type || 'audio/mpeg' } },
          { text: prompt }
        ]}
      ]
    });
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error('Gemini transcription error:', err);
    throw err;
  }
}
