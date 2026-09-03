import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  runs: defineTable({
    buyerName: v.string(),
    email: v.string(),
    elderName: v.string(),
    relationship: v.string(),
    originPlace: v.string(),
    languageMix: v.string(),
    paymentReference: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("received")),
    status: v.union(
      v.literal("created"),
      v.literal("generating"),
      v.literal("draft_ready"),
      v.literal("exported"),
      v.literal("failed")
    ),
    hasAudio: v.boolean(),
    photoCount: v.number(),
    title: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    note: v.optional(v.string()),
    createdAt: v.number()
  }).index("by_email", ["email"])
});
