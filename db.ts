import {
  type InsertUser,
  type User,
  type InsertArtist,
  type Artist,
  type InsertContractor,
  type Contractor,
  type InsertLocalPartner,
  type LocalPartner,
  type InsertEvent,
  type Event,
  type InsertEventAttachment,
  type EventAttachment,
  type InsertUserArtistPermission,
  type UserArtistPermission,
  type InsertNotification,
  type Notification,
} from "./schema";

import {
  FieldValue,
  Query,
  Timestamp,
} from "firebase-admin/firestore";

import { getFirestoreAdmin, convertTimestampsToDates } from "./firebaseAdmin";
import { ENV } from "./_core/env";

/**
 * Firestore database layer.
 *
 * Goal: keep the same exported function signatures previously backed by MySQL/Drizzle,
 * so the rest of the app (routers + client) stays unchanged.
 *
 * IDs:
 *  - We keep numeric `id` fields (like MySQL autoincrement) for compatibility.
 *  - Firestore documents use docId = String(id).
 *  - Counters are maintained at: _meta/counters (single document).
 */

type CollectionName =
  | "users"
  | "artists"
  | "contractors"
  | "localPartners"
  | "events"
  | "eventAttachments"
  | "userArtistPermissions"
  | "notifications";

const COLLECTIONS: Record<CollectionName, string> = {
  users: "users",
  artists: "artists",
  contractors: "contractors",
  localPartners: "localPartners",
  events: "events",
  eventAttachments: "eventAttachments",
  userArtistPermissions: "userArtistPermissions",
  notifications: "notifications",
};

function db() {
  return getFirestoreAdmin();
}

async function nextId(name: CollectionName): Promise<number> {
  const ref = db().collection("_meta").doc("counters");
  const out = await db().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const data = (snap.exists ? snap.data() : {}) as Record<string, number>;
    const current = typeof data[name] === "number" ? data[name] : 0;
    const next = current + 1;
    tx.set(ref, { [name]: next }, { merge: true });
    return next;
  });
  return out;
}

function withDefaults<T extends Record<string, any>>(obj: T, defaults: Partial<T>): T {
  return { ...defaults, ...obj };
}

function toDateOrNull(v: any): Date | null {
  if (v === undefined) return null;
  if (v === null) return null;
  if (v instanceof Date) return v;
  if (v instanceof Timestamp) return v.toDate();
  return new Date(v);
}

async function getByNumericId<T>(name: CollectionName, id: number): Promise<T | null> {
  const snap = await db().collection(COLLECTIONS[name]).doc(String(id)).get();
  if (!snap.exists) return null;
  return convertTimestampsToDates(snap.data() as any) as T;
}

async function listCollection<T>(name: CollectionName): Promise<T[]> {
  const snap = await db().collection(COLLECTIONS[name]).get();
  return snap.docs
    .map(d => convertTimestampsToDates(d.data() as any) as T)
    .sort((a: any, b: any) => (a?.id ?? 0) - (b?.id ?? 0));
}

function orderByNameAsc<T extends { name?: string | null }>(items: T[]): T[] {
  return items.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "pt-BR"));
}

function orderByCreatedAtDesc<T extends { createdAt?: Date }>(items: T[]): T[] {
  return items.sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
}

