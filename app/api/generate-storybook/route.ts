import OpenAI from "openai";
import { NextResponse } from "next/server";

import {
  buildStoryPrompt,
  demoDraft,
  normalizeDraft,
  type IntakePayload
} from "@/lib/storybook";
import { maxAudioBytes } from "@/lib/files";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const formData = await request.formData();
    const audio = formData.get("audio");
    const input = readIntake(formData);

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "Upload one audio recording before generating the storybook." },
        { status: 400 }
      );
    }

    if (audio.size > maxAudioBytes) {
      return NextResponse.json(
        { error: "The recording is too large. Keep v1 recordings under 25 MB." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      const draft = demoDraft(input);
      return NextResponse.json({
        draft,
        model: "demo-mode",
        elapsedMs: Date.now() - startedAt,
        warning: "OPENAI_API_KEY is missing, so this is a demo draft."
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const transcript = await transcribe(openai, audio, input);
    const draft = await generateDraft(openai, input, transcript);

    return NextResponse.json({
      draft: normalizeDraft({ ...draft, transcript }, input),
      model: process.env.OPENAI_TEXT_MODEL || "gpt-5-mini",
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something failed while generating the storybook.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function readIntake(formData: FormData): IntakePayload {
  return {
    buyerName: getText(formData, "buyerName"),
    email: getText(formData, "email"),
    elderName: getText(formData, "elderName"),
    relationship: getText(formData, "relationship"),
    originPlace: getText(formData, "originPlace"),
    languageMix: getText(formData, "languageMix"),
    preserveWords: getText(formData, "preserveWords"),
    dedication: getText(formData, "dedication"),
    paymentReference: getText(formData, "paymentReference"),
    notes: getText(formData, "notes")
  };
}

function getText(formData: FormData, key: keyof IntakePayload) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function transcribe(openai: OpenAI, audio: File, input: IntakePayload) {
  const model = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe";
  const prompt = [
    `This is a family interview for a keepsake storybook.`,
    `The speaker may use ${input.languageMix || "English, Hindi, Tamil, Telugu, or a mix"}.`,
    `Preserve these names and places exactly where possible: ${input.preserveWords || "none supplied"}.`
  ].join(" ");

  const transcription = await openai.audio.transcriptions.create({
    file: audio,
    model,
    prompt
  });

  return transcription.text;
}

async function generateDraft(openai: OpenAI, input: IntakePayload, transcript: string) {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-5-mini";
  const response = await openai.responses.create({
    model,
    instructions:
      "You are a careful family-history editor. You turn interview transcripts into truthful, warm, short storybooks. Return only valid JSON.",
    input: buildStoryPrompt(input, transcript)
  });

  const text = response.output_text;
  if (!text) {
    throw new Error("The story model returned an empty result.");
  }

  return JSON.parse(extractJson(text));
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("The story model did not return valid JSON.");
  }

  return trimmed.slice(first, last + 1);
}
