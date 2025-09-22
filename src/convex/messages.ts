import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./users";
import { Id } from "./_generated/dataModel";

/**
 * Send a message
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    type: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("audio"),
      v.literal("file"),
      v.literal("payment")
    ),
    encryptedContent: v.optional(v.string()),
    xmtpMessageId: v.optional(v.string()),
    ipfsCid: v.optional(v.string()),
    ipfsKey: v.optional(v.string()),
    tokenAddress: v.optional(v.string()),
    tokenAmount: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify user is participant in conversation
    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!participation) {
      throw new Error("Not authorized to send messages in this conversation");
    }

    // Require content for text messages
    if (args.type === "text") {
      const text = (args.encryptedContent ?? "").trim();
      if (!text) {
        throw new Error("Message content is required for text messages");
      }
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      type: args.type,
      encryptedContent: args.encryptedContent,
      xmtpMessageId: args.xmtpMessageId,
      ipfsCid: args.ipfsCid,
      ipfsKey: args.ipfsKey,
      tokenAddress: args.tokenAddress,
      tokenAmount: args.tokenAmount,
      transactionHash: args.transactionHash,
      replyToId: args.replyToId,
      status: "sent",
    });

    // Compute last message preview safely
    const textPreview =
      args.type === "text"
        ? (args.encryptedContent ?? "").slice(0, 60)
        : `Sent ${args.type}`;

    // Update conversation last message
    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      lastMessage: textPreview,
    });

    return messageId;
  },
});

/**
 * Get messages for a conversation
 */
export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify user is participant
    const participation = await ctx.db
      .query("participants")
      .withIndex("by_conversation_and_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", user._id)
      )
      .unique();

    if (!participation) {
      throw new Error("Not authorized to view messages in this conversation");
    }

    const rawLimit = args.limit ?? 50;
    const limit = Math.min(200, Math.max(1, rawLimit));
    
    // Get messages with sender info
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_and_time", (q) => q.eq("conversationId", args.conversationId))
      .order("desc")
      .take(limit);

    // Get sender info and reactions for each message
    const messagesWithDetails = await Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        
        // Get reactions
        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_message", (q) => q.eq("messageId", message._id))
          .collect();

        // Group reactions by emoji
        const reactionGroups = reactions.reduce((acc, reaction) => {
          if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = [];
          }
          acc[reaction.emoji].push(reaction.userId);
          return acc;
        }, {} as Record<string, Id<"users">[]>);

        return {
          ...message,
          sender,
          reactions: reactionGroups,
        };
      })
    );

    return messagesWithDetails.reverse(); // Return in chronological order
  },
});

/**
 * Edit a message
 */
export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    encryptedContent: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== user._id) {
      throw new Error("Can only edit your own messages");
    }

    await ctx.db.patch(args.messageId, {
      encryptedContent: args.encryptedContent,
      editedAt: Date.now(),
    });
  },
});

/**
 * Delete a message
 */
export const deleteMessage = mutation({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== user._id) {
      throw new Error("Can only delete your own messages");
    }

    await ctx.db.patch(args.messageId, {
      deletedAt: Date.now(),
    });
  },
});

/**
 * Add reaction to message
 */
export const addReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if reaction already exists
    const existingReaction = await ctx.db
      .query("reactions")
      .withIndex("by_message_and_user", (q) => 
        q.eq("messageId", args.messageId).eq("userId", user._id)
      )
      .filter((q) => q.eq(q.field("emoji"), args.emoji))
      .unique();

    if (existingReaction) {
      // Remove reaction if it exists
      await ctx.db.delete(existingReaction._id);
    } else {
      // Add new reaction
      await ctx.db.insert("reactions", {
        messageId: args.messageId,
        userId: user._id,
        emoji: args.emoji,
      });
    }
  },
});

/**
 * Update message status
 */
export const updateMessageStatus = mutation({
  args: {
    messageId: v.id("messages"),
    status: v.union(
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.senderId !== user._id) {
      throw new Error("Can only update your own message status");
    }

    await ctx.db.patch(args.messageId, {
      status: args.status,
    });
  },
});