// ============== USER FUNCTIONS ==============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  // Find by openId
  const q = await db()
    .collection(COLLECTIONS.users)
    .where("openId", "==", user.openId)
    .limit(1)
    .get();

  const now = new Date();
  if (!q.empty) {
    const doc = q.docs[0];
    const existing = doc.data() as any;
    const patch: any = {
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    const fields = ["name", "email", "loginMethod", "phone", "photoUrl"] as const;
    for (const f of fields) {
      if ((user as any)[f] !== undefined) patch[f] = (user as any)[f] ?? null;
    }
    if (user.role !== undefined) patch.role = user.role;
    if (user.isActive !== undefined) patch.isActive = user.isActive;
    // owner override
    if (!user.role && user.openId === ENV.ownerOpenId) patch.role = "admin";
    await doc.ref.set(patch, { merge: true });
    return;
  }

  const id = await nextId("users");
  const values: User = {
    id,
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    phone: user.phone ?? null,
    photoUrl: user.photoUrl ?? null,
    loginMethod: user.loginMethod ?? null,
    role: (user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user")) as any,
    isActive: user.isActive ?? true,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: user.lastSignedIn ?? now,
  };
  await db().collection(COLLECTIONS.users).doc(String(id)).set(values);
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const q = await db().collection(COLLECTIONS.users).where("openId", "==", openId).limit(1).get();
  if (q.empty) return undefined;
  return convertTimestampsToDates(q.docs[0].data() as any) as User;
}

export async function getAllUsers(includeInactive = false): Promise<User[]> {
  const users = await listCollection<User>("users");
  const filtered = includeInactive ? users : users.filter(u => u.isActive);
  return orderByNameAsc(filtered);
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const ref = db().collection(COLLECTIONS.users).doc(String(id));
  await ref.set({ ...data, updatedAt: new Date() } as any, { merge: true });
}

// ============== ARTIST FUNCTIONS ==============
export async function createArtist(data: InsertArtist) {
  const id = await nextId("artists");
  const now = new Date();
  const doc: Artist = withDefaults(
    {
      id,
      name: data.name,
      email: data.email ?? null,
      contactName: data.contactName ?? null,
      contactPhone: data.contactPhone ?? null,
      photoUrl: data.photoUrl ?? null,
      bannerUrl: data.bannerUrl ?? null,
      color: data.color ?? "#10B981",
      isActive: data.isActive ?? true,
      createdBy: data.createdBy ?? null,
      createdAt: now,
      updatedAt: now,
    } as any,
    {}
  );
  await db().collection(COLLECTIONS.artists).doc(String(id)).set(doc as any);
  return id;
}

export async function getArtists(includeInactive = false): Promise<Artist[]> {
  const items = await listCollection<Artist>("artists");
  const filtered = includeInactive ? items : items.filter(a => a.isActive);
  return orderByNameAsc(filtered);
}

export async function getArtistById(id: number) {
  return getByNumericId<Artist>("artists", id);
}

export async function updateArtist(id: number, data: Partial<InsertArtist>) {
  await db()
    .collection(COLLECTIONS.artists)
    .doc(String(id))
    .set({ ...data, updatedAt: new Date() } as any, { merge: true });
}

export async function deleteArtist(id: number) {
  await updateArtist(id, { isActive: false } as any);
}

// ============== CONTRACTOR FUNCTIONS ==============
export async function createContractor(data: InsertContractor) {
  const id = await nextId("contractors");
  const now = new Date();
  const doc: Contractor = {
    id,
    name: data.name,
    email: data.email ?? null,
    contactName: data.contactName ?? null,
    contactPhone: data.contactPhone ?? null,
    isActive: data.isActive ?? true,
    createdBy: data.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  } as any;
  await db().collection(COLLECTIONS.contractors).doc(String(id)).set(doc as any);
  return id;
}

export async function getContractors(includeInactive = false): Promise<Contractor[]> {
  const items = await listCollection<Contractor>("contractors");
  const filtered = includeInactive ? items : items.filter(a => a.isActive);
  return orderByNameAsc(filtered);
}

export async function getContractorById(id: number) {
  return getByNumericId<Contractor>("contractors", id);
}

export async function updateContractor(id: number, data: Partial<InsertContractor>) {
  await db()
    .collection(COLLECTIONS.contractors)
    .doc(String(id))
    .set({ ...data, updatedAt: new Date() } as any, { merge: true });
}

export async function deleteContractor(id: number) {
  await updateContractor(id, { isActive: false } as any);
}

// ============== LOCAL PARTNER FUNCTIONS ==============
export async function createLocalPartner(data: InsertLocalPartner) {
  const id = await nextId("localPartners");
  const now = new Date();
  const doc: LocalPartner = {
    id,
    name: data.name,
    nickname: data.nickname ?? null,
    cpf: data.cpf ?? null,
    cnpj: data.cnpj ?? null,
    email: data.email ?? null,
    whatsapp: data.whatsapp ?? null,
    isActive: data.isActive ?? true,
    createdBy: data.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  } as any;
  await db().collection(COLLECTIONS.localPartners).doc(String(id)).set(doc as any);
  return id;
}

export async function getLocalPartners(includeInactive = false): Promise<LocalPartner[]> {
  const items = await listCollection<LocalPartner>("localPartners");
  const filtered = includeInactive ? items : items.filter(a => a.isActive);
  return orderByNameAsc(filtered);
}

export async function getLocalPartnerById(id: number) {
  return getByNumericId<LocalPartner>("localPartners", id);
}

export async function updateLocalPartner(id: number, data: Partial<InsertLocalPartner>) {
  await db()
    .collection(COLLECTIONS.localPartners)
    .doc(String(id))
    .set({ ...data, updatedAt: new Date() } as any, { merge: true });
}

export async function deleteLocalPartner(id: number) {
  await updateLocalPartner(id, { isActive: false } as any);
}

// ============== EVENT FUNCTIONS ==============

function normalizeEventForFirestore(data: Partial<InsertEvent>) {
  const out: any = { ...data };
  if ("eventDate" in out) out.eventDate = out.eventDate ? toDateOrNull(out.eventDate) : out.eventDate;
  if ("paymentDueDate" in out) out.paymentDueDate = out.paymentDueDate ? toDateOrNull(out.paymentDueDate) : out.paymentDueDate;
  return out;
}

export async function createEvent(data: InsertEvent) {
  const id = await nextId("events");
  const now = new Date();

  const doc: Event = {
    id,
    artistId: data.artistId,
    contractorId: data.contractorId ?? null,
    localPartnerId: data.localPartnerId ?? null,
    title: data.title,
    status: (data.status ?? "reservado") as any,
    eventType: (data.eventType ?? "show") as any,
    contractType: (data.contractType ?? "publico") as any,
    eventDate: toDateOrNull(data.eventDate)!,
    startTime: data.startTime ?? null,
    duration: data.duration ?? 60,
    location: data.location ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    cache: (data.cache ?? "0") as any,
    hasProduction: data.hasProduction ?? false,
    productionValue: (data.productionValue ?? "0") as any,
    productionPercentage: (data.productionPercentage ?? "0") as any,
    negotiationType: (data.negotiationType ?? "cache") as any,
    guarantee: (data.guarantee ?? "0") as any,
    ticketPercentage: (data.ticketPercentage ?? "0") as any,
    discount: (data.discount ?? "0") as any,
    observations: data.observations ?? null,
    paymentDueDate: data.paymentDueDate ? (toDateOrNull(data.paymentDueDate) as any) : null,
    isPaid: data.isPaid ?? false,
    createdBy: data.createdBy ?? null,
    createdAt: now,
    updatedAt: now,
  } as any;

  await db().collection(COLLECTIONS.events).doc(String(id)).set(doc as any);
  return id;
}

export async function getEvents(filters?: {
  artistId?: number;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}) {
  let q: Query = db().collection(COLLECTIONS.events);
  if (filters?.artistId) q = q.where("artistId", "==", filters.artistId);
  if (filters?.status) q = q.where("status", "==", filters.status);
  if (filters?.startDate) q = q.where("eventDate", ">=", filters.startDate);
  if (filters?.endDate) q = q.where("eventDate", "<=", filters.endDate);
  q = q.orderBy("eventDate", "asc");

  const snap = await q.get();
  return snap.docs.map(d => convertTimestampsToDates(d.data() as any) as Event);
}

export async function getEventById(id: number) {
  return getByNumericId<Event>("events", id);
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const ref = db().collection(COLLECTIONS.events).doc(String(id));
  await ref.set({ ...normalizeEventForFirestore(data), updatedAt: new Date() } as any, { merge: true });
}

export async function deleteEvent(id: number) {
  // Firestore doesn't have FK constraints; hard-delete like prior Drizzle delete.
  await db().collection(COLLECTIONS.events).doc(String(id)).delete();
  // Also cleanup attachments
  const att = await db().collection(COLLECTIONS.eventAttachments).where("eventId", "==", id).get();
  const batch = db().batch();
  att.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

export async function searchEvents(query: string) {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return [] as Event[];
  // No full-text index by default; do an in-memory scan (limit to recent 1000 for safety).
  const snap = await db()
    .collection(COLLECTIONS.events)
    .orderBy("eventDate", "desc")
    .limit(1000)
    .get();

  const items = snap.docs.map(d => convertTimestampsToDates(d.data() as any) as Event);
  return items
    .filter(e => {
      const hay = [e.title, e.city, e.state, e.location, e.observations]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (a.eventDate?.getTime?.() ?? 0) - (b.eventDate?.getTime?.() ?? 0));
}

// ============== EVENT ATTACHMENTS ==============
export async function createEventAttachment(data: InsertEventAttachment) {
  const id = await nextId("eventAttachments");
  const now = new Date();
  const doc: EventAttachment = {
    id,
    eventId: data.eventId,
    type: (data.type ?? "gerencial") as any,
    fileName: data.fileName,
    fileUrl: data.fileUrl,
    fileKey: data.fileKey ?? null,
    mimeType: data.mimeType ?? null,
    createdAt: now,
  } as any;
  await db().collection(COLLECTIONS.eventAttachments).doc(String(id)).set(doc as any);
  return id;
}

export async function getEventAttachments(eventId: number) {
  const snap = await db().collection(COLLECTIONS.eventAttachments).where("eventId", "==", eventId).get();
  return snap.docs.map(d => convertTimestampsToDates(d.data() as any) as EventAttachment);
}

export async function deleteEventAttachment(id: number) {
  await db().collection(COLLECTIONS.eventAttachments).doc(String(id)).delete();
}

// ============== USER-ARTIST PERMISSIONS ==============
export async function upsertUserArtistPermission(data: InsertUserArtistPermission) {
  // Unique by userId+artistId
  const snap = await db()
    .collection(COLLECTIONS.userArtistPermissions)
    .where("userId", "==", data.userId)
    .where("artistId", "==", data.artistId)
    .limit(1)
    .get();

  const now = new Date();
  if (!snap.empty) {
    await snap.docs[0].ref.set({ canManage: data.canManage, createdAt: snap.docs[0].data().createdAt ?? now }, { merge: true });
    return;
  }
  const id = await nextId("userArtistPermissions");
  const doc: UserArtistPermission = {
    id,
    userId: data.userId,
    artistId: data.artistId,
    canManage: data.canManage ?? false,
    createdAt: now,
  } as any;
  await db().collection(COLLECTIONS.userArtistPermissions).doc(String(id)).set(doc as any);
}

export async function getUserArtistPermissions(userId: number) {
  const snap = await db().collection(COLLECTIONS.userArtistPermissions).where("userId", "==", userId).get();
  return snap.docs.map(d => convertTimestampsToDates(d.data() as any) as UserArtistPermission);
}

export async function getArtistUserPermissions(artistId: number) {
  const snap = await db().collection(COLLECTIONS.userArtistPermissions).where("artistId", "==", artistId).get();
  return snap.docs.map(d => convertTimestampsToDates(d.data() as any) as UserArtistPermission);
}

// ============== NOTIFICATIONS ==============
export async function createNotification(data: InsertNotification) {
  const id = await nextId("notifications");
  const now = new Date();
  const doc: Notification = {
    id,
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: (data.type ?? "info") as any,
    isRead: data.isRead ?? false,
    relatedEventId: data.relatedEventId ?? null,
    createdAt: now,
  } as any;
  await db().collection(COLLECTIONS.notifications).doc(String(id)).set(doc as any);
  return id;
}

export async function getUserNotifications(userId: number, onlyUnread = false) {
  let q: Query = db().collection(COLLECTIONS.notifications).where("userId", "==", userId);
  if (onlyUnread) q = q.where("isRead", "==", false);
  // Firestore supports ordering by createdAt; if not present, fallback after fetch.
  try {
    q = q.orderBy("createdAt", "desc");
  } catch {
    // ignore
  }
  const snap = await q.limit(50).get();
  const items = snap.docs.map(d => convertTimestampsToDates(d.data() as any) as Notification);
  return orderByCreatedAtDesc(items).slice(0, 50);
}

export async function markNotificationAsRead(id: number) {
  await db().collection(COLLECTIONS.notifications).doc(String(id)).set({ isRead: true } as any, { merge: true });
}

export async function markAllNotificationsAsRead(userId: number) {
  const snap = await db().collection(COLLECTIONS.notifications).where("userId", "==", userId).where("isRead", "==", false).get();
  const batch = db().batch();
  snap.docs.forEach(d => batch.set(d.ref, { isRead: true } as any, { merge: true }));
  await batch.commit();
}

// ============== REPORTS ==============

type ReportFilters = { artistId?: number; startDate: Date; endDate: Date };

async function getEventsInRange(filters: ReportFilters): Promise<Event[]> {
  return getEvents({
    artistId: filters.artistId,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
}

function toMoney(v: any): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/\./g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

export async function getPerformanceReport(filters: ReportFilters) {
  const events = await getEventsInRange(filters);
  const byStatus: Record<string, { count: number; total: number }> = {};
  for (const e of events) {
    const key = e.status ?? "reservado";
    if (!byStatus[key]) byStatus[key] = { count: 0, total: 0 };
    byStatus[key].count += 1;
    byStatus[key].total += toMoney(e.cache);
  }
  return Object.entries(byStatus)
    .map(([status, v]) => ({ status, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total);
}

export async function getEventsByState(filters: ReportFilters) {
  const events = await getEventsInRange(filters);
  const byState: Record<string, number> = {};
  for (const e of events) {
    const st = (e.state ?? "--").toUpperCase();
    byState[st] = (byState[st] ?? 0) + 1;
  }
  return Object.entries(byState)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getContractorReport(filters: ReportFilters) {
  const events = await getEventsInRange(filters);
  const contractors = await getContractors(true);
  const contractorById = new Map(contractors.map(c => [c.id, c] as const));
  const agg: Record<string, { contractorId: number | null; name: string; count: number; total: number }> = {};

  for (const e of events) {
    const id = e.contractorId ?? null;
    const name = id ? contractorById.get(id)?.name ?? `#${id}` : "(Sem contratante)";
    const key = String(id ?? 0);
    if (!agg[key]) agg[key] = { contractorId: id, name, count: 0, total: 0 };
    agg[key].count += 1;
    agg[key].total += toMoney(e.cache);
  }

  return Object.values(agg).sort((a, b) => b.total - a.total);
}

export async function getReceivablesReport(filters: ReportFilters) {
  const events = await getEventsInRange(filters);
  const rows = events
    .map(e => ({
      id: e.id,
      title: e.title,
      eventDate: e.eventDate,
      paymentDueDate: e.paymentDueDate ?? null,
      isPaid: !!e.isPaid,
      cache: toMoney(e.cache),
      artistId: e.artistId,
    }))
    .sort((a, b) => (a.paymentDueDate?.getTime?.() ?? 0) - (b.paymentDueDate?.getTime?.() ?? 0));
  return rows;
}

export async function getLocalPartnerReport(filters: ReportFilters) {
  const events = await getEventsInRange(filters);
  const partners = await getLocalPartners(true);
  const partnerById = new Map(partners.map(p => [p.id, p] as const));
  const agg: Record<string, { localPartnerId: number | null; name: string; count: number; total: number }> = {};

  for (const e of events) {
    const id = e.localPartnerId ?? null;
    const name = id ? partnerById.get(id)?.name ?? `#${id}` : "(Sem parceiro local)";
    const key = String(id ?? 0);
    if (!agg[key]) agg[key] = { localPartnerId: id, name, count: 0, total: 0 };
    agg[key].count += 1;
    agg[key].total += toMoney(e.cache);
  }

  return Object.values(agg).sort((a, b) => b.total - a.total);
}
