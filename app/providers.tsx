"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode
} from "react";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type CreateRunInput = {
  accessKey?: string;
  buyerName: string;
  email: string;
  elderName: string;
  relationship: string;
  originPlace: string;
  languageMix: string;
  paymentReference: string;
  paymentStatus: "pending" | "received";
  audioStorageId?: Id<"_storage">;
  hasAudio: boolean;
  photoCount: number;
};

type EvidenceContextValue = {
  backend: "convex" | "local";
  uploadAudio: (file: File) => Promise<Id<"_storage"> | null>;
  createRun: (input: CreateRunInput) => Promise<string>;
  markGenerating: (id: string) => Promise<void>;
  markDraftReady: (id: string, title: string) => Promise<void>;
  markExported: (id: string, title: string) => Promise<void>;
  markFailed: (id: string, error: string) => Promise<void>;
};

const EvidenceContext = createContext<EvidenceContextValue | null>(null);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: ReactNode }) {
  if (!convexClient) {
    return <LocalEvidenceProvider>{children}</LocalEvidenceProvider>;
  }

  return (
    <ConvexProvider client={convexClient}>
      <ConvexEvidenceProvider>{children}</ConvexEvidenceProvider>
    </ConvexProvider>
  );
}

export function useEvidence() {
  const value = useContext(EvidenceContext);
  if (!value) {
    throw new Error("useEvidence must be used inside Providers.");
  }
  return value;
}

function ConvexEvidenceProvider({ children }: { children: ReactNode }) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const create = useMutation(api.runs.createRun);
  const generating = useMutation(api.runs.markGenerating);
  const ready = useMutation(api.runs.markDraftReady);
  const exported = useMutation(api.runs.markExported);
  const failed = useMutation(api.runs.markFailed);

  const value = useMemo<EvidenceContextValue>(
    () => ({
      backend: "convex",
      uploadAudio: async (file) => {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file
        });

        if (!response.ok) {
          throw new Error("Audio upload failed. Try a smaller compressed mp3 or m4a file.");
        }

        const result = (await response.json()) as { storageId?: Id<"_storage"> };
        if (!result.storageId) {
          throw new Error("Audio upload did not return a storage id.");
        }

        return result.storageId;
      },
      createRun: async (input) => String(await create(input)),
      markGenerating: async (id) => {
        await generating({ id: id as never });
      },
      markDraftReady: async (id, title) => {
        await ready({ id: id as never, title });
      },
      markExported: async (id, title) => {
        await exported({ id: id as never, title });
      },
      markFailed: async (id, error) => {
        await failed({ id: id as never, error });
      }
    }),
    [create, exported, failed, generateUploadUrl, generating, ready]
  );

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}

function LocalEvidenceProvider({ children }: { children: ReactNode }) {
  const save = useCallback((id: string, patch: Record<string, unknown>) => {
    if (typeof window === "undefined") {
      return;
    }

    const key = "storybook-runs";
    const existing = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<
      string,
      Record<string, unknown>
    >;
    existing[id] = {
      ...(existing[id] || {}),
      ...patch,
      updatedAt: Date.now()
    };
    window.localStorage.setItem(key, JSON.stringify(existing));
  }, []);

  const value = useMemo<EvidenceContextValue>(
    () => ({
      backend: "local",
      uploadAudio: async () => null,
      createRun: async (input) => {
        const id = `local-${Date.now()}`;
        save(id, {
          ...input,
          status: "created",
          createdAt: Date.now()
        });
        return id;
      },
      markGenerating: async (id) => save(id, { status: "generating" }),
      markDraftReady: async (id, title) => save(id, { status: "draft_ready", title }),
      markExported: async (id, title) => save(id, { status: "exported", title }),
      markFailed: async (id, error) => save(id, { status: "failed", error })
    }),
    [save]
  );

  return <EvidenceContext.Provider value={value}>{children}</EvidenceContext.Provider>;
}
