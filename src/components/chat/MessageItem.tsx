import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Sender = {
  _id: string;
  name?: string;
  ensName?: string;
  walletAddress?: string;
  image?: string;
};

type Message = {
  _id: string;
  _creationTime: number;
  type: "text" | "image" | "audio" | "file" | "payment";
  encryptedContent?: string;
  sender?: Sender | null;
};

type CurrentUser = {
  _id: string;
  name?: string;
  ensName?: string;
  walletAddress?: string;
  image?: string;
};

interface MessageItemProps {
  message: Message;
  me: CurrentUser;
}

export function MessageItem({ message, me }: MessageItemProps) {
  const isMe = message.sender?._id === me._id;

  const senderName =
    message.sender?.name ||
    message.sender?.ensName ||
    (message.sender?.walletAddress
      ? `${message.sender.walletAddress.slice(0, 6)}...${message.sender.walletAddress.slice(-4)}`
      : "Unknown");

  const time = new Date(message._creationTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const senderAvatarSrc =
    message.sender?.image ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      message.sender?.walletAddress || message.sender?._id || "unknown"
    )}`;

  const meAvatarSrc =
    me.image ||
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
      me.walletAddress || me._id
    )}`;

  const bubbleText =
    message.type === "text"
      ? message.encryptedContent
      : message.type === "image"
      ? "Sent an image"
      : message.type === "audio"
      ? "Sent an audio message"
      : message.type === "file"
      ? "Sent a file"
      : message.type === "payment"
      ? "Sent a payment"
      : "Message";

  return (
    <div
      className={`flex items-start space-x-3 ${isMe ? "justify-end" : ""}`}
      key={message._id}
    >
      {!isMe && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={senderAvatarSrc}
            alt={message.sender?.name || message.sender?.ensName || message.sender?.walletAddress || "User"}
          />
          <AvatarFallback>
            {senderName?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={`flex-1 ${isMe ? "flex justify-end" : ""}`}>
        <div className="max-w-md">
          <div
            className={`flex items-center ${
              isMe ? "justify-end space-x-2" : "space-x-2"
            } mb-1`}
          >
            {!isMe && <span className="text-sm font-medium">{senderName}</span>}
            <span className="text-xs text-muted-foreground">{time}</span>
            {isMe && <span className="text-sm font-medium">You</span>}
          </div>
          <div
            className={`${
              isMe
                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-md"
                : "bg-muted rounded-2xl rounded-tl-md"
            } p-3`}
          >
            <p className="text-sm">{bubbleText}</p>
          </div>
          <div className={`mt-1 ${isMe ? "text-right" : "text-left"}`}>
            <span className="text-[10px] text-muted-foreground">
              {new Date(message._creationTime).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
      {isMe && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={meAvatarSrc}
            alt={me.name || me.ensName || me.walletAddress || "You"}
          />
          <AvatarFallback>
            {me.name?.charAt(0) ||
              me.walletAddress?.slice(2, 4).toUpperCase() ||
              "Y"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
