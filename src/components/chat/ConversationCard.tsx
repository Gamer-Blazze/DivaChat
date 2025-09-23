import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

type Participant = {
  _id: string;
  name?: string;
  ensName?: string;
  walletAddress?: string;
  image?: string;
};

type Conversation = {
  _id: string;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  participants?: Array<Participant | null | undefined>;
};

type CurrentUser = {
  _id: string;
};

interface ConversationCardProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: (id: string) => void;
  currentUser: CurrentUser;
}

export function ConversationCard({
  conversation,
  selected,
  onSelect,
  currentUser,
}: ConversationCardProps) {
  const other = (conversation.participants ?? [])
    .filter((p): p is Participant => p != null)
    .find((p) => p._id !== currentUser._id);

  const imgSrc =
    conversation.type === "group"
      ? (conversation.avatar as string | undefined)
      : other?.image ||
        `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
          other?.walletAddress || other?._id || "unknown"
        )}`;

  const alt =
    conversation.type === "group"
      ? conversation.name || "Group"
      : other?.name || other?.ensName || other?.walletAddress || "User";

  const title =
    conversation.name ||
    (conversation.participants ?? [])
      .filter((p): p is Participant => p != null)
      .find((p) => p._id !== currentUser._id)?.name ||
    "Unknown";

  const time =
    conversation.lastMessageAt &&
    new Date(conversation.lastMessageAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        selected ? "bg-primary/10 border-primary/20" : ""
      }`}
      onClick={() => onSelect(conversation._id)}
    >
      <CardContent className="p-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={imgSrc} alt={alt} />
            <AvatarFallback className="text-[10px]">
              {conversation.type === "group" ? (
                <Users className="h-4 w-4" />
              ) : (
                (other?.name?.charAt(0)?.toUpperCase() ||
                  other?.walletAddress?.slice(2, 3)?.toUpperCase() ||
                  "U")
              )}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm truncate">{title}</p>
              <span className="text-[10px] text-muted-foreground">
                {time || ""}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {conversation.lastMessage || "No messages yet"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
