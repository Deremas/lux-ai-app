# Use Case Image Briefs

These are the next asset replacements for the shared `useCases` data in `lib/marketing-content.ts`.

Current decision:
- Interim replacements are now in place in `lib/marketing-content.ts`.
- `AI Support Assistant` now uses the existing `workflow2.jpg`.
- Three downloaded web images now cover the previous weak matches for property, document processing, and internal knowledge.
- Keep the briefs below as the next upgrade path if you want more bespoke visuals later.

Recommended target files:
- `public/images/use-case-property-enquiry-viewing.jpg`
- `public/images/use-case-document-invoice-processing.jpg`
- `public/images/use-case-internal-knowledge-assistant.jpg`

Shared art direction:
- Create landscape images that still crop well in tall cards.
- Target at least `1600x1200`.
- Keep the focal content centered with safe margins on all sides.
- Match the site's visual language: clean, premium, business-focused, realistic UI/product scene, navy/blue/neutral palette.
- Avoid stock-photo poses, handshake scenes, generic team meetings, neon sci-fi effects, and abstract tech art with no workflow cues.

## Property Enquiry and Viewing Coordination

Goal:
- Make it immediately clear that this is real-estate enquiry handling plus viewing coordination, not generic AI chat.

Must-show cues:
- Property listing cards or listing thumbnails.
- Enquiry/chat panel with buyer or tenant questions.
- Viewing calendar or booking slots.
- Optional location or map cue.
- Agent coordination or routed follow-up feel.

Avoid:
- Generic chatbot-only interface.
- Residential lifestyle photography with no workflow UI.
- Empty CRM tables with no property context.

Prompt:

```text
Create a premium business workflow illustration for a real-estate automation use case. Show a modern desktop SaaS interface with property listing cards, buyer or tenant enquiry chat, viewing scheduling calendar, and subtle map or location cues. The scene should communicate property enquiries being triaged and viewings being coordinated automatically. Use a clean navy, blue, white, and soft neutral palette with realistic product UI styling, crisp lighting, and clear workflow detail. Keep the composition landscape, center-weighted, and crop-safe for web cards. Avoid stock-photo people, generic chatbot screens, futuristic neon effects, and empty dashboard tables with no property context.
```

## Document and Invoice Processing

Goal:
- Make document extraction, OCR, validation, and routing obvious at a glance.

Must-show cues:
- Invoice or document preview.
- Extracted fields or OCR overlays.
- Validation or approval state.
- Structured business data moving into a workflow.

Avoid:
- Consulting workshop scenes.
- People in meetings.
- Pure spreadsheets with no document-processing context.

Prompt:

```text
Create a premium workflow visual for document and invoice processing automation. Show a modern operations interface with invoice and document previews, extracted fields, OCR or data-capture highlights, validation checks, approval states, and routing into accounting or ERP-style workflow panels. The image should feel practical and business-ready, with crisp UI detail, realistic lighting, and a navy, blue, white, and neutral palette. Keep the composition landscape, centered, and crop-safe for marketing cards. Avoid meeting-room photography, generic consulting scenes, abstract tech graphics, and plain spreadsheet screens without document cues.
```

## Internal Knowledge Assistant

Goal:
- Show secure internal search and answer retrieval, not an external customer support bot and not a team/about photo.

Must-show cues:
- Internal assistant or enterprise search/chat panel.
- Document snippets, policy cards, or knowledge results.
- Secure or permission-aware feel.
- Internal operations context.

Avoid:
- Team portraits.
- Public website chat widgets as the main visual.
- Consumer-style AI art.

Prompt:

```text
Create a premium enterprise knowledge-assistant visual for an internal operations use case. Show a secure internal search and chat interface with document snippets, policy results, knowledge cards, and subtle permission or access-control cues. The scene should feel like employees are getting trusted internal answers from approved company knowledge, not customer support or public website chat. Use a refined navy, blue, white, and neutral palette with realistic SaaS UI detail, soft depth, and clean composition. Keep it landscape, center-focused, and crop-safe for web cards. Avoid team-photo imagery, consumer chatbot aesthetics, neon sci-fi styling, and generic dashboards with no knowledge context.
```

Follow-up after these assets land:
- Update the three matching `image` values in `lib/marketing-content.ts`.
- Reassess `AI Support Assistant` later only if you want a more brand-matched dedicated support-assistant visual than `workflow2.jpg`.
