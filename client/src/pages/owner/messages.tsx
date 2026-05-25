import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Send, MessageSquare, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuery as useQ } from "@tanstack/react-query";

interface Conversation {
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_image: string | null;
  last_message: string;
  last_sender_type: "customer" | "owner";
  last_message_at: string;
  unread_count: number;
}

interface ChatMessage {
  id: string;
  salonId: string;
  customerId: string;
  senderType: "customer" | "owner";
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Salon {
  id: string;
  name: string;
  imageUrl?: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function OwnerMessages() {
  const { user } = useAuth();
  const [activeCustomer, setActiveCustomer] = useState<Conversation | null>(null);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const userId = (user as any)?.id;

  // Get owner's salon
  const { data: ownerSalon } = useQuery<Salon>({
    queryKey: ["/api/owner/salon"],
    enabled: !!userId,
  });

  const salonId = ownerSalon?.id;

  // Get conversations for this salon
  const { data: conversations = [], isLoading: loadingConvs } = useQuery<Conversation[]>({
    queryKey: ["/api/salons", salonId, "conversations"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/salons/${salonId}/conversations`); return r.json(); },
    enabled: !!salonId,
    refetchInterval: 10000,
  });

  const totalUnread = Array.isArray(conversations) ? conversations.reduce((s, c) => s + (c.unread_count || 0), 0) : 0;

  // Get messages for active conversation
  const { data: messages = [], isLoading: loadingMsgs } = useQuery<ChatMessage[]>({
    queryKey: ["/api/salons", salonId, "chat", activeCustomer?.customer_id],
    queryFn: async () => { const r = await apiRequest("GET", `/api/salons/${salonId}/chat/${activeCustomer!.customer_id}`); return r.json(); },
    enabled: !!salonId && !!activeCustomer,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/salons/${salonId}/chat`, {
        message: msg,
        customerId: activeCustomer?.customer_id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salonId, "chat", activeCustomer?.customer_id] });
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salonId, "conversations"] });
      setText("");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/salons/${salonId}/chat/${activeCustomer!.customer_id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salonId, "conversations"] });
    },
  });

  useEffect(() => {
    if (activeCustomer && salonId) {
      markReadMutation.mutate();
    }
  }, [activeCustomer?.customer_id, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || sendMutation.isPending) return;
    sendMutation.mutate(msg);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (activeCustomer) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-white dark:bg-gray-900 dark:border-gray-800 flex-shrink-0 sticky top-0 z-10">
          <button
            onClick={() => setActiveCustomer(null)}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <Avatar className="h-9 w-9">
            <AvatarImage src={activeCustomer.customer_image || ""} />
            <AvatarFallback className="bg-purple-100 text-purple-700 text-sm font-semibold">
              {activeCustomer.customer_name?.[0] || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {activeCustomer.customer_name || "Customer"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {activeCustomer.customer_email}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-gray-950">
          {loadingMsgs ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex", i % 2 !== 0 ? "justify-end" : "justify-start")}>
                  <Skeleton className={cn("h-10 rounded-2xl", i % 2 !== 0 ? "w-40" : "w-48")} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
              <p className="text-xs text-gray-500 mt-1">Send a message to start the conversation.</p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.senderType === "owner";
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={activeCustomer.customer_image || ""} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">
                          {activeCustomer.customer_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[72%]", "flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isMe
                            ? "bg-purple-600 text-white rounded-br-sm"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                        )}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Reply to customer..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none py-1.5"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Customer Messages</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {ownerSalon?.name ? `Messages for ${ownerSalon.name}` : "Your customer conversations"}
            </p>
          </div>
          {totalUnread > 0 && (
            <Badge className="bg-purple-600 text-white">{totalUnread} unread</Badge>
          )}
        </div>
      </div>

      {loadingConvs ? (
        <div className="px-4 space-y-4 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-5">
            <MessageSquare className="h-10 w-10 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No messages yet</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            When customers message your salon, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y dark:divide-gray-800">
          {conversations
            .slice()
            .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
            .map((conv) => (
              <button
                key={conv.customer_id}
                onClick={() => setActiveCustomer(conv)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.customer_image || ""} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                      {conv.customer_name?.[0] || "C"}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("text-sm truncate", conv.unread_count > 0 ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-800 dark:text-gray-200")}>
                      {conv.customer_name || "Customer"}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={cn("text-xs truncate", conv.unread_count > 0 ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-500 dark:text-gray-400")}>
                    {conv.last_sender_type === "owner" ? "You: " : ""}
                    {conv.last_message}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
