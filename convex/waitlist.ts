import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    note: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("waitlist", {
      ...args,
      createdAt: Date.now()
    });
  }
});
