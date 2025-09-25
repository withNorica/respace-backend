/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Helper function to convert a File object to a Gemini API Part
const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    
    const mimeType = mimeMatch[1];
    const data = arr[1];
    return { inlineData: { mimeType, data } };
};


export const generateDesign = async (
    roomImage: File,
    imageGenerationPrompt: string,
    textGenerationPrompt: string,
): Promise<{ imageUrl: string; suggestions: string; }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

    const roomImagePart = await fileToPart(roomImage);

    // --- Promise for Image Generation ---
    const imagePromise = (async () => {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    roomImagePart,
                    { text: imageGenerationPrompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        const imagePartFromResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
        if (imagePartFromResponse?.inlineData) {
            const { mimeType, data } = imagePartFromResponse.inlineData;
            return `data:${mimeType};base64,${data}`;
        }
        throw new Error("The AI model did not return a redesigned image.");
    })();

    // --- Promise for Text Suggestions ---
    const textPromise = (async () => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: textGenerationPrompt }, roomImagePart] }
        });
        return response.text;
    })();

    // --- Await both promises concurrently ---
    try {
        const [imageUrl, suggestions] = await Promise.all([imagePromise, textPromise]);
        
        if (!imageUrl || !suggestions) {
            throw new Error("Failed to generate complete design ideas.");
        }

        return { imageUrl, suggestions };
    } catch (error) {
        console.error("Error during AI design generation:", error);
        if (error instanceof Error) {
            throw new Error(`An error occurred while generating the design: ${error.message}`);
        }
        throw new Error("An unknown error occurred during AI design generation.");
    }
};