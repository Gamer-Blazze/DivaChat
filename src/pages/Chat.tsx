import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Chat() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Get user's conversations
  const conversations = useQuery(api.conversations.getUserConversations);
  // Create a non-null list to satisfy TypeScript ("conversation" is possibly null)
  const conversationList = (conversations ?? []).filter(
    (c): c is NonNullable<typeof c> => c !== null
  );

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

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;
    
    // TODO: Implement message sending with XMTP encryption
    console.log("Sending message:", messageText);
    setMessageText("");
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
              <AvatarImage src={user.image} />
              <AvatarFallback>
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
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
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
                    <Card 
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedConversation === conversation._id ? "bg-primary/10 border-primary/20" : ""
                      }`}
                      onClick={() => setSelectedConversation(conversation._id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback>
                              {conversation.type === "group" ? (
                                <Users className="h-5 w-5" />
                              ) : (
                                ((conversation.participants ?? [])
                                  .filter((p): p is NonNullable<typeof p> => p != null)[0]
                                  ?.name?.charAt(0)) ?? "U"
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {conversation.name || 
                                 (
                                   (conversation.participants ?? [])
                                     .filter((p): p is NonNullable<typeof p> => p != null)
                                     .find(p => p._id !== user._id)?.name
                                 ) ||
                                 "Unknown"}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {conversation.lastMessageAt ? 
                                  new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : ""
                                }
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage || "No messages yet"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Group Chat</h3>
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
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Sample messages */}
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">Alice</span>
                      <span className="text-xs text-muted-foreground">2:30 PM</span>
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-2 w-2 mr-1" />
                        Encrypted
                      </Badge>
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-md p-3 max-w-md">
                      <p className="text-sm">Hey everyone! Just deployed my new DeFi contract 🚀</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 flex justify-end">
                    <div className="max-w-md">
                      <div className="flex items-center justify-end space-x-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          <Coins className="h-2 w-2 mr-1" />
                          0.1 ETH
                        </Badge>
                        <span className="text-xs text-muted-foreground">2:32 PM</span>
                        <span className="text-sm font-medium">You</span>
                      </div>
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md p-3">
                        <p className="text-sm">Congrats! Here's a little celebration bonus 🎉</p>
                      </div>
                    </div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>Y</AvatarFallback>
                  </Avatar>
                </div>
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
                <AvatarImage src={user.image} />
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