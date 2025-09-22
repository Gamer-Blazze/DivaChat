import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation, QueryCtx, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

/**
 * Get the current signed in user with Web3 data
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (user === null) {
      return null;
    }
    return user;
  },
});

/**
 * Get user by wallet address
 */
export const getUserByWallet = query({
  args: { walletAddress: v.string() },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("walletAddress", args.walletAddress))
      .take(1);

    return results[0] ?? null;
  },
});

/**
 * Update user profile with Web3 data
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    walletAddress: v.optional(v.string()),
    ensName: v.optional(v.string()),
    xmtpAddress: v.optional(v.string()),
    publicKey: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      ...args,
      lastSeen: Date.now(),
    });

    return user._id;
  },
});

/**
 * Set user online status
 */
export const setOnlineStatus = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      isOnline: args.isOnline,
      lastSeen: Date.now(),
    });
  },
});

/**
 * Get all users for admin dashboard
 */
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "admin") {
      throw new Error("Admin access required");
    }

    return await ctx.db.query("users").collect();
  },
});

/**
 * Search users by wallet address or ENS name
 */
export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const query = args.query.toLowerCase();
    
    // Search by wallet address
    const walletResults = await ctx.db
      .query("users")
      .withIndex("by_wallet")
      .filter((q) => 
        q.and(
          q.neq(q.field("walletAddress"), undefined),
          q.gte(q.field("walletAddress"), query)
        )
      )
      .take(10);

    // Search by ENS name
    const ensResults = await ctx.db
      .query("users")
      .withIndex("by_ens")
      .filter((q) => 
        q.and(
          q.neq(q.field("ensName"), undefined),
          q.gte(q.field("ensName"), query)
        )
      )
      .take(10);

    // Combine and deduplicate results
    const allResults = [...walletResults, ...ensResults];
    const uniqueResults = allResults.filter((user, index, self) => 
      index === self.findIndex(u => u._id === user._id)
    );

    return uniqueResults.slice(0, 10);
  },
});

/**
 * Search users by display name (prefix match)
 */
export const searchUsersByName = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const me = await getCurrentUser(ctx);
    if (!me) {
      throw new Error("Not authenticated");
    }

    const q = args.query.trim();
    if (q === "") return [];

    // Prefix range using index by_name
    const upperBound = q + "\uffff";
    const results = await ctx.db
      .query("users")
      .withIndex("by_name", (ix) => ix.gte("name", q).lt("name", upperBound))
      .take(10);

    return results;
  },
});

/**
 * Internal helper to get current user
 */
export function getCurrentUser(ctx: QueryCtx): Promise<Doc<"users"> | null>;
export function getCurrentUser(ctx: MutationCtx): Promise<Doc<"users"> | null>;
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx as any);
  if (userId === null) {
    return null;
  }
  return await (ctx as any).db.get(userId);
}