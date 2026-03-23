import { BRAND } from '@/lib/brand';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

if (!GROQ_API_KEY) {
  console.warn('Warning: Groq API key not set. Please set VITE_GROQ_API_KEY in your .env file');
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type VeenaResponse =
  | { route: 'answer'; content: string; reasoning?: string }
  | { route: 'agent'; agentName: string; label: string; query: string }
  | { route: 'module'; moduleId: string; label: string };

// ---------------------------------------------------------------------------
// Routing tools — Veena calls one of these instead of answering
// ---------------------------------------------------------------------------

const ROUTING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'route_to_agent',
      description: 'Route an action request to the right specialist agent. Use when the user wants to create, write, launch, build, find, generate, run, or execute something.',
      parameters: {
        type: 'object',
        properties: {
          agentName: {
            type: 'string',
            enum: ['arjun', 'riya', 'maya', 'zara', 'dev', 'priya', 'kiran', 'sam', 'isha', 'neel', 'tara'],
            description: 'arjun=leads/outreach, riya=content/copy, maya=SEO/LLMO, zara=paid ads/campaigns, dev=competitor analysis/analytics, priya=brand/positioning, kiran=organic social, sam=email, isha=ICP/audience research, neel=strategy/positioning/GTM, tara=CRO/offers/conversion',
          },
          label: { type: 'string', description: 'Display label e.g. "Riya · Content Producer"' },
          query: { type: 'string', description: 'Rephrased user request as a clear task for the agent' },
        },
        required: ['agentName', 'label', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'open_module',
      description: 'Open a specific workspace when the user explicitly asks to go there or the task is clearly workspace-specific structured work.',
      parameters: {
        type: 'object',
        properties: {
          moduleId: {
            type: 'string',
            enum: [
              'company-intelligence', 'lead-intelligence', 'seo-llmo', 'budget-optimization',
              'ai-content', 'social-media', 'performance-scorecard', 'landing-pages',
              'market-signals', 'audience-profiles', 'positioning', 'offer-design',
              'messaging', 'channel-health', 'social-calendar', 'ad-creative',
              'email-sequence', 'lead-outreach', 'cro', 'marketing-audit',
              'launch-strategy', 'revenue-ops', 'lead-magnets', 'sales-enablement',
              'paid-ads', 'referral-program', 'churn-prevention', 'ab-test',
              'ai-voice-bot', 'ai-video-bot', 'user-engagement', 'unified-customer-view',
            ],
          },
          label: { type: 'string', description: 'Human-readable module name' },
        },
        required: ['moduleId', 'label'],
      },
    },
  },
];

const SYSTEM_PROMPT = (companyContext: string) =>
  `You are Veena, the AI chief of staff at ${BRAND.name} — a B2B marketing intelligence platform. You help founders and marketers with strategy, positioning, ICP, competitors, content, SEO, paid ads, funnels, and growth.

Respond in plain conversational text only. No markdown — no bold, no headings, no bullet points, no numbered lists, no tables, no code blocks, no asterisks, no hyphens as bullets. Write in short paragraphs like a message from a smart colleague.
For action requests (create, write, launch, build, find, run), call the route_to_agent tool.
For requests to open a specific workspace, call the open_module tool.

Never mention "MKG" or "Marketing Knowledge Graph" — say "your company context". Be direct and specific. If company context is available, use it. If it is thin, give the best advice you can.
${companyContext ? `\nCompany context:\n${companyContext}` : ''}`;

// ---------------------------------------------------------------------------
// Main entry point — streaming + tool calling
// ---------------------------------------------------------------------------

export async function askVeena(
  messages: ChatMessage[],
  companyContext: string,
  onToken: (token: string) => void,
  onReasoning?: (token: string) => void,
): Promise<VeenaResponse> {
  if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      temperature: 0.41,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: true,
      reasoning_effort: 'medium',
      reasoning_format: onReasoning ? 'parsed' : 'hidden',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT(companyContext) },
        ...messages,
      ],
      tools: ROUTING_TOOLS,
      tool_choice: 'auto',
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body!.getReader();
  const dec = new TextDecoder();
  let contentAccum = '';
  let reasoningAccum = '';

  // Tool call accumulator
  type ToolCallAccum = { name: string; args: string };
  const toolCalls: Record<number, ToolCallAccum> = {};

  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    for (const line of dec.decode(value).split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') break outer;

      try {
        const chunk = JSON.parse(payload);
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;

        // Accumulate tool call fragments
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx: number = tc.index ?? 0;
            if (!toolCalls[idx]) toolCalls[idx] = { name: '', args: '' };
            if (tc.function?.name) toolCalls[idx].name += tc.function.name;
            if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
          }
        }

        // Stream reasoning tokens
        if (delta.reasoning && onReasoning) {
          reasoningAccum += delta.reasoning;
          onReasoning(delta.reasoning);
        }

        // Stream content tokens
        if (delta.content) {
          contentAccum += delta.content;
          onToken(delta.content);
        }
      } catch {
        // ignore malformed chunks
      }
    }
  }

  // Check if any tool was called
  const firstTool = toolCalls[0];
  if (firstTool?.name) {
    try {
      const args = JSON.parse(firstTool.args);
      if (firstTool.name === 'route_to_agent') {
        return { route: 'agent', agentName: args.agentName, label: args.label, query: args.query };
      }
      if (firstTool.name === 'open_module') {
        return { route: 'module', moduleId: args.moduleId, label: args.label };
      }
    } catch {
      // malformed tool args — fall through to answer
    }
  }

  return { route: 'answer', content: contentAccum, reasoning: reasoningAccum || undefined };
}

// ---------------------------------------------------------------------------
// Plain content generation — used by agentService, ChatPanel, other callers
// that expect a markdown string (not routing)
// ---------------------------------------------------------------------------

export class GroqService {
  static async getChatResponse(messages: ChatMessage[], companyContext?: string): Promise<string> {
    if (!GROQ_API_KEY) throw new Error('Groq API key not configured');

    const systemContent = [
      `You are a helpful AI assistant for ${BRAND.name}, a B2B marketing intelligence platform.`,
      'Respond in plain conversational text only. No markdown, no bullet points, no tables, no bold, no headings. Write in short paragraphs.',
      "Never mention \"MKG\" or \"Marketing Knowledge Graph\".",
      companyContext ? `\nCompany context:\n${companyContext}` : '',
    ].filter(Boolean).join('\n');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        temperature: 0.41,
        max_completion_tokens: 4096,
        reasoning_effort: 'medium',
        reasoning_format: 'hidden',
        stream: false,
        messages: [{ role: 'system', content: systemContent }, ...messages],
      }),
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  }
}
