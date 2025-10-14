
import { GoogleGenAI } from "@google/genai";

export const generateScript = async (topic: string, keyPoints: string): Promise<string> => {
  try {
    // FIX: The API key must be obtained exclusively from process.env.API_KEY as per the coding guidelines.
    // This also resolves the TypeScript error "Property 'env' does not exist on type 'ImportMeta'".
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Eres un guionista experto para podcasts de análisis crítico dirigidos a estudiantes.
      Tu tarea es crear un guion atractivo y bien estructurado para un episodio de podcast.

      Tema del Podcast: "${topic}"

      Puntos Clave a Cubrir:
      ${keyPoints}

      Instrucciones del Guion:
      1.  **Introducción:** Comienza con un gancho atractivo para captar la atención del oyente. Presenta el tema y lo que se discutirá.
      2.  **Desarrollo:** Desarrolla los puntos clave de manera lógica. Usa un lenguaje claro y accesible, pero que invite a la reflexión crítica. Puedes incluir preguntas retóricas para involucrar al oyente.
      3.  **Transiciones:** Asegúrate de que las transiciones entre los puntos sean suaves.
      4.  **Conclusión:** Resume los puntos principales y ofrece una conclusión o una pregunta final que deje al oyente pensando.
      5.  **Formato:** Estructura el guion con marcadores claros como [INTRO], [MÚSICA DE TRANSICIÓN], [DESARROLLO], [CONCLUSIÓN], [OUTRO]. Incluye también indicaciones de tono o pausas (ej. [PAUSA BREVE]). No uses markdown.

      Genera el guion ahora.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error: any) {
    console.error("Error in generateScript:", error);
    // FIX: Updated error handling to align with the change to process.env.API_KEY and provide a more helpful message.
    if (error.message?.includes('API key') || error.message?.includes('API Key')) {
        throw new Error("The Gemini API key is not configured correctly or is invalid. Please check your 'API_KEY' environment variable.");
    }
    // Error genérico para otros casos
    throw new Error("Ocurrió un error al comunicarse con la IA. Inténtalo más tarde.");
  }
};
