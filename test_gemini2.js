require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const models = ["gemini-1.5-flash-latest", "gemini-flash-latest", "gemini-pro", "gemini-1.5-flash"];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Olá, teste.");
      console.log(`Success with ${m}:`, result.response.text());
      return;
    } catch (err) {
      console.error(`Error with ${m}:`, err.message);
    }
  }
}
testGemini();
