import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { getDb } from "@/db/client";
import { getMessages, markConversationRead, sendMessage } from "@/db/repositories/conversations";
import { formatDayLabel, formatTime } from "@/lib/format";
import type { Message } from "@/lib/types";
import { MESSAGE_MAX_LENGTH, messageSchema } from "@/lib/validation/message";

/**
 * Chatverlauf + Senden — portiert aus ChatView.tsx. Echtes Realtime ist ohne
 * Server nicht möglich (siehe Plan); stattdessen liest diese Komponente beim
 * Öffnen und alle 3s neu aus sql.js — reicht, um z.B. nach einem Rollentausch
 * (Logout/Login als Gegenseite im selben Tab) neue Nachrichten zu sehen.
 */
export function ChatView({
  conversationId,
  myProfileId,
  counterpartName,
}: {
  conversationId: string;
  myProfileId: string;
  counterpartName: string;
}) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(async () => {
    const db = await getDb();
    setMessages(getMessages(db, conversationId));
  }, [conversationId]);

  React.useEffect(() => {
    void (async () => {
      const db = await getDb();
      markConversationRead(db, conversationId, myProfileId);
      await refresh();
    })();
  }, [conversationId, myProfileId, refresh]);

  React.useEffect(() => {
    const interval = setInterval(() => void refresh(), 3000);
    return () => clearInterval(interval);
  }, [refresh]);

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
    const db = await getDb();
    sendMessage(db, conversationId, myProfileId, parsed.data.body);
    setSending(false);
    setBody("");
    await refresh();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) void send();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
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
          const showDay = !prev || formatDayLabel(prev.created_at) !== formatDayLabel(message.created_at);
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
                <span style={{ display: "block", marginTop: 4, fontSize: "var(--fs-2xs)", opacity: 0.7, textAlign: "right" }}>
                  {formatTime(message.created_at)}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

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
            hint={body.length > MESSAGE_MAX_LENGTH - 200 ? `${body.length}/${MESSAGE_MAX_LENGTH} Zeichen` : undefined}
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
