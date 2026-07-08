import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/auth/SessionContext";
import { getDb } from "@/db/client";
import {
  getNotificationOverviews,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationOverview,
} from "@/db/repositories/notifications";
import { formatMessageTimestamp } from "@/lib/format";

/** Anfragen/Updates zu Deals & Nachrichten — Vorbild NotificationBell aus dem Design-Handoff. */
export function NotificationBell() {
  const { profile } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationOverview[]>([]);
  const [unread, setUnread] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const reload = React.useCallback(async () => {
    if (!profile) return;
    const db = await getDb();
    setItems(getNotificationOverviews(db, profile.id));
    setUnread(getUnreadNotificationCount(db, profile.id));
  }, [profile]);

  React.useEffect(() => {
    void reload();
  }, [reload, location.pathname]);

  React.useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (!profile) return null;

  const handleItemClick = async (item: NotificationOverview) => {
    setOpen(false);
    const db = await getDb();
    markNotificationRead(db, item.notification.id);
    void reload();
    navigate(item.link);
  };

  const handleMarkAllRead = async () => {
    const db = await getDb();
    markAllNotificationsRead(db, profile.id);
    void reload();
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Benachrichtigungen"
        style={{
          position: "relative",
          width: 38,
          height: 38,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: "var(--surface)",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 17,
              height: 17,
              padding: "0 4px",
              borderRadius: "var(--radius-pill)",
              background: "var(--energy)",
              color: "var(--on-energy)",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 10,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 340,
            maxWidth: "90vw",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-xl)",
            zIndex: 40,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-3) var(--space-4)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "var(--fs-sm)" }}>
              Benachrichtigungen
            </span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void handleMarkAllRead()}>
                Alle gelesen
              </Button>
            )}
          </div>
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items.length === 0 && (
              <p style={{ margin: 0, padding: "var(--space-6) var(--space-4)", textAlign: "center", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
                Keine Benachrichtigungen.
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.notification.id}
                type="button"
                onClick={() => void handleItemClick(item)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "var(--space-3) var(--space-4)",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  background: item.notification.read_at ? "transparent" : "color-mix(in srgb, var(--primary) 6%, transparent)",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{item.title}</span>
                  {!item.notification.read_at && (
                    <span style={{ marginTop: 4, width: 7, height: 7, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                  )}
                </div>
                {item.body && (
                  <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}>{item.body}</p>
                )}
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--fs-2xs)", color: "var(--text-subtle)" }}>
                  {formatMessageTimestamp(item.notification.created_at)}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
