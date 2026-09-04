export type StorySection = {
  id: string;
  heading: string;
  body: string;
};

export type StorybookDraft = {
  title: string;
  subtitle: string;
  dedication: string;
  languageNote: string;
  sections: StorySection[];
  closingNote: string;
  transcript: string;
  illustrationBrief: string;
  stampSubject: string;
  stampMotifs: string[];
  photoCaptions: string[];
};

export type IntakePayload = {
  accessKey: string;
  buyerName: string;
  email: string;
  elderName: string;
  relationship: string;
  originPlace: string;
  languageMix: string;
  preserveWords: string;
  dedication: string;
  paymentReference: string;
  notes: string;
};

export const interviewPrompts = [
  "Where did you grow up, and what did the place feel like?",
  "What did you do for fun when you were young?",
  "Who was the person who understood you best as a child?",
  "What food or smell immediately takes you back home?",
  "What is one story your family always told about you?",
  "What was your first job, and what did it teach you?",
  "How did you meet the person you loved or married?",
  "What was a difficult moment that made you stronger?",
  "Which family tradition do you hope continues?",
  "What is one photograph or object you wish I knew more about?",
  "What are you most proud of?",
  "What would you like me to remember about you?"
];

const fallbackSections: StorySection[] = [
  {
    id: "place",
    heading: "Where the Story Begins",
    body: "This opening page preserves the place, weather, streets, people, and everyday rhythms that shaped the elder's early life."
  },
  {
    id: "home",
    heading: "The Smell of Home",
    body: "Food, festivals, familiar voices, and small family rituals become the doorway into memories that younger family members can hold on to."
  },
  {
    id: "lesson",
    heading: "What Life Taught Me",
    body: "The story closes around one hard-won lesson, one source of pride, and one memory the elder wants the family to carry forward."
  }
];

export function emptyDraft(): StorybookDraft {
  return {
    title: "",
    subtitle: "",
    dedication: "",
    languageNote: "",
    sections: [],
    closingNote: "",
    transcript: "",
    illustrationBrief: "",
    stampSubject: "",
    stampMotifs: [],
    photoCaptions: []
  };
}

export function demoDraft(input: Partial<IntakePayload> = {}): StorybookDraft {
  const elderName = input.elderName || "Amma";
  const relationship = input.relationship || "grandparent";
  const originPlace = input.originPlace || "home";

  return {
    title: `${elderName}'s Story`,
    subtitle: `A keepsake from ${originPlace}`,
    dedication:
      input.dedication ||
      `For the children and grandchildren who should know the voice, places, and lessons behind their ${relationship}.`,
    languageNote:
      input.languageMix ||
      "Generated from the uploaded interview. Please review family names, places, and mixed-language phrases before exporting.",
    sections: fallbackSections.map((section) => ({
      ...section,
      body: section.body.replace("the elder", elderName)
    })),
    closingNote: `What ${elderName} wants remembered is not only the facts of a life, but the feeling of belonging to a family story.`,
    transcript:
      "Demo transcript placeholder. Add OPENAI_API_KEY to generate a real transcript from the uploaded audio.",
    illustrationBrief: `A small rubber-stamp field note of ${originPlace}, using only a market arch, a coffee tumbler, a winding lane, and a family doorway on aged paper.`,
    stampSubject: `${originPlace} family memory`,
    stampMotifs: ["market arch", "filter coffee tumbler", "winding lane", "family doorway"],
    photoCaptions: [
      `${elderName} and the people who make this story worth saving.`,
      `A place, object, or face that brings the memory back.`,
      `A family photograph to sit beside the story.`
    ]
  };
}

