import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Save or update a correction (upsert by analysisId)
export const saveCorrection = mutation({
    args: {
        analysisId: v.id("analyses"),
        originalResult: v.string(),
        correctedResult: v.string(),
        correctedMarkers: v.string(),
        patientName: v.string(),
        patientAge: v.string(),
        patientGender: v.string(),
        complaint: v.string(),
        dentalHistory: v.optional(v.string()),
        existingTreatments: v.optional(v.string()),
        expectations: v.optional(v.array(v.string())),
        photoStorageIds: v.array(v.object({
            id: v.string(),
            title: v.string(),
            storageId: v.id("_storage"),
        })),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if correction already exists for this analysis
        const existing = await ctx.db
            .query("training_data")
            .withIndex("by_analysis", (q) => q.eq("analysisId", args.analysisId))
            .first();

        const now = Date.now();

        if (existing) {
            // Update existing
            await ctx.db.patch(existing._id, {
                correctedResult: args.correctedResult,
                correctedMarkers: args.correctedMarkers,
                status: args.status,
                updatedAt: now,
            });
            return existing._id;
        } else {
            // Create new
            return await ctx.db.insert("training_data", {
                ...args,
                createdAt: now,
                updatedAt: now,
            });
        }
    },
});

// Approve a correction as training data
export const approve = mutation({
    args: { id: v.id("training_data") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "approved",
            updatedAt: Date.now(),
        });
    },
});

// Revert to draft
export const revertToDraft = mutation({
    args: { id: v.id("training_data") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, {
            status: "draft",
            updatedAt: Date.now(),
        });
    },
});

// Get correction for a specific analysis
export const getByAnalysis = query({
    args: { analysisId: v.id("analyses") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("training_data")
            .withIndex("by_analysis", (q) => q.eq("analysisId", args.analysisId))
            .first();
    },
});

// Get all training data with optional status filter
export const getAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("training_data")
            .order("desc")
            .collect();
    },
});

// Get stats
export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const all = await ctx.db.query("training_data").collect();
        const approved = all.filter((d) => d.status === "approved").length;
        const draft = all.filter((d) => d.status === "draft").length;
        return {
            total: all.length,
            approved,
            draft,
        };
    },
});

// Get all approved for export
export const getApprovedForExport = query({
    args: {},
    handler: async (ctx) => {
        const items = await ctx.db
            .query("training_data")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();

        // Resolve photo URLs
        const resolved = await Promise.all(
            items.map(async (item) => {
                const photoUrls = await Promise.all(
                    item.photoStorageIds.map(async (photo) => {
                        const url = await ctx.storage.getUrl(photo.storageId);
                        return { ...photo, url };
                    })
                );
                return { ...item, resolvedPhotos: photoUrls };
            })
        );

        return resolved;
    },
});

// Delete training data
export const remove = mutation({
    args: { id: v.id("training_data") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
