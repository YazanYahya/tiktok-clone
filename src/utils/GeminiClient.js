import {GoogleGenerativeAI} from "@google/generative-ai";
import {VertexAI} from "@google-cloud/vertexai";
import {INTERESTS} from "@/constants/interests";


const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const vertexAI = new VertexAI({project: 'hardy-being-449120-m7', location: 'us-central1'});

export async function embedText(text) {
    try {
        const model = geminiClient.getGenerativeModel({model: 'text-embedding-004'});
        const response = await model.embedContent(text);

        if (!response || !response.embedding || !response.embedding.values) {
            throw new Error('No embedding data returned.');
        }

        return response.embedding.values;
    } catch (error) {
        console.error('Error embedding text with Gemini model:', error.message || error);
        throw new Error(error.message);
    }
}

export async function analyzeVideoContent(fileUrl) {
    try {
        const generativeModel = vertexAI.getGenerativeModel({
            model: 'gemini-1.5-flash-001',
        });

        const filePart = {
            file_data: {
                file_uri: fileUrl,
                mime_type: 'video/mp4',
            },
        };
        const textPart = {
            text: `Provide a detailed summary of the video, including important dialogues and key points. 
            Additionally, analyze the video content and determine which of the following interests it relates to: 
            ${INTERESTS.join(", ")}. Return the response in JSON format with two fields: 
            "summary" (a detailed text summary of the video) and "interests" (an array of matching interests from the list).`,
        };

        const request = {
            contents: [{role: 'user', parts: [filePart, textPart]}],
        };

        const result = await generativeModel.generateContent(request);
        const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
        return JSON.parse(responseText);
    } catch (error) {
        console.error('Error summarizing video with Gemini model:', error.message || error);
        throw new Error(error.message);
    }
}

export async function getVideoSummary(fileBuffer) {
    try {
        const model = geminiClient.getGenerativeModel({model: 'gemini-1.5-flash-latest'});
        const base64Data = Buffer.from(fileBuffer).toString('base64');
        const filePart = {
            inline_data: {
                data: base64Data,
                mime_type: 'video/mp4',
            },
        };
        const textPart = {
            text: `Provide a description of the video. The description should also contain anything important which people say in the video.`,
        };

        const request = {
            contents: [{role: 'user', parts: [filePart, textPart]}],
        };

        const result = await model.generateContent(request);
        return result.response.text();
    } catch (error) {
        console.error('Error summarizing video with Gemini model:', error.message || error);
        throw new Error(error.message);
    }
}

export default geminiClient;