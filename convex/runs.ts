import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createRun = mutation({
  args: {
    accessKey: v.optional(v.string()),
    buyerName: v.string(),
    email: v.string(),
    elderName: v.string(),
    relationship: v.string(),
    originPlace: v.string(),
    languageMix: v.string(),
    paymentReference: v.string(),
    paymentStatus: v.union(v.literal("pending"), v.literal("received")),
    hasAudio: v.boolean(),
    photoCount: v.number()
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("runs", {
      ...args,
      status: "created",
      createdAt: now,
      updatedAt: now
    });
  }
});

export const markGenerating = mutation({
  args: {
    id: v.id("runs")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "generating",
      updatedAt: Date.now()
    });
    return null;
  }
});

export const markDraftReady = mutation({
  args: {
    id: v.id("runs"),
    title: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "draft_ready",
      title: args.title,
      updatedAt: Date.now()
    });
    return null;
  }
});

export const markExported = mutation({
  args: {
    id: v.id("runs"),
    title: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "exported",
      title: args.title,
      updatedAt: Date.now()
    });
    return null;
  }
});

export const markFailed = mutation({
  args: {
    id: v.id("runs"),
    error: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
      updatedAt: Date.now()
    });
    return null;
  }
});
