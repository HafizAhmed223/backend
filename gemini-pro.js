// import dotenv from "dotenv"; // Import dotenv for environment variables
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Import GoogleGenerativeAI class

// dotenv.config(); // Load environment variables from .env file

// const genAI = new GoogleGenerativeAI(process.env.API_KEY); // Create GoogleGenerativeAI instance with API key

// async function run() {
//     const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Get the Gemini-Pro model

//     const prompt = "write a sonnet about programmer life, but also make it rhyme"; // Set the prompt

//     const result = await model.generateContent(prompt); // Use generateContent (corrected spelling)

//     const response = await result.response;
//     const text = response.text();
//     console.log(text); // Log the generated text
// }

// run(); // Call the run function
