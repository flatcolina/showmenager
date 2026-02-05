export type Id = number;

// NOTE: These types intentionally mirror the fields used across the codebase.
// In the original project, these came from Drizzle/MySQL schema inference.
// For the Firestore port, we keep a lightweight local schema so the server
// compiles cleanly while preserving runtime behavior.

export type User = {
  id: Id;
  openId?: string;
  name?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  loginMethod?: "google" | "password" | "magic_link" | "oauth" | string;
  role?: "admin" | "manager" | "viewer" | string;
  isActive?: boolean;
  lastSignedIn?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type InsertUser = Omit<User, "id"> & { id?: Id };

export type Artist = { id: Id; name: string; createdAt?: Date; [k: string]: any };
export type InsertArtist = Omit<Artist, "id"> & { id?: Id };

export type Contractor = { id: Id; name: string; createdAt?: Date; [k: string]: any };
export type InsertContractor = Omit<Contractor, "id"> & { id?: Id };

export type LocalPartner = { id: Id; name: string; createdAt?: Date; [k: string]: any };
export type InsertLocalPartner = Omit<LocalPartner, "id"> & { id?: Id };

export type Event = {
  id: Id;
  title?: string;
  date?: string;
  ownerId?: Id;
  createdAt?: Date;
  [k: string]: any;
};
export type InsertEvent = Omit<Event, "id"> & { id?: Id };

export type EventAttachment = {
  id: Id;
  eventId: Id;
  url?: string;
  createdAt?: Date;
  [k: string]: any;
};
export type InsertEventAttachment = Omit<EventAttachment, "id"> & { id?: Id };

export type UserArtistPermission = {
  id: Id;
  userId: Id;
  artistId: Id;
  role?: string;
  createdAt?: Date;
  [k: string]: any;
};
export type InsertUserArtistPermission = Omit<UserArtistPermission, "id"> & { id?: Id };

export type Notification = {
  id: Id;
  userId?: Id;
  message?: string;
  createdAt?: Date;
  [k: string]: any;
};
export type InsertNotification = Omit<Notification, "id"> & { id?: Id };
