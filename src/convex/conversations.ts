import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";

/**
 * Create a new conversation
 */
export const createConversation = mutation({
  args: {
    type: v.union(v.literal("direct"), v.literal("group")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    participantIds: v.array(v.id("users")),
    xmtpTopic: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Create conversation
    const conversationId = await ctx.db.insert("conversations", {
      type: args.type,
      name: args.name,
      description: args.description,
      createdBy: user._id,
      isEncrypted: true,
      xmtpTopic: args.xmtpTopic,
      lastMessageAt: Date.now(),
    });

    // Add creator as admin
    await ctx.db.insert("participants", {
      conversationId,
      userId: user._id,
      role: "admin",
      joinedAt: Date.now(),
    });

    // Add other participants
    for (const participantId of args.participantIds) {
      await ctx.db.insert("participants", {
        conversationId,
        userId: participantId,
        role: "member",
        joinedAt: Date.now(),
      });
    }

    return conversationId;
  },
});

/**
 * Get user's conversations
 */
export const getUserConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get user's participations
    const participations = await ctx.db
      .query("participants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get conversations with participant info
    const conversations = await Promise.all(
      participations.map(async (participation) => {
        const conversation = await ctx.db.get(participation.conversationId);
        if (!conversation) return null;

        // Get other participants
        const allParticipants = await ctx.db
          .query("participants")
          .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", conversation._id))
          .collect();

        const participants = await Promise.all(
          allParticipants.map(async (p) => {
            const participant = await ctx.db.get(p.userId);
            return participant ? { ...participant, role: p.role } : null;
          })
        );

        return {
          ...conversation,
          participants: participants.filter(Boolean),
          unreadCount: 0, // TODO: Calculate unread count
        };
      })
    );

    return conversations
      .filter(Boolean)
      .sort((a, b) => (b!.lastMessageAt || 0) - (a!.lastMessageAt || 0));
  },
});

/**
 * Get conversation by ID
 */
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is participant
    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!participation) {
      throw new Error("Not authorized to view this conversation");
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Get all participants
    const allParticipants = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => q.eq("conversationId", conversation._id))
      .collect();

    const participants = await Promise.all(
      allParticipants.map(async (p) => {
        const participant = await ctx.db.get(p.userId);
        return participant ? { ...participant, role: p.role } : null;
      })
    );

    return {
      ...conversation,
      participants: participants.filter(Boolean),
    };
  },
});

/**
 * Add participant to conversation
 */
export const addParticipant = mutation({
  args: {
    conversationId: v.id("conversations"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin of the conversation
    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!participation || participation.role !== "admin") {
      throw new Error("Admin access required");
    }

    // Check if user is already a participant
    const existingParticipation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    if (existingParticipation) {
      throw new Error("User is already a participant");
    }

    // Add participant
    await ctx.db.insert("participants", {
      conversationId: args.conversationId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});

/**
 * Update last read timestamp
 */
export const markAsRead = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!participation) {
      throw new Error("Not a participant in this conversation");
    }

    await ctx.db.patch(participation._id, {
      lastReadAt: Date.now(),
    });
  },
});

/**
 * Get or create a singleton public conversation and ensure current user is a participant
 */
export const getOrCreatePublicConversation = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Find existing public conversation by a stable topic
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_xmtpTopic", (q) => q.eq("xmtpTopic", "public_global"))
      .unique();

    let conversationId = existing?._id;

    // Create if missing
    if (!conversationId) {
      conversationId = await ctx.db.insert("conversations", {
        type: "group",
        name: "Public",
        description: "Global public chat",
        createdBy: user._id,
        isEncrypted: true,
        xmtpTopic: "public_global",
        lastMessageAt: Date.now(),
      });

      // Add creator as admin
      await ctx.db.insert("participants", {
        conversationId,
        userId: user._id,
        role: "admin",
        joinedAt: Date.now(),
      });
    }

    // Ensure current user is a participant
    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", conversationId!).eq("userId", user._id),
      )
      .unique();

    if (!participation) {
      await ctx.db.insert("participants", {
        conversationId: conversationId!,
        userId: user._id,
        role: "member",
        joinedAt: Date.now(),
      });
    }

    return conversationId!;
  },
});