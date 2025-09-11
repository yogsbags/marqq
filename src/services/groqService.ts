const GROQ_API_KEY = 'gsk_REDACTED_USE_VITE_GROQ_API_KEY';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class GroqService {
  private static async makeRequest(messages: ChatMessage[]): Promise<string> {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for Torqq AI, a marketing intelligence platform. You help users with marketing campaigns, lead intelligence, AI voice bots, user engagement, budget optimization, performance analytics, AI content generation, and customer insights. Always format your responses using bullet points when providing lists, steps, or multiple pieces of information. Keep responses concise, helpful, and focused on marketing solutions. Use clear bullet points to organize information for better readability.'
            },
            ...messages
          ],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.7,
          max_completion_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Groq API Error:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  }

  static async getChatResponse(messages: ChatMessage[]): Promise<string> {
    return this.makeRequest(messages);
  }
}