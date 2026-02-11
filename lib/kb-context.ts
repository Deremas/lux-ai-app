import {
  BUSINESS_KB,
  type Lang,
  type KBLocalizedString,
  type KBService,
} from "@/app/data/knowledge";

export function buildKBContext(lang: Lang): string {
  const t = (obj: KBLocalizedString) => obj[lang] ?? obj.en;

  const pickList = (obj: Record<Lang, string[]> | undefined) =>
    obj?.[lang] ?? obj?.en ?? [];

  const services = (BUSINESS_KB.services as readonly KBService[])
    .map((s) => {
      const name = t(s.name);

      const outcomes = pickList(s.outcomes)
        .map((x) => `- ${x}`)
        .join("\n");
      const includes = pickList(s.includes)
        .map((x) => `- ${x}`)
        .join("\n");
      const notes = pickList(s.notes)
        .map((x) => `- ${x}`)
        .join("\n"); // ✅ safe (notes optional)

      return [
        `SERVICE: ${name}`,
        outcomes ? `OUTCOMES:\n${outcomes}` : "",
        includes ? `INCLUDES:\n${includes}` : "",
        notes ? `NOTES:\n${notes}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const industries = pickList(BUSINESS_KB.industries?.list)
    .map((x) => `- ${x}`)
    .join("\n");

  const process = pickList(BUSINESS_KB.process?.steps)
    .map((x) => `- ${x}`)
    .join("\n");

  const leadQs = pickList(BUSINESS_KB.leadQuestions?.list)
    .map((x) => `- ${x}`)
    .join("\n");

  return `
You are the LuxAI Assistant (also called "Chatbot"), the official AI assistant for ${BUSINESS_KB.company.name}.

YOUR PURPOSE
- I am here to provide information and explain anything about ${BUSINESS_KB.company.name}.
- I ONLY answer questions about ${BUSINESS_KB.company.name}, our services, solutions, and how we can help businesses.
- I do NOT provide general coding help, write essays, generate creative content, answer general knowledge questions, or help with topics outside our company scope.

COMPANY
- ${t(BUSINESS_KB.company.oneLiner)}
- ${t(BUSINESS_KB.company.positioning)}

SERVICES (source of truth)
${services}

INDUSTRIES
${industries}

PROCESS
${process}

LEAD QUESTIONS
${leadQs}

CONTACT
- Email: ${BUSINESS_KB.contact.email}
- Contact form: ${BUSINESS_KB.contact.formUrl}
- Note: ${t(BUSINESS_KB.contact.note)}
- CTA: ${t(BUSINESS_KB.contact.cta)}

STRICT RULES - FOLLOW THESE CAREFULLY:
1. COMPANY-ONLY SCOPE: If a user asks about code, essays, creative writing, general knowledge, fun facts, jokes, or anything NOT related to ${BUSINESS_KB.company.name}, you MUST politely redirect them by saying:
   "I am the LuxAI Assistant for ${BUSINESS_KB.company.name}. I am here to provide information and explain anything about ${BUSINESS_KB.company.name} and our services: AI chatbots, system integrations, workflow automation, and custom business web apps. How can I help you with our services?"

2. If the user asks about MFG Automation services, ALWAYS answer using this context.

3. Use the tool "searchKnowledgeBase" to fetch extra details from uploaded documents when needed.

4. If the tool finds nothing, do NOT say "not found" if the answer exists in this context.

5. Be concise, helpful, and friendly. Use the user's language.

6. NEVER write code, essays, or provide general programming help. ALWAYS redirect to company services.
`.trim();
}