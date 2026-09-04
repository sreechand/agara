"use client";

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Download,
  ImagePlus,
  KeyRound,
  Loader2,
  Mic,
  Printer,
  Sparkles,
  Upload
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useEvidence } from "@/app/providers";
import { readPhotoPreviews, validateAudioFile, type PhotoPreview } from "@/lib/files";
import {
  demoDraft,
  emptyDraft,
  interviewPrompts,
  type IntakePayload,
  type StorybookDraft,
  type StorySection
} from "@/lib/storybook";

const initialIntake: IntakePayload = {
  accessKey: "",
  buyerName: "",
  email: "",
  elderName: "",
  relationship: "Nani",
  originPlace: "",
  languageMix: "English + Hindi/Tamil/Telugu mixed",
  preserveWords: "",
  dedication: "",
  paymentReference: "external",
  notes: ""
};

type GenerateResponse = {
  draft?: StorybookDraft;
  error?: string;
  warning?: string;
  model?: string;
  elapsedMs?: number;
};

export function StorybookApp() {
  const evidence = useEvidence();
  const searchParams = useSearchParams();
  const runIdRef = useRef<string | null>(null);
  const [intake, setIntake] = useState(initialIntake);
  const [audio, setAudio] = useState<File | null>(null);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);
  const [draft, setDraft] = useState<StorybookDraft>(emptyDraft());
  const [status, setStatus] = useState<"idle" | "generating" | "ready" | "failed">("idle");
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");

  const urlAccessKey = searchParams.get("key")?.trim() || "";
  const accessKey = intake.accessKey || urlAccessKey;
  const paymentReference = accessKey ? `external:${accessKey}` : "external";

  const requiredMissing = useMemo(
    () =>
      [
        intake.buyerName,
        intake.email,
        intake.elderName,
        intake.relationship,
        intake.originPlace,
        accessKey
      ].some((value) => !value.trim()),
    [accessKey, intake]
  );

  const canGenerate = Boolean(audio) && !requiredMissing && status !== "generating";

  async function handleGenerate() {
    setMessage("");
    setWarning("");

    const audioError = validateAudioFile(audio);
    if (audioError) {
      setStatus("failed");
      setMessage(audioError);
      return;
    }

    if (requiredMissing) {
      setStatus("failed");
      setMessage("Open your private story link, then fill the buyer, elder, place, and relationship fields.");
      return;
    }

    setStatus("generating");

    let audioStorageId: Awaited<ReturnType<typeof evidence.uploadAudio>> = null;
    try {
      audioStorageId = await evidence.uploadAudio(audio as File);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Audio upload failed.";
      setStatus("failed");
      setMessage(text);
      return;
    }

    const runId = await evidence.createRun({
      accessKey,
      buyerName: intake.buyerName,
      email: intake.email,
      elderName: intake.elderName,
      relationship: intake.relationship,
      originPlace: intake.originPlace,
      languageMix: intake.languageMix,
      paymentReference,
      paymentStatus: "received",
      audioStorageId: audioStorageId || undefined,
      hasAudio: Boolean(audio),
      photoCount: photos.length
    });
    runIdRef.current = runId;

    try {
      await evidence.markGenerating(runId);

      const requestPayload = { input: { ...intake, accessKey, paymentReference }, audioStorageId };
      const fallbackBody = new FormData();
      Object.entries(requestPayload.input).forEach(([key, value]) => fallbackBody.append(key, value));
      fallbackBody.append("audio", audio as File);

      const response = await fetch("/api/generate-storybook", audioStorageId
        ? {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload)
          }
        : {
            method: "POST",
            body: fallbackBody
          });
      const result = (await readGenerateResponse(response)) as GenerateResponse;

      if (!response.ok || !result.draft) {
        throw new Error(result.error || "The storybook could not be generated.");
      }

      setDraft(result.draft);
      setWarning(result.warning || "");
      setStatus("ready");
      setMessage(
        `${result.model || "model"} created the draft in ${Math.max(
          1,
          Math.round((result.elapsedMs || 1000) / 1000)
        )}s. Review names and places before export.`
      );
      await evidence.markDraftReady(runId, result.draft.title);
    } catch (error) {
      const text = error instanceof Error ? error.message : "The storybook could not be generated.";
      setStatus("failed");
      setMessage(text);
      await evidence.markFailed(runId, text);
    }
  }

  async function handlePhotoFiles(files: FileList | null) {
    try {
      setPhotos(await readPhotoPreviews(files));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not preview the photos.");
    }
  }

  async function handleExport() {
    if (runIdRef.current) {
      await evidence.markExported(runIdRef.current, draft.title || `${intake.elderName}'s Story`);
    }
    window.print();
  }

  function updateIntake(key: keyof IntakePayload, value: string) {
    setIntake((current) => ({ ...current, [key]: value }));
  }

  function updateDraft(key: keyof StorybookDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateSection(id: string, patch: Partial<StorySection>) {
    setDraft((current) => ({
      ...current,
      sections: current.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section
      )
    }));
  }

  function loadDemo() {
    const seeded = {
      ...initialIntake,
      buyerName: "Demo Buyer",
      email: "demo@example.com",
      elderName: "Lakshmi",
      relationship: "Ajji",
      originPlace: "Mysuru",
      accessKey: "demo-rehearsal",
      preserveWords: "Lakshmi, Mysuru, Devaraja Market, filter coffee",
      dedication: "For the grandchildren who should know where the family stories began.",
      paymentReference: "external:demo-rehearsal",
      notes: "Demo-safe fallback for rehearsal."
    };
    setIntake(seeded);
    setDraft(demoDraft(seeded));
    setStatus("ready");
    setMessage("Demo draft loaded. Use this only for rehearsal if live generation is unavailable.");
  }

  return (
    <main className="app-shell">
      <section className="masthead screen-only">
        <div>
          <p className="eyebrow">Build Week Revenue v1</p>
          <h1>Family Storybook Maker</h1>
          <p className="masthead-copy">
            Record a parent or grandparent answering warm prompts. Turn the audio into an
            editable keepsake storybook and export it for the family.
          </p>
        </div>
        <div className="proof-strip" aria-label="Storybook constraints">
          <span>
            <KeyRound size={16} aria-hidden /> Private link
          </span>
          <span>
            <Mic size={16} aria-hidden /> 10 min audio
          </span>
          <span>
            <BookOpen size={16} aria-hidden /> Editable PDF path
          </span>
        </div>
      </section>

      <section className="workspace">
        <aside className="intake-panel screen-only" aria-label="Storybook intake">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Intake</p>
              <h2>Recording and family details</h2>
            </div>
          </div>

          <div className={`access-box ${accessKey ? "ready" : "missing"}`}>
            <KeyRound size={20} aria-hidden />
            <div>
              <p className="field-label">Private story link</p>
              <strong>{accessKey ? "Ready to begin" : "Access key missing"}</strong>
              <span>
                {accessKey
                  ? "This storybook will be saved against your private key."
                  : "Use the custom link you received, or paste the key below."}
              </span>
            </div>
          </div>

          <TextField
            label="Access key"
            value={accessKey}
            onChange={(value) =>
              setIntake((current) => ({
                ...current,
                accessKey: value,
                paymentReference: value ? `external:${value}` : "external"
              }))
            }
          />

          <div className="field-grid">
            <TextField
              label="Buyer name"
              value={intake.buyerName}
              onChange={(value) => updateIntake("buyerName", value)}
            />
            <TextField
              label="Email"
              type="email"
              value={intake.email}
              onChange={(value) => updateIntake("email", value)}
            />
            <TextField
              label="Elder name"
              value={intake.elderName}
              onChange={(value) => updateIntake("elderName", value)}
            />
            <TextField
              label="Relationship"
              value={intake.relationship}
              onChange={(value) => updateIntake("relationship", value)}
            />
            <TextField
              label="Origin place"
              value={intake.originPlace}
              onChange={(value) => updateIntake("originPlace", value)}
            />
          </div>

          <TextArea
            label="Languages in the recording"
            rows={2}
            value={intake.languageMix}
            onChange={(value) => updateIntake("languageMix", value)}
          />
          <TextArea
            label="Names and places to preserve"
            rows={3}
            value={intake.preserveWords}
            onChange={(value) => updateIntake("preserveWords", value)}
          />
          <TextArea
            label="Dedication or family note"
            rows={3}
            value={intake.dedication}
            onChange={(value) => updateIntake("dedication", value)}
          />
          <TextArea
            label="Extra context"
            rows={3}
            value={intake.notes}
            onChange={(value) => updateIntake("notes", value)}
          />

          <div className="upload-zone">
            <label className="upload-card">
              <Upload size={22} aria-hidden />
              <span>{audio ? audio.name : "Upload interview audio"}</span>
              <small>mp3, m4a, wav, mp4 or webm. Keep it under 100 MB.</small>
              <input
                type="file"
                accept="audio/*,video/mp4,.m4a,.mp3,.wav,.webm"
                onChange={(event) => setAudio(event.target.files?.[0] || null)}
              />
            </label>
            <label className="upload-card">
              <ImagePlus size={22} aria-hidden />
              <span>{photos.length ? `${photos.length} photo previewed` : "Optional photos"}</span>
              <small>Up to 3 family photos for the storybook pages.</small>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handlePhotoFiles(event.target.files)}
              />
            </label>
          </div>

          <div className="prompt-block">
            <div className="prompt-title">
              <Sparkles size={16} aria-hidden />
              Interview prompts
            </div>
            <ol>
              {interviewPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ol>
          </div>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={loadDemo}>
              Load demo
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {status === "generating" ? (
                <>
                  <Loader2 className="spin" size={18} aria-hidden /> Generating
                </>
              ) : (
                <>
                  <Sparkles size={18} aria-hidden /> Generate storybook
                </>
              )}
            </button>
          </div>

          {message ? (
            <div className={`notice ${status === "failed" ? "error" : "success"}`}>
              {status === "failed" ? (
                <AlertTriangle size={18} aria-hidden />
              ) : (
                <CheckCircle2 size={18} aria-hidden />
              )}
              <span>{message}</span>
            </div>
          ) : null}
          {warning ? (
            <div className="notice warning">
              <AlertTriangle size={18} aria-hidden />
              <span>{warning}</span>
            </div>
          ) : null}
        </aside>

        <section className="book-workbench" aria-label="Editable storybook">
          <div className="editor-toolbar screen-only">
            <div>
              <p className="eyebrow">Storybook</p>
              <h2>{draft.title || "Waiting for a recording"}</h2>
            </div>
            <button
              className="export-button"
              type="button"
              disabled={!draft.sections.length}
              onClick={handleExport}
            >
              <Printer size={18} aria-hidden />
              Export PDF
            </button>
          </div>

          <div id="storybook-print-area" className="storybook-page">
            {draft.sections.length ? (
              <StorybookEditor
                draft={draft}
                photos={photos}
                onDraftChange={updateDraft}
                onSectionChange={updateSection}
              />
            ) : (
              <EmptyBook />
            )}
          </div>

          {draft.sections.length ? (
            <div className="transcript-panel screen-only">
              <div>
                <p className="eyebrow">Transcript review</p>
                <h3>Correct names and mixed-language phrases</h3>
              </div>
              <textarea
                value={draft.transcript}
                onChange={(event) => updateDraft("transcript", event.target.value)}
                rows={8}
              />
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

async function readGenerateResponse(response: Response): Promise<GenerateResponse> {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    error:
      response.status === 413
        ? "The recording is too large for this upload path. Try a compressed mp3 or m4a file."
        : text || "The storybook server returned an unexpected response."
  };
}

function StorybookEditor({
  draft,
  photos,
  onDraftChange,
  onSectionChange
}: {
  draft: StorybookDraft;
  photos: PhotoPreview[];
  onDraftChange: (key: keyof StorybookDraft, value: string) => void;
  onSectionChange: (id: string, patch: Partial<StorySection>) => void;
}) {
  return (
    <article className="book">
      <section className="book-cover">
        <div className="cover-mark">Family Story</div>
        <textarea
          className="book-title"
          value={draft.title}
          onChange={(event) => onDraftChange("title", event.target.value)}
          aria-label="Storybook title"
          rows={2}
        />
        <input
          className="book-subtitle"
          value={draft.subtitle}
          onChange={(event) => onDraftChange("subtitle", event.target.value)}
          aria-label="Storybook subtitle"
        />
        <textarea
          className="book-dedication"
          value={draft.dedication}
          onChange={(event) => onDraftChange("dedication", event.target.value)}
          aria-label="Dedication"
          rows={3}
        />
      </section>

      {photos.length ? (
        <section className="photo-strip">
          {photos.map((photo, index) => (
            <figure key={photo.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.name} />
              <figcaption>{draft.photoCaptions[index] || photo.name}</figcaption>
            </figure>
          ))}
        </section>
      ) : (
        <section className="illustration-fallback" aria-label="Illustration fallback">
          <div className="sun-disc" />
          <p>{draft.illustrationBrief}</p>
        </section>
      )}

      <section className="language-note">
        <AlertTriangle size={16} aria-hidden />
        <textarea
          value={draft.languageNote}
          onChange={(event) => onDraftChange("languageNote", event.target.value)}
          rows={2}
          aria-label="Language review note"
        />
      </section>

      {draft.sections.map((section) => (
        <section className="story-section" key={section.id}>
          <input
            value={section.heading}
            onChange={(event) => onSectionChange(section.id, { heading: event.target.value })}
            aria-label={`Heading for ${section.id}`}
          />
          <textarea
            value={section.body}
            onChange={(event) => onSectionChange(section.id, { body: event.target.value })}
            rows={7}
            aria-label={`Body for ${section.id}`}
          />
        </section>
      ))}

      <section className="closing-note">
        <textarea
          value={draft.closingNote}
          onChange={(event) => onDraftChange("closingNote", event.target.value)}
          rows={4}
          aria-label="Closing note"
        />
      </section>
    </article>
  );
}

function EmptyBook() {
  return (
    <div className="empty-book">
      <div className="empty-icon">
        <Download size={34} aria-hidden />
      </div>
      <p className="eyebrow">Artifact preview</p>
      <h2>The storybook appears here</h2>
      <p>
        The live demo proof is a fresh recording becoming a structured, editable keepsake without
        manual rewriting.
      </p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
