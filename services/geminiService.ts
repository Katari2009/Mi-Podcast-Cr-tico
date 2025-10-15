
export const generateScript = async (topic: string, keyPoints: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, keyPoints }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Ocurrió un error en el servidor." }));
        throw new Error(errorData.error || `Error ${response.status}: No se pudo generar el guion.`);
    }

    const data = await response.json();
    if (!data.script) {
        throw new Error("La respuesta del servidor no contenía un guion.");
    }
    return data.script;

  } catch (error: any) {
    console.error("Error fetching script from backend:", error);
    // Re-lanzar un mensaje de error amigable para el usuario
    throw new Error(error.message || "Ocurrió un error al comunicarse con el servidor. Inténtalo más tarde.");
  }
};
