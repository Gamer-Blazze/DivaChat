import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles for the decentralized chat app
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // Auth tables
    ...authTables,

    // Enhanced users table for Web3 chat
    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      
      // Web3 specific fields
      walletAddress: v.optional(v.string()),
      ensName: v.optional(v.string()),
      xmtpAddress: v.optional(v.string()),
      publicKey: v.optional(v.string()),
      lastSeen: v.optional(v.number()),
      isOnline: v.optional(v.boolean()),
    })
    .index("email", ["email"])
    .index("by_wallet", ["walletAddress"])
    .index("by_ens", ["ensName"]),

    // Conversations (both direct and group chats)
    conversations: defineTable({
      type: v.union(v.literal("direct"), v.literal("group")),
      name: v.optional(v.string()), // For group chats
      description: v.optional(v.string()),
      avatar: v.optional(v.string()), // IPFS CID
      createdBy: v.id("users"),
      isEncrypted: v.boolean(),
      xmtpTopic: v.optional(v.string()),
      lastMessageAt: v.optional(v.number()),
      lastMessage: v.optional(v.string()),
    })
    .index("by_creator", ["createdBy"])
    .index("by_last_message", ["lastMessageAt"]),

    // Conversation participants
    participants: defineTable({
      conversationId: v.id("conversations"),
      userId: v.id("users"),
      role: v.union(v.literal("admin"), v.literal("member")),
      joinedAt: v.number(),
      lastReadAt: v.optional(v.number()),
    })
    // removed duplicate index "by_conversation" (same fields as by_conversation_and_time)
    .index("by_user", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

    // Messages metadata (encrypted content stored via XMTP)
    messages: defineTable({
      conversationId: v.id("conversations"),
      senderId: v.id("users"),
      type: v.union(
        v.literal("text"),
        v.literal("image"),
        v.literal("audio"),
        v.literal("file"),
        v.literal("payment")
      ),
      
      // Encrypted content references
      xmtpMessageId: v.optional(v.string()),
      encryptedContent: v.optional(v.string()), // Fallback encrypted content
      
      // IPFS references for media
      ipfsCid: v.optional(v.string()),
      ipfsKey: v.optional(v.string()), // Encrypted AES key for IPFS content
      
      // Payment information
      tokenAddress: v.optional(v.string()),
      tokenAmount: v.optional(v.string()),
      transactionHash: v.optional(v.string()),
      
      // Message metadata
      replyToId: v.optional(v.id("messages")),
      editedAt: v.optional(v.number()),
      deletedAt: v.optional(v.number()),
      
      // Delivery status
      status: v.union(
        v.literal("sending"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed")
      ),
    })
    
    .index("by_sender", ["senderId"])
    .index("by_conversation_and_time", ["conversationId"]),

    // Message reactions
    reactions: defineTable({
      messageId: v.id("messages"),
      userId: v.id("users"),
      emoji: v.string(),
    })
    .index("by_message", ["messageId"])
    .index("by_user", ["userId"])
    .index("by_message_and_user", ["messageId", "userId"]),

    // IPFS pins for admin management
    ipfsPins: defineTable({
      cid: v.string(),
      filename: v.optional(v.string()),
      size: v.optional(v.number()),
      contentType: v.optional(v.string()),
      pinnedBy: v.id("users"),
      isPinned: v.boolean(),
      pinService: v.optional(v.string()), // "pinata", "infura", etc.
    })
    .index("by_cid", ["cid"])
    .index("by_pinned_by", ["pinnedBy"]),

    // Payment transactions
    payments: defineTable({
      messageId: v.id("messages"),
      fromAddress: v.string(),
      toAddress: v.string(),
      tokenAddress: v.string(),
      amount: v.string(),
      transactionHash: v.string(),
      blockNumber: v.optional(v.number()),
      gasUsed: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("confirmed"),
        v.literal("failed")
      ),
    })
    .index("by_message", ["messageId"])
    .index("by_transaction", ["transactionHash"])
    .index("by_from_address", ["fromAddress"])
    .index("by_to_address", ["toAddress"]),

    // Reported messages for moderation
    reports: defineTable({
      messageId: v.id("messages"),
      reportedBy: v.id("users"),
      reason: v.string(),
      description: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("reviewed"),
        v.literal("resolved")
      ),
      reviewedBy: v.optional(v.id("users")),
      reviewedAt: v.optional(v.number()),
    })
    .index("by_message", ["messageId"])
    .index("by_reporter", ["reportedBy"])
    .index("by_status", ["status"]),

    // Typing indicators
    typingIndicators: defineTable({
      conversationId: v.id("conversations"),
      userId: v.id("users"),
      isTyping: v.boolean(),
      lastTypingAt: v.number(),
    })
    .index("by_conversation", ["conversationId"])
    .index("by_user", ["userId"])
    .index("by_conversation_and_user", ["conversationId", "userId"]),

    // Push notification subscriptions
    pushSubscriptions: defineTable({
      userId: v.id("users"),
      endpoint: v.string(),
      p256dh: v.string(),
      auth: v.string(),
      userAgent: v.optional(v.string()),
      isActive: v.boolean(),
    })
    .index("by_user", ["userId"])
    .index("by_endpoint", ["endpoint"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;