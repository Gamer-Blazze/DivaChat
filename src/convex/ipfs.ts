import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

/**
 * Pin content to IPFS
 */
export const pinContent = mutation({
  args: {
    cid: v.string(),
    filename: v.optional(v.string()),
    size: v.optional(v.number()),
    contentType: v.optional(v.string()),
    pinService: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if already pinned
    const existingPin = await ctx.db
      .query("ipfsPins")
      .withIndex("by_cid", (q) => q.eq("cid", args.cid))
      .unique();

    if (existingPin) {
      return existingPin._id;
    }

    // Create new pin record
    const pinId = await ctx.db.insert("ipfsPins", {
      cid: args.cid,
      filename: args.filename,
      size: args.size,
      contentType: args.contentType,
      pinnedBy: user._id,
      isPinned: true,
      pinService: args.pinService,
    });

    return pinId;
  },
});

/**
 * Unpin content from IPFS (admin only)
 */
export const unpinContent = mutation({
  args: { cid: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const pin = await ctx.db
      .query("ipfsPins")
      .withIndex("by_cid", (q) => q.eq("cid", args.cid))
      .unique();

    if (!pin) {
      throw new Error("Pin not found");
    }

    await ctx.db.patch(pin._id, {
      isPinned: false,
    });
  },
});

/**
 * Get all pinned content (admin only)
 */
export const getAllPins = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const pins = await ctx.db.query("ipfsPins").collect();
    
    // Get pinned by user info
    const pinsWithUsers = await Promise.all(
      pins.map(async (pin) => {
        const pinnedByUser = await ctx.db.get(pin.pinnedBy);
        return {
          ...pin,
          pinnedByUser,
        };
      })
    );

    return pinsWithUsers;
  },
});

/**
 * Get user's pinned content
 */
export const getUserPins = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("ipfsPins")
      .withIndex("by_pinned_by", (q) => q.eq("pinnedBy", user._id))
      .filter((q) => q.eq(q.field("isPinned"), true))
      .collect();
  },
});
