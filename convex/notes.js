import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a note
export const create = mutation({
    args: {
        analysisId: v.id("analyses"),
        section: v.string(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("notes", {
            ...args,
            createdAt: Date.now(),
        });
    },
});

// Get notes for an analysis
export const getByAnalysis = query({
    args: { analysisId: v.id("analyses") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notes")
            .withIndex("by_analysis", (q) => q.eq("analysisId", args.analysisId))
            .order("desc")
            .collect();
    },
});

// Update a note
export const update = mutation({
    args: {
        id: v.id("notes"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { content: args.content });
    },
});

// Delete a note
export const remove = mutation({
    args: { id: v.id("notes") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
