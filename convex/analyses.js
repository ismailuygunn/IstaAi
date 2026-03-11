import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

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
        expectations: v.optional(v.array(v.string())),
        photoCount: v.number(),
        photoTypes: v.array(v.string()),
        photoStorageIds: v.optional(v.array(v.object({
            id: v.string(),
            title: v.string(),
            storageId: v.id("_storage"),
        }))),
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
        const items = await ctx.db
            .query("analyses")
            .withIndex("by_creation")
            .order("desc")
            .collect();

        // Resolve first photo URL for thumbnails
        const results = await Promise.all(
            items.map(async (item) => {
                let thumbnailUrl = null;
                if (item.photoStorageIds?.length) {
                    thumbnailUrl = await ctx.storage.getUrl(item.photoStorageIds[0].storageId);
                } else if (item.photos?.length) {
                    thumbnailUrl = item.photos[0].base64;
                }
                return { ...item, thumbnailUrl };
            })
        );
        return results;
    },
});

// Get a single analysis by ID, with photo URLs resolved
export const getById = query({
    args: { id: v.id("analyses") },
    handler: async (ctx, args) => {
        const analysis = await ctx.db.get(args.id);
        if (!analysis) return null;

        // Resolve storage IDs to URLs (new system)
        if (analysis.photoStorageIds?.length) {
            const photos = await Promise.all(
                analysis.photoStorageIds.map(async (p) => {
                    const url = await ctx.storage.getUrl(p.storageId);
                    return { id: p.id, title: p.title, url };
                })
            );
            return { ...analysis, resolvedPhotos: photos };
        }

        // Fallback: old inline base64 photos
        if (analysis.photos?.length) {
            const photos = analysis.photos.map((p) => ({
                id: p.id,
                title: p.title,
                url: p.base64,
            }));
            return { ...analysis, resolvedPhotos: photos };
        }

        return { ...analysis, resolvedPhotos: [] };
    },
});

// Delete an analysis
export const remove = mutation({
    args: { id: v.id("analyses") },
    handler: async (ctx, args) => {
        const analysis = await ctx.db.get(args.id);
        // Clean up stored photos
        if (analysis?.photoStorageIds?.length) {
            for (const p of analysis.photoStorageIds) {
                await ctx.storage.delete(p.storageId);
            }
        }
        await ctx.db.delete(args.id);
    },
});
