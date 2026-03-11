import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Create a new analysis record
export const create = mutation({
    args: {
        patientName: v.string(),
        patientAge: v.string(),
        patientGender: v.string(),
        complaint: v.string(),
        dentalHistory: v.optional(v.string()),
        allergies: v.optional(v.string()),
        existingTreatments: v.optional(v.string()),
        photoCount: v.number(),
        photoTypes: v.array(v.string()),
        analysisResult: v.string(),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("analyses", {
            ...args,
            createdAt: Date.now(),
        });
        return id;
    },
});

// Get all analyses sorted by newest first
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("analyses")
            .withIndex("by_creation")
            .order("desc")
            .collect();
    },
});

// Get a single analysis by ID
export const getById = query({
    args: { id: v.id("analyses") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Delete an analysis
export const remove = mutation({
    args: { id: v.id("analyses") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
