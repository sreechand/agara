# CHANGELOG

- Thu 3 Sep 2026: Created the Build Week scope and started the audio-to-storybook product implementation.
- Thu 3 Sep 2026: A buyer can enter payment/family details, upload an interview recording, generate an editable storybook draft, and export it through the PDF path.
- Thu 3 Sep 2026: Real OpenAI automation was verified with sample audio: transcription and storybook drafting both work locally.
- Thu 3 Sep 2026: The product is live on Vercel, connected to GitHub and Convex, and a live test input generated an editable storybook.
- Fri 4 Sep 2026: Buyers can use a private keyed link to generate a storybook without seeing backend or payment controls.
- Fri 4 Sep 2026: Audio uploads now go through Convex storage first, so larger buyer recordings can bypass Vercel's request body limit.
- Fri 4 Sep 2026: Storybooks now preserve the audio language, render as a two-page aged-paper spread, show a small rubber-stamp field-note illustration, and turn uploaded photos into scrapbook Polaroids.
