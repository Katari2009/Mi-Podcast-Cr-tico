import { GoogleGenAI } from "@google/genai";

// Lazily initialize 'ai' to prevent the app from crashing on load if the API key is missing.
// The check will be performed when the AI functionality is actually used.
let ai: GoogleGenAI | null = null;

export const isApiKeyAvailable = (): boolean => {
    const apiKey = process.env.API_KEY;
    return !!apiKey;
};

const getAiInstance = () => {
    if (!ai) {
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            // This specific error message will be displayed in the UI, guiding the user.
            throw new Error("La clave de API (API_KEY) no está configurada en el entorno de despliegue.");
        }
        ai = new GoogleGenAI({ apiKey });
    }
    return ai;
};

export const generateScript = async (topic: string, keyPoints: string): Promise<string> => {
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

  try {
    const gemini = getAiInstance(); // This will throw if API_KEY is missing
    const response = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error generating script with Gemini API:", error);
    // Re-throw the original error to be handled by the UI component's catch block.
    // This preserves specific error messages (like the missing API key).
    throw error;
  }
};