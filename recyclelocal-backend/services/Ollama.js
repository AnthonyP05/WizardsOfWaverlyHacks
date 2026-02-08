import { Ollama } from 'ollama';
import * as fs from 'fs';


const ollama = new Ollama({ host: 'https://3061-198-137-18-62.ngrok-free.app/' });

// const response = await ollama.generate({
//   model: 'llava:13b',
//   prompt: 'Generate a JSON object with keys "name" and "age" for a person named John Doe.',
//   format: 'json' // Specify the desired output format
// });

// Function to convert a local file to a base64 string
function imageToBase64(filePath) {
    const imageBytes = fs.readFileSync(filePath);
    return imageBytes.toString('base64');
}

// Specify the absolute path to your image
const imagePath = '/Users/adamshavkin/Downloads/dino.jpeg'; // Update this path to your image file
const base64Image = imageToBase64(imagePath);

async function generateWithImage() {
    try {
        const response = await ollama.chat({
            model: 'llava:13b', // Use a multimodal model
            messages: [
                {
                    role: 'user',
                    content: ' Each image analysis is independent. Ignore all previous images and answers. You are an image recognition assistant for a recycling application. When given an image: - Identify the primary item visible (Include brand name when deciding what item it is) - Use a specific name for the item - Use a specific name for the materials the item is composed of (only if it\'s a recyclable material, otherwise, list as non-recyclable) - Prefer recycling-relevant terms Analyze the image and respond in JSON only: { \"item\": \"\", \"brand\": \"\", \"material\": \"\", \"confidence\": \"high | medium | low\" } Rules: - Only name a brand if clearly visible - Do not guess - If unsure, set fields to null or \"unknown\" - Do not include explanations or additional text. If the item cannot be confidently identified, set confidence to low',
                    // Provide the base64-encoded image in an array
                    images: [base64Image] 
                }
            ],
            stream: false, // Set to true for streaming responses
        });

        console.log("Response:", response.message.content);

    } catch (error) {
        console.error("Error generating response with image:", error);
    }
}

generateWithImage();

