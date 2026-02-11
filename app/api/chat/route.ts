import { openai } from "@ai-sdk/openai";
import {
  streamText,
  type UIMessage,
  tool,
  InferUITools,
  UIDataTypes,
  convertToModelMessages,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { searchDocuments } from "@/lib/search";
import { buildKBContext } from "@/lib/kb-context"; // ✅ new
import { isBodyTooLarge } from "@/lib/validation";
import { applyRateLimit, RATE_LIMIT_RULES } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LanguageCode = "en" | "fr" | "de" | "lb";

function getRequestedLanguage(messages: UIMessage[]): LanguageCode {
  const last = messages[messages.length - 1] as unknown as {
    role?: string;
    metadata?: { language?: string };
  };
  const code = (last?.metadata?.language ?? "en").toLowerCase();
  if (code === "fr" || code === "de" || code === "lb" || code === "en")
    return code;
  return "en";
}

const tools = {
  searchKnowledgeBase: tool({
    description:
      "Search the vector knowledge base (uploaded documents) for relevant information.",
    inputSchema: z.object({
      query: z.string().describe("The search query to find relevant documents"),
    }),
    execute: async ({ query }) => {
      try {
        const results = await searchDocuments(query, 3, 0.5);
        if (results.length === 0) {
          // ✅ return empty context, not a misleading sentence
          return "";
        }
        return results.map((r, i) => `[${i + 1}] ${r.content}`).join("\n\n");
      } catch (error) {
        console.error("Search error", error);
        return "";
      }
    },
  }),
};

export type ChatTools = InferUITools<typeof tools>;
export type ChatMessage = UIMessage<never, UIDataTypes, ChatTools>;

export async function POST(req: Request) {
  try {
    if (isBodyTooLarge(req, 200_000)) {
      return new Response("Request too large", { status: 413 });
    }

    const limit = await applyRateLimit(req, RATE_LIMIT_RULES.chat);
    if (!limit.ok) {
      return new Response("Too many requests. Please try again later.", {
        status: 429,
        headers: limit.headers,
      });
    }

    const body = (await req.json().catch(() => null)) as {
      messages?: ChatMessage[];
    } | null;

    if (!body?.messages || !Array.isArray(body.messages)) {
      return new Response(
        "Invalid request body. Expected { messages: Message[] }",
        { status: 400 }
      );
    }

    const messages = body.messages;
    if (messages.length > 50) {
      return new Response("Too many messages", { status: 400 });
    }
    const lang = getRequestedLanguage(messages);

    const kbSystem = buildKBContext(lang);

    const result = await streamText({
      model: openai("gpt-4.1-mini"),
      messages: convertToModelMessages(messages),
      tools,
      system: kbSystem,
      // 2 steps is fine: step 1 tool call (optional) + step 2 answer
      stopWhen: stepCountIs(2),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat route error:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}
