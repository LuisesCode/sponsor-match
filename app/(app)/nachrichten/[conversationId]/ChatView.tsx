"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { formatDayLabel, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import type { Message } from "@/lib/supabase/types";
import { MESSAGE_MAX_LENGTH, messageSchema } from "@/lib/validation/message";

/**
 * Chatverlauf + Senden + Realtime: neue Nachrichten kommen per
 * Supabase-Realtime (postgres_changes, RLS-gefiltert) herein; beim Öffnen
 * werden empfangene Nachrichten und zugehörige Notifications als gelesen
 * markiert.
 */
export function ChatView({
  conversationId,
  myProfileId,
  counterpartName,
  initialMessages,
}: {
  conversationId: string;
  myProfileId: string;
  counterpartName: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const appendMessage = React.useCallback((message: Message) => {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
    );
  }, []);

  /** Empfangene Nachrichten + zugehörige Notifications als gelesen markieren. */
  const markRead = React.useCallback(
    async (messageIds: string[]) => {
      if (messageIds.length === 0) return;
      const readAt = new Date().toISOString();
      await supabase
        .from("messages")
        .update({ read_at: readAt })
        .in("id", messageIds)
        .is("read_at", null);
      await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .contains("payload", { conversation_id: conversationId })
        .is("read_at", null);
    },
    [supabase, conversationId]
  );

  // Beim Öffnen: alles Ungelesene der Gegenseite als gelesen markieren,
  // danach Server-Render (Header-Badge, Liste) auffrischen.
  React.useEffect(() => {
    const unread = initialMessages
      .filter((m) => m.sender_profile_id !== myProfileId && m.read_at == null)
      .map((m) => m.id);
    if (unread.length > 0) {
      void markRead(unread).then(() => router.refresh());
    }
    // Nur beim ersten Mount — spätere Nachrichten behandelt der Realtime-Handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime: neue Nachrichten dieser Konversation abonnieren.
  React.useEffect(() => {
    let active = true;

    const channel = supabase.channel(`messages-${conversationId}`);

    async function subscribe() {
      // RLS-gefilterte postgres_changes brauchen das Auth-Token im Realtime-Socket.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session) await supabase.realtime.setAuth(session.access_token);

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const message = payload.new as Message;
            appendMessage(message);
            if (message.sender_profile_id !== myProfileId) {
              void markRead([message.id]);
            }
          }
        )
        .subscribe();
    }

    void subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase, conversationId, myProfileId, appendMessage, markRead]);

  // Bei neuen Nachrichten ans Ende scrollen.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function send() {
    const parsed = messageSchema.safeParse({ conversationId, body });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Bitte schreib eine Nachricht.");
      return;
    }
    setSending(true);
    setError(null);

    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_profile_id: myProfileId,
        body: parsed.data.body,
      })
      .select("*")
      .single();

    setSending(false);
    if (insertError || !message) {
      console.error("Nachricht senden fehlgeschlagen:", insertError);
      setError("Deine Nachricht konnte nicht gesendet werden. Bitte versuch es noch einmal.");
      return;
    }
    appendMessage(message);
    setBody("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) void send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Verlauf */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: "55vh",
          minHeight: 240,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          padding: "var(--space-5)",
        }}
      >
        {messages.length === 0 && (
          <p style={{ margin: "auto", color: "var(--text-muted)", fontSize: "var(--fs-sm)", textAlign: "center" }}>
            Noch keine Nachrichten — sag {counterpartName} kurz, worum es dir geht.
          </p>
        )}
        {messages.map((message, i) => {
          const mine = message.sender_profile_id === myProfileId;
          const prev = messages[i - 1];
          const showDay =
            !prev ||
            formatDayLabel(prev.created_at) !== formatDayLabel(message.created_at);
          return (
            <React.Fragment key={message.id}>
              {showDay && (
                <div
                  style={{
                    alignSelf: "center",
                    margin: "var(--space-3) 0 var(--space-2)",
                    fontSize: "var(--fs-2xs)",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {formatDayLabel(message.created_at)}
                </div>
              )}
              <div
                style={{
                  alignSelf: mine ? "flex-end" : "flex-start",
                  maxWidth: "75%",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-lg)",
                  borderBottomRightRadius: mine ? "var(--radius-xs)" : "var(--radius-lg)",
                  borderBottomLeftRadius: mine ? "var(--radius-lg)" : "var(--radius-xs)",
                  background: mine ? "var(--primary)" : "var(--surface-2)",
                  color: mine ? "var(--on-primary)" : "var(--text)",
                }}
              >
                <p style={{ margin: 0, whiteSpace: "pre-line", lineHeight: "var(--lh-normal)", overflowWrap: "anywhere" }}>
                  {message.body}
                </p>
                <span
                  style={{
                    display: "block",
                    marginTop: 4,
                    fontSize: "var(--fs-2xs)",
                    opacity: 0.7,
                    textAlign: "right",
                  }}
                >
                  {formatTime(message.created_at)}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Eingabe */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "var(--space-4) var(--space-5)" }}>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
          <Textarea
            aria-label={`Nachricht an ${counterpartName}`}
            placeholder="Deine Nachricht … (Enter zum Senden)"
            rows={2}
            value={body}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(e) => {
              setBody(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={onKeyDown}
            error={error}
            hint={
              body.length > MESSAGE_MAX_LENGTH - 200
                ? `${body.length}/${MESSAGE_MAX_LENGTH} Zeichen`
                : undefined
            }
          />
          <Button
            type="button"
            variant="primary"
            onClick={() => void send()}
            loading={sending}
            disabled={body.trim().length === 0}
            style={{ marginBottom: error || body.length > MESSAGE_MAX_LENGTH - 200 ? 24 : 0 }}
          >
            Senden
          </Button>
        </div>
      </div>
    </div>
  );
}
