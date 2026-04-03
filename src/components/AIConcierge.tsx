import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Skull, Loader2, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

function Typewriter({ text, delay = 0, speed = 40, className }: { text: string; delay?: number; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text, speed]);

  return (
    <p className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 animate-pulse align-text-bottom" />
      )}
    </p>
  );
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;
const CLASSIFY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/classify-issue`;

type QuickAction = { label: string; action: "message" | "navigate"; value: string };

const QUICK_ACTIONS: QuickAction[] = [
  { label: "🎯 Recommend something for me", action: "message", value: "Based on what you know about me, recommend some products I'd love — consider my style, interests, and fit preferences" },
  { label: "📦 Where's my order?", action: "navigate", value: "/track" },
  { label: "🚨 Houston, order problem!", action: "message", value: "I have a problem with my order" },
  { label: "✏️ Oops! Need to edit my order", action: "message", value: "I need to edit or cancel my order" },
  { label: "↩️ I need to return something", action: "message", value: "I need to return an item" },
];

export function AIConcierge({ fullPage = false }: { fullPage?: boolean }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(fullPage);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-concierge", handler);
    return () => window.removeEventListener("open-concierge", handler);
  }, []);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSentRef = useRef<number>(0);
  const sessionIdRef = useRef(`chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      const now = Date.now();
      if (!text.trim() || isLoading || now - lastSentRef.current < 2000) return;
      lastSentRef.current = now;
      const userMsg: Msg = { role: "user", content: text.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";
      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        // Get auth token if user is logged in (for personalization)
        const { data: { session } } = await supabase.auth.getSession();
        const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ messages: updatedMessages }),
        });

        if (!resp.ok || !resp.body) {
          const errData = await resp.json().catch(() => ({}));
          upsertAssistant(
            errData.error || "Sorry, I'm having trouble right now. Try again or hit up questions@sullenclothing.com 💀"
          );
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {}
          }
        }
      } catch (err) {
        console.error("Chat error:", err);
        upsertAssistant(
          "Connection hiccup — try again or email questions@sullenclothing.com 💀"
        );
      } finally {
        setIsLoading(false);
        // Fire-and-forget: classify the user's message for issue tracking
        fetch(CLASSIFY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            source: "concierge",
            customer_message: text.trim(),
            session_id: sessionIdRef.current,
            metadata: { url: window.location.pathname },
          }),
        }).catch(() => {});
      }
    },
    [messages, isLoading]
  );

  const chatContent = (
    <div className={`flex flex-col ${fullPage ? "h-[min(600px,70vh)]" : "h-[100dvh] sm:h-[520px]"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-secondary/30">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
          <Skull className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-heading font-semibold text-foreground uppercase tracking-wider">
            Sullen Concierge
          </p>
          <p className="text-xs text-muted-foreground">AI-powered • Always here for you</p>
        </div>
        {!fullPage && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
            >
              <Skull className="w-10 h-10 text-primary mx-auto" />
            </motion.div>
            <div className="space-y-2 max-w-[280px] mx-auto">
              <Typewriter
                text="Don't trip 💀"
                delay={300}
                speed={50}
                className="text-base font-heading uppercase tracking-wider text-foreground"
              />
              <Typewriter
                text="We can get you to a human if you need it, but let me see if I can get you sorted quicker."
                delay={1000}
                speed={30}
                className="text-sm text-muted-foreground leading-relaxed"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.action === "navigate") {
                      setIsOpen(false);
                      navigate(action.value);
                    } else {
                      sendMessage(action.value);
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-secondary/60 text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:mb-1 [&_p:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Input + Escalation */}
      <div className="border-t border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2 p-3"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 bg-secondary/30 border-border text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="shrink-0 bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <div className="flex items-center justify-center gap-4 px-3 pb-3 pt-0">
          <a
            href="mailto:questions@sullenclothing.com"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-3 h-3" />
            Email a Human
          </a>
          <span className="text-border">|</span>
          <a
            href="tel:5622961894"
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-3 h-3" />
            562-296-1894
          </a>
        </div>
      </div>
    </div>
  );

  if (fullPage) return chatContent;

  return (
    <>
      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[400px] h-[100dvh] sm:h-auto bg-background border border-border sm:rounded-2xl shadow-2xl overflow-hidden"
          >
            {chatContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
