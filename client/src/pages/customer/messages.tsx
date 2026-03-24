import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowLeft, Send, MessageSquare, Scissors, Clock, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Conversation {
  salon_id: string;
  salon_name: string;
  salon_image: string | null;
  salon_address: string | null;
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function CustomerMessages() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeSalonId, setActiveSalonId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const userId = (user as any)?.id;

  const { data: conversations = [], isLoading: loadingConvs } = useQuery<Conversation[]>({
    queryKey: ["/api/customer/chat-conversations"],
    enabled: !!userId,
    refetchInterval: 10000,
  });

  const activeSalon = conversations.find((c) => c.salon_id === activeSalonId);

  const { data: messages = [], isLoading: loadingMsgs } = useQuery<ChatMessage[]>({
    queryKey: ["/api/salons", activeSalonId, "chat", userId],
    queryFn: () => apiRequest("GET", `/api/salons/${activeSalonId}/chat/${userId}`),
    enabled: !!activeSalonId && !!userId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: (msg: string) =>
      apiRequest("POST", `/api/salons/${activeSalonId}/chat`, { message: msg }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", activeSalonId, "chat", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/customer/chat-conversations"] });
      setText("");
    },
  });

  const markReadMutation = useMutation({
    mutationFn: () =>
      apiRequest("PUT", `/api/salons/${activeSalonId}/chat/${userId}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer/chat-conversations"] });
    },
  });

  useEffect(() => {
    if (activeSalonId) markReadMutation.mutate();
  }, [activeSalonId, messages.length]);

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

  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0);

  const filtered = conversations
    .slice()
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    .filter((c) => !search || c.salon_name.toLowerCase().includes(search.toLowerCase()));

  // ─── Chat Window ───────────────────────────────────────────────────────────
  if (activeSalonId) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100dvh - 116px)" }}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveSalonId(null)}
            className="p-2 -ml-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <Avatar className="h-10 w-10 ring-2 ring-purple-100">
            <AvatarImage src={activeSalon?.salon_image || ""} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
              {activeSalon?.salon_name?.[0] || "S"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gray-900 truncate">{activeSalon?.salon_name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
              <p className="text-[11px] text-gray-400 truncate">Online</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {loadingMsgs ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                  <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-40" : "w-52")} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Say hello!</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                Ask about services, pricing, or availability.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isMe = msg.senderType === "customer";
                return (
                  <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarImage src={activeSalon?.salon_image || ""} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-[10px] font-bold">
                          {activeSalon?.salon_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-[72%] flex flex-col", isMe ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                          isMe
                            ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-sm"
                            : "bg-white text-gray-900 rounded-bl-sm border border-gray-100"
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
        <div className="px-3 py-2.5 bg-white border-t border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none py-1.5"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Conversation List ──────────────────────────────────────────────────────
  return (
    <div className="bg-gray-50 min-h-[calc(100dvh-116px)]">
      {/* Gradient Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 px-5 pt-6 pb-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          {totalUnread > 0 && (
            <span className="bg-white text-purple-700 text-xs font-bold px-3 py-1 rounded-full shadow">
              {totalUnread} new
            </span>
          )}
        </div>
        <p className="text-purple-100 text-sm">Your salon conversations</p>
      </div>

      {/* Search bar (pulled up over gradient) */}
      <div className="px-4 -mt-5">
        <div className="bg-white rounded-2xl shadow-md flex items-center gap-3 px-4 py-3">
          <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="mt-4 pb-4">
        {loadingConvs ? (
          <div className="px-4 space-y-3 mt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-5">
              <Scissors className="h-10 w-10 text-purple-300" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              {search ? "No results" : "No messages yet"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {search
                ? "Try a different search term."
                : "Visit a salon and start chatting to ask questions or get booking updates."}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/explore")}
                className="bg-purple-600 text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow hover:bg-purple-700 active:scale-95 transition-all"
              >
                Browse Salons
              </button>
            )}
          </div>
        ) : (
          <div className="px-4 space-y-3">
            {filtered.map((conv) => (
              <button
                key={conv.salon_id}
                onClick={() => setActiveSalonId(conv.salon_id)}
                className="w-full bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm border border-gray-100 active:scale-[0.98] transition-transform text-left"
              >
                {/* Avatar with unread dot */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-13 w-13 ring-2 ring-purple-50" style={{ height: 52, width: 52 }}>
                    <AvatarImage src={conv.salon_image || ""} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                      {conv.salon_name?.[0] || "S"}
                    </AvatarFallback>
                  </Avatar>
                  {conv.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-purple-600 text-white text-[10px] font-bold px-1.5 shadow">
                      {conv.unread_count}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={cn("text-sm truncate", conv.unread_count > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800")}>
                      {conv.salon_name}
                    </span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={cn("text-xs truncate", conv.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-400")}>
                    {conv.last_sender_type === "customer" ? "You: " : ""}
                    {conv.last_message}
                  </p>
                </div>

                {/* Unread indicator line */}
                {conv.unread_count > 0 && (
                  <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
