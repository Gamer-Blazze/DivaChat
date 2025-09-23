import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Plus, 
  Search, 
  Settings, 
  Wallet,
  Shield,
  Users,
  Send,
  Paperclip,
  Coins,
  MoreVertical,
  Phone,
  Video
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConversationCard } from "@/components/chat/ConversationCard";
import { MessageItem } from "@/components/chat/MessageItem";

export default function Chat() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [publicText, setPublicText] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatWallet, setNewChatWallet] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Add: message query limit
  const MESSAGE_LIMIT = 100;

  // Add: small helper to format relative last seen time
  const formatLastSeen = (ts: number) => {
    const diff = Date.now() - ts;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Redirect if not authenticated or wallet not connected
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user?.walletAddress) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, user?.walletAddress, navigate]);

  // Get user's conversations
  const conversations = useQuery(api.conversations.getUserConversations);
  // Create a non-null list to satisfy TypeScript ("conversation" is possibly null)
  const conversationList = (conversations ?? []).filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

  // Add: mutations for public chat and general sending
  const getOrCreatePublic = useMutation(api.conversations.getOrCreatePublicConversation);
  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const createConversation = useMutation(api.conversations.createConversation);

  // Add: lookup target user by wallet for new direct chat (skips when input empty)
  const targetUser = useQuery(
    api.users.getUserByWallet,
    newChatWallet.trim() ? { walletAddress: newChatWallet.trim() } : "skip"
  );

  // Add: resolve the active conversation for header display name
  const activeConversation =
    selectedConversation
      ? (conversationList.find(c => c._id === selectedConversation) ?? null)
      : null;

  // Add: live messages for selected conversation
  const messages = useQuery(
    api.messages.getMessages,
    selectedConversation
      ? { conversationId: selectedConversation as any, limit: MESSAGE_LIMIT }
      : "skip"
  );

  // Add: compute avatar for chat header (other participant for direct chat or conversation avatar for group)
  const headerAvatar = (() => {
    if (!activeConversation) return { src: undefined as string | undefined, initial: "U", alt: "Conversation" };

    if (activeConversation.type === "group") {
      const src = activeConversation.avatar as string | undefined;
      return {
        src,
        initial: "G",
        alt: activeConversation.name || "Group",
      };
    }

    const other = (activeConversation.participants ?? [])
      .filter((p): p is NonNullable<typeof p> => p != null)
      .find((p) => p._id !== user?._id);

    const src =
      other?.image ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
        (other?.walletAddress as string | undefined) || (other?._id as string | undefined) || "unknown"
      )}`;

    const display =
      other?.name ||
      other?.ensName ||
      (other?.walletAddress ? `${other.walletAddress.slice(0, 6)}...${other.walletAddress.slice(-4)}` : "User");

    return {
      src,
      initial: (display?.charAt(0)?.toUpperCase() || "U") as string,
      alt: display || "User",
    };
  })();

  // Add: resolve other participant for direct chats to support header chat options
  const otherParticipant =
    activeConversation?.type === "direct"
      ? ((activeConversation.participants ?? [])
          .filter((p): p is NonNullable<typeof p> => p != null)
          .find((p) => p._id !== user?._id) ?? null)
      : null;

  // Add: move auto-scroll effect above any early returns so hooks are unconditional
  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedConversation, (messages ?? []).length]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading DivaChat...</p>
        </div>
      </div>
    );
  }

  // Add: handler for sending public chat message
  const handleSendPublic = async () => {
    const text = publicText.trim();
    if (!text) return;
    try {
      const publicConversationId = await getOrCreatePublic({});
      await sendMessageMutation({
        conversationId: publicConversationId,
        type: "text",
        encryptedContent: text,
      });
      setPublicText("");
      setSelectedConversation(publicConversationId);
      toast("Sent to Public chat");
    } catch {
      toast("Failed to send to Public chat");
    }
  };

  // Update: send in selected conversation via backend
  const handleSendMessage = async () => {
    const text = messageText.trim();
    if (!text || !selectedConversation) return;

    try {
      await sendMessageMutation({
        conversationId: selectedConversation as any,
        type: "text",
        encryptedContent: text,
      });
      setMessageText("");
    } catch {
      toast("Failed to send message");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-screen flex bg-background"
    >
      {/* Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">DivaChat</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setWalletModalOpen(true)}>
                <Wallet className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* User info */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.walletAddress || user._id)}`}
                alt={user.name || user.ensName || user.walletAddress || "User"}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-muted text-foreground font-semibold">
                {user.name?.charAt(0) || user.walletAddress?.slice(2, 4).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">
                {user.name || user.ensName || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "No wallet"}
              </p>
              {/* Add: Last seen */}
              {typeof user.lastSeen === "number" && (
                <p className="text-[10px] text-muted-foreground">
                  Last Seen & Last Time Active {formatLastSeen(user.lastSeen)}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Encrypted
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <span className="text-sm font-medium text-muted-foreground">Conversations</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setNewChatOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {conversationList.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {conversationList.map((conversation) => (
                  <motion.div
                    key={conversation._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ConversationCard
                      conversation={conversation as any}
                      selected={selectedConversation === conversation._id}
                      onSelect={(id) => setSelectedConversation(id)}
                      currentUser={{ _id: user._id }}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    {/* Replace placeholder with real user/group avatar (with identicon fallback) */}
                    <AvatarImage src={headerAvatar.src} alt={headerAvatar.alt} />
                    <AvatarFallback>
                      {headerAvatar.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {activeConversation
                        ? (
                            activeConversation.name ||
                            (
                              (activeConversation.participants ?? [])
                                .filter((p): p is NonNullable<typeof p> => p != null)
                                .find(p => p._id !== user._id)?.name
                            ) ||
                            "Unknown"
                          )
                        : "Conversation"}
                    </h3>
                    <p className="text-sm text-muted-foreground">3 members • End-to-end encrypted</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="h-4 w-4" />
                  </Button>
                  {/* Replace dropdown menu with a Popover for better runtime stability */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-56">
                      <div className="text-xs font-medium text-muted-foreground mb-2">
                        Chat Options
                      </div>
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            if (activeConversation?.type === "direct" && otherParticipant) {
                              toast(`Viewing ${otherParticipant.name || otherParticipant.ensName || "Profile"}`);
                            } else {
                              toast("Group details coming soon");
                            }
                          }}
                        >
                          View Profile / Details
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={async () => {
                            if (activeConversation?.type === "direct" && otherParticipant?.walletAddress) {
                              await navigator.clipboard.writeText(otherParticipant.walletAddress);
                              toast("Wallet address copied");
                            } else {
                              toast("No wallet address available");
                            }
                          }}
                        >
                          Copy Wallet Address
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setNewChatOpen(true)}
                        >
                          Start New Chat
                        </Button>
                        <Separator className="my-1" />
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            toast("Mute is not implemented yet");
                          }}
                        >
                          Mute
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => {
                            toast("Delete conversation is not implemented yet");
                          }}
                        >
                          Delete Conversation
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {(messages ?? []).map((m) => (
                  <MessageItem key={m._id} message={m as any} me={user as any} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Coins className="h-4 w-4" />
                      <span className="text-xs ml-1">Attach Token</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => {
                        if (!user.walletAddress) {
                          toast("No wallet connected");
                          return;
                        }
                        setMessageText((prev) => `${prev}${prev ? " " : ""}${user.walletAddress}`);
                        toast("Wallet address inserted");
                      }}
                    >
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs ml-1">Insert Address</span>
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type a message... (encrypted via XMTP)"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      className="px-4"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to DivaChat</h3>
              <p className="text-muted-foreground mb-6">
                Select a conversation to start chatting securely with end-to-end encryption.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Direct Chat Dialog */}
      <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Chat</DialogTitle>
            <DialogDescription>Enter a wallet address to start a direct chat.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="0x... wallet address"
              value={newChatWallet}
              onChange={(e) => setNewChatWallet(e.target.value)}
            />
            {newChatWallet.trim() !== "" && (
              <div className="rounded-md border p-3 text-sm">
                {targetUser === undefined ? (
                  <span className="text-muted-foreground">Searching...</span>
                ) : targetUser === null ? (
                  <span className="text-red-500">No user found for that address</span>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {targetUser.name || targetUser.ensName || "Unnamed"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {targetUser.walletAddress
                          ? `${targetUser.walletAddress.slice(0, 6)}...${targetUser.walletAddress.slice(-4)}`
                          : "No wallet"}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (!targetUser?._id) return;
                        try {
                          const id = await createConversation({
                            type: "direct",
                            participantIds: [targetUser._id],
                          });
                          toast("Chat created");
                          setSelectedConversation(id as any);
                          setNewChatOpen(false);
                          setNewChatWallet("");
                        } catch {
                          toast("Failed to create chat");
                        }
                      }}
                    >
                      Create Chat
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Modal */}
      <Dialog open={walletModalOpen} onOpenChange={setWalletModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mr-2">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              Wallet
            </DialogTitle>
            <DialogDescription>
              Manage your connected wallet for DivaChat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/40">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.image || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.walletAddress || user._id)}`}
                  alt={user.name || user.ensName || user.walletAddress || "User"}
                />
                <AvatarFallback>
                  {user.name?.charAt(0) || user.walletAddress?.slice(2, 4).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {user.name || user.ensName || "Anonymous"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.walletAddress
                    ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
                    : "No wallet connected"}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Encrypted
              </Badge>
            </div>

            {user.walletAddress && (
              <div className="flex items-center justify-between rounded-md border p-2">
                <code className="text-xs break-all pr-2">
                  {user.walletAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(user.walletAddress!);
                    toast("Wallet address copied");
                  }}
                >
                  Copy
                </Button>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setWalletModalOpen(false);
                navigate("/auth");
              }}
            >
              Manage / Connect Wallet
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                try {
                  await signOut();
                  toast("Disconnected wallet");
                  setWalletModalOpen(false);
                  navigate("/auth");
                } catch {
                  toast("Failed to disconnect");
                }
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}