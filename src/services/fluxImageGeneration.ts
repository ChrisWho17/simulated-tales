// FLUX.1 Schnell via Together.ai - Direct client-side implementation
const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

export async function generatePortraitWithFlux(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_TOGETHER_API_KEY;
  
  if (!apiKey) {
    throw new Error('Together API key not configured');
  }
  
  const response = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-schnell',
      prompt: prompt,
      width: 768,
      height: 1024,
      steps: 4,
      n: 1,
      response_format: 'url',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Together API error: ${error.error?.message || response.status}`);
  }
  
  const result = await response.json();
  return result.data[0].url;
}
