export type Id = number;

export type User = {
  id: Id;
  openId?: string;
  name?: string;
  email?: string;
  createdAt?: Date | string;
};

export type InsertUser = Omit<User, "id"> & { id?: Id };

export type Artist = { id: Id; name: string; createdAt?: Date | string; [k: string]: any };
export type InsertArtist = Omit<Artist, "id"> & { id?: Id };

export type Contractor = { id: Id; name: string; createdAt?: Date | string; [k: string]: any };
export type InsertContractor = Omit<Contractor, "id"> & { id?: Id };

export type LocalPartner = { id: Id; name: string; createdAt?: Date | string; [k: string]: any };
export type InsertLocalPartner = Omit<LocalPartner, "id"> & { id?: Id };

export type Event = { id: Id; title?: string; date?: string; ownerId?: Id; createdAt?: Date | string; [k: string]: any };
export type InsertEvent = Omit<Event, "id"> & { id?: Id };

export type EventAttachment = { id: Id; eventId: Id; url?: string; createdAt?: Date | string; [k: string]: any };
export type InsertEventAttachment = Omit<EventAttachment, "id"> & { id?: Id };

export type UserArtistPermission = { id: Id; userId: Id; artistId: Id; role?: string; [k: string]: any };
export type InsertUserArtistPermission = Omit<UserArtistPermission, "id"> & { id?: Id };

export type Notification = { id: Id; userId?: Id; message?: string; createdAt?: Date | string; [k: string]: any };
export type InsertNotification = Omit<Notification, "id"> & { id?: Id };
