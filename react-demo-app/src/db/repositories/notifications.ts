import type { SqlDatabase } from "../client";
import { select, selectOne, exec, newId, nowIso } from "../query";
import type { Deal, Notification, NotificationPayload, NotificationType, Profile } from "@/lib/types";

/** Benachrichtigung anlegen — wird von deals.ts/conversations.ts nach Statuswechseln aufgerufen. */
export function createNotification(
  db: SqlDatabase,
  profileId: string,
  type: NotificationType,
  payload: NotificationPayload
): void {
  exec(
    db,
    "insert into notifications (id, profile_id, type, payload, read_at, created_at) values (?, ?, ?, ?, null, ?)",
    [newId(), profileId, type, JSON.stringify(payload), nowIso()]
  );
}

export type NotificationOverview = {
  notification: Notification;
  actor: Profile | null;
  dealTitle: string | null;
  title: string;
  body: string | null;
  link: string;
};

function describe(
  n: Notification,
  actor: Profile | null,
  dealTitle: string | null
): { title: string; body: string | null; link: string } {
  const actorName = actor?.display_name ?? "Jemand";
  switch (n.type) {
    case "new_message":
      return {
        title: `Neue Nachricht von ${actorName}`,
        body: null,
        link: `/nachrichten/${n.payload.conversation_id}`,
      };
    case "deal_proposed":
      return {
        title: `${actorName} hat dir einen Deal vorgeschlagen`,
        body: dealTitle,
        link: `/deals/${n.payload.deal_id}`,
      };
    case "deal_countered":
      return {
        title: `${actorName} hat ein Gegenangebot gemacht`,
        body: dealTitle,
        link: `/deals/${n.payload.deal_id}`,
      };
    case "contract_accepted":
      return {
        title: `${actorName} hat dem Vertrag zugestimmt`,
        body: dealTitle,
        link: `/deals/${n.payload.deal_id}`,
      };
    case "deal_status_changed":
      return {
        title: `Deal-Status geändert: ${dealTitle ?? ""}`.trim(),
        body: n.payload.new_status ? `Neuer Status: ${n.payload.new_status}` : null,
        link: `/deals/${n.payload.deal_id}`,
      };
    default:
      return { title: "Benachrichtigung", body: null, link: "/dashboard" };
  }
}

export function getNotificationOverviews(db: SqlDatabase, myProfileId: string, limit = 30): NotificationOverview[] {
  const rows = select<Notification & { payload: string }>(
    db,
    "select * from notifications where profile_id = ? order by created_at desc limit ?",
    [myProfileId, limit]
  );
  return rows.map((row) => {
    const notification: Notification = { ...row, payload: JSON.parse(row.payload) };
    const actor = notification.payload.actor_profile_id
      ? selectOne<Profile>(db, "select * from profiles where id = ?", [notification.payload.actor_profile_id])
      : null;
    const dealTitle = notification.payload.deal_id
      ? selectOne<Deal>(db, "select title from deals where id = ?", [notification.payload.deal_id])?.title ?? null
      : null;
    return { notification, actor, dealTitle, ...describe(notification, actor, dealTitle) };
  });
}

export function getUnreadNotificationCount(db: SqlDatabase, myProfileId: string): number {
  return (
    select<{ n: number }>(db, "select count(*) as n from notifications where profile_id = ? and read_at is null", [
      myProfileId,
    ])[0]?.n ?? 0
  );
}

export function markNotificationRead(db: SqlDatabase, id: string): void {
  exec(db, "update notifications set read_at = ? where id = ? and read_at is null", [nowIso(), id]);
}

export function markAllNotificationsRead(db: SqlDatabase, myProfileId: string): void {
  exec(db, "update notifications set read_at = ? where profile_id = ? and read_at is null", [nowIso(), myProfileId]);
}
