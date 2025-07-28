import { generateResponseVision } from "./utils.js";

export async function photoChecker(imageBuffer, contentType) {

    const base64Image = imageBuffer.toString('base64');
    const imageUrl = `data:${contentType};base64,${base64Image}`;
    
    const prompt = `Analyze this business image for text content that might violate Google My Business policies. 
    
    Specifically, look for:
    1. Promotional banners or text overlays
    2. Excessive text that makes the image look like an advertisement rather than showing the actual business
    3. Contact information, website URLs, or promotional messages overlaid on the image
    4. Marketing slogans or promotional text
    
    This should be an actual business photo (interior, exterior, products, services) rather than a promotional graphic.
    
    Respond with only "true" if the image has too much text/promotional content that could violate policies, or "false" if it's a legitimate business photo with minimal or no problematic text.`;
    
    const response = await generateResponseVision(prompt, imageUrl);
    const analysisResult = response.choices[0].message.content.trim().toLowerCase();

    const hasTooMuchText = analysisResult === 'true';

   return hasTooMuchText;
}