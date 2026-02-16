import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { SalonChat } from "@shared/schema";

interface SalonChatDialogProps {
  salonId: string;
  salonName: string;
}

export function SalonChatDialog({ salonId, salonName }: SalonChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<SalonChat[]>({
    queryKey: ['/api/salons', salonId, 'chat', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await fetch(`/api/salons/${salonId}/chat/${user.id}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open && !!user?.id,
    refetchInterval: open ? 5000 : false,
  });

  const sendMutation = useMutation({
    mutationFn: async (msg: string) => {
      return apiRequest("POST", `/api/salons/${salonId}/chat`, { message: msg });
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salonId, 'chat', user?.id] });
    },
  });

  useEffect(() => {
    if (open && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && user?.id) {
      fetch(`/api/salons/${salonId}/chat/${user.id}/read`, {
        method: 'PUT',
        credentials: 'include',
      });
    }
  }, [open, salonId, user?.id]);

  if (!isAuthenticated) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 rounded-full w-14 h-14 shadow-lg bg-purple-600 hover:bg-purple-700 p-0"
        title="Chat with salon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b bg-purple-600 text-white rounded-t-lg">
            <DialogTitle className="text-white flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with {salonName}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {isLoading ? (
              <div className="text-center text-gray-500 py-8">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Start a conversation</p>
                <p className="text-sm">Send a message to the salon owner about services, availability, or any questions.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      msg.senderType === 'customer'
                        ? 'bg-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border rounded-bl-md shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.senderType === 'customer' ? 'text-purple-200' : 'text-gray-400'}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t bg-white rounded-b-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  sendMutation.mutate(message);
                }
              }}
              className="flex gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sendMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || sendMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
