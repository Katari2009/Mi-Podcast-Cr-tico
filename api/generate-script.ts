
import { GoogleGenAI } from "@google/genai";

// Estos tipos son marcadores de posición para los objetos de solicitud/respuesta de un framework específico.
// Por ejemplo, para Next.js: import type { NextApiRequest, NextApiResponse } from 'next'
interface ApiRequest {
  method?: string;
  body: {
    topic: string;
    keyPoints: string;
  };
}

interface ApiResponse {
  status: (statusCode: number) => {
    json: (body: any) => void;
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Un entorno como Vercel/Next.js proporcionaría el método en el objeto de solicitud.
  // Lo verificamos para asegurarnos de que solo manejamos solicitudes POST.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const { topic, keyPoints } = req.body;

  if (!topic || !keyPoints || typeof topic !== 'string' || typeof keyPoints !== 'string') {
    return res.status(400).json({ error: 'El tema y los puntos clave son obligatorios.' });
  }

  try {
    // IMPORTANTE: La clave API se lee de las variables de entorno del lado del servidor
    // y no se expone al cliente.
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

    res.status(200).json({ script: response.text });

  } catch (error: any) {
    console.error("Error in generateScript backend:", error);
    if (error.message?.includes('API key') || error.message?.includes('API Key')) {
        return res.status(500).json({ error: "La clave de API para el servicio de IA no está configurada correctamente en el servidor." });
    }
    res.status(500).json({ error: "Ocurrió un error en el servidor al generar el guion." });
  }
}