export function normalizeDraft(value: unknown, input: Partial<IntakePayload> = {}): StorybookDraft {
  if (!value || typeof value !== "object") {
    return demoDraft(input);
  }

  const source = value as Partial<StorybookDraft>;
  const fallback = demoDraft(input);
  const rawSections = Array.isArray(source.sections) ? source.sections : fallback.sections;
  const sections = rawSections.slice(0, 5).map((section, index) => ({
    id: typeof section.id === "string" && section.id ? section.id : `section-${index + 1}`,
    heading:
      typeof section.heading === "string" && section.heading.trim()
        ? section.heading.trim()
        : fallback.sections[index]?.heading || `Memory ${index + 1}`,
    body:
      typeof section.body === "string" && section.body.trim()
        ? section.body.trim()
        : fallback.sections[index]?.body || ""
  }));

  return {
    title: stringOr(source.title, fallback.title),
    subtitle: stringOr(source.subtitle, fallback.subtitle),
    dedication: stringOr(source.dedication, fallback.dedication),
    languageNote: stringOr(source.languageNote, fallback.languageNote),
    sections: sections.length ? sections : fallback.sections,
    closingNote: stringOr(source.closingNote, fallback.closingNote),
    transcript: stringOr(source.transcript, fallback.transcript),
    illustrationBrief: stringOr(source.illustrationBrief, fallback.illustrationBrief),
    stampSubject: stringOr(source.stampSubject, fallback.stampSubject),
    stampMotifs: Array.isArray(source.stampMotifs)
      ? source.stampMotifs.map((motif) => String(motif)).slice(0, 6)
      : fallback.stampMotifs,
    photoCaptions: Array.isArray(source.photoCaptions)
      ? source.photoCaptions.map((caption) => String(caption)).slice(0, 3)
      : fallback.photoCaptions
  };
}

export function buildStoryPrompt(input: IntakePayload, transcript: string) {
  return `
Create a short keepsake storybook from a family interview transcript.

Audience:
- A child or younger family member reading about ${input.elderName}, their ${input.relationship}.
- Buyer: ${input.buyerName} (${input.email}).

Family details to preserve:
- Elder name: ${input.elderName}
- Relationship label: ${input.relationship}
- Origin place: ${input.originPlace}
- Languages in audio: ${input.languageMix}
- Names and places to preserve exactly: ${input.preserveWords}
- Dedication request: ${input.dedication}
- Extra buyer notes: ${input.notes}

Interview prompts the child may have asked:
${interviewPrompts.map((prompt, index) => `${index + 1}. ${prompt}`).join("\n")}

Transcript:
"""${transcript}"""

Return only valid JSON with this exact shape:
{
  "title": "warm storybook title",
  "subtitle": "short place/family subtitle",
  "dedication": "one sentence dedication",
  "languageNote": "short reminder to review names, places and mixed-language phrases",
  "sections": [
    {"id":"place","heading":"section heading","body":"120-180 words in warm storybook prose"},
    {"id":"memory","heading":"section heading","body":"120-180 words in warm storybook prose"},
    {"id":"lesson","heading":"section heading","body":"120-180 words in warm storybook prose"}
  ],
  "closingNote": "one paragraph in the elder's spirit",
  "illustrationBrief": "one sentence visual direction for a small rubber-stamp field-note impression, no private data beyond names/places supplied",
  "stampSubject": "the most distinctive place, object, food, room, landscape, or memory fragment to illustrate",
  "stampMotifs": ["3 to 6 essential visual forms only, no labels, no people, no clutter"],
  "photoCaptions": ["caption 1", "caption 2", "caption 3"]
}

Rules:
- First determine the dominant language and script used in the transcript. Write the title, subtitle, dedication, languageNote, section headings, section bodies, closingNote and photoCaptions in that same language and script.
- If the transcript is Hindi, Tamil, Telugu, or another non-English language, do not translate the storybook into English.
- If the transcript naturally mixes languages, preserve the same kind of code-switching and keep original family phrases, foods, places and relationship terms.
- Do not invent major life events that are not in the transcript.
- Keep emotional texture, places, foods, people and lessons.
- If the transcript is thin, write a modest story and say what needs confirmation.
- Preserve Indian family relationship terms and proper nouns.
- Avoid melodrama. Make it feel like a family keepsake, not an obituary.
- For stampSubject and stampMotifs, identify the minimum visual information needed for recognition: one landmark, object silhouette, food form, room arrangement, landscape contour, or family object. Do not make a catalogue.
- Exclude people, crowds, vehicles, dense buildings, decorative clutter, slogans, captions, dates, labels and watermarks from the illustration concept.
`;
}

function stringOr(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}
