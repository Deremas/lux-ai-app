import sanitizeHtml from "sanitize-html";

export function sanitizeRichText(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [
      "b",
      "i",
      "em",
      "strong",
      "p",
      "br",
      "ul",
      "ol",
      "li",
    ],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  });
}
