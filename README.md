# Family Storybook Maker

Build Week Revenue product: paid buyers upload one family interview recording and receive an editable keepsake storybook with a PDF/export path.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and set:

```bash
OPENAI_API_KEY=
NEXT_PUBLIC_CONVEX_URL=
NEXT_PUBLIC_UPI_ID=
NEXT_PUBLIC_UPI_NAME=
```

3. Start Convex in another terminal:

```bash
npm run convex:dev
```

4. Start the app:

```bash
npm run dev
```

If `OPENAI_API_KEY` is missing, the app runs in demo mode so the UI and export path can still be verified. Production Revenue proof should use real transcription and story generation.
