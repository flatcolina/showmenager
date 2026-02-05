import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============== ARTISTS ==============
  artists: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ input }) => db.getArtists(input?.includeInactive)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getArtistById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
        photoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createArtist({ ...input, createdBy: ctx.user.id });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        contactName: z.string().optional().nullable(),
        contactPhone: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        bannerUrl: z.string().optional().nullable(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateArtist(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteArtist(input.id);
        return { success: true };
      }),
  }),

  // ============== CONTRACTORS ==============
  contractors: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ input }) => db.getContractors(input?.includeInactive)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getContractorById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        contactName: z.string().optional(),
        contactPhone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createContractor({ ...input, createdBy: ctx.user.id });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().nullable(),
        contactName: z.string().optional().nullable(),
        contactPhone: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateContractor(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContractor(input.id);
        return { success: true };
      }),
  }),

  // ============== LOCAL PARTNERS ==============
  localPartners: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ input }) => db.getLocalPartners(input?.includeInactive)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getLocalPartnerById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        nickname: z.string().optional(),
        cpf: z.string().optional(),
        cnpj: z.string().optional(),
        email: z.string().email().optional(),
        whatsapp: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createLocalPartner({ ...input, createdBy: ctx.user.id });
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        nickname: z.string().optional().nullable(),
        cpf: z.string().optional().nullable(),
        cnpj: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        whatsapp: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateLocalPartner(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteLocalPartner(input.id);
        return { success: true };
      }),
  }),

  // ============== EVENTS ==============
  events: router({
    list: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.string().optional(),
      }).optional())
      .query(async ({ input }) => db.getEvents(input)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => db.getEventById(input.id)),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => db.searchEvents(input.query)),
    
    create: protectedProcedure
      .input(z.object({
        artistId: z.number(),
        contractorId: z.number().optional(),
        localPartnerId: z.number().optional(),
        title: z.string().min(1),
        status: z.enum(["reservado", "bloqueado", "confirmado", "cancelado"]).optional(),
        eventType: z.enum(["show", "casamento", "corporativo", "tv", "gravacao", "campanha", "participacao"]).optional(),
        contractType: z.enum(["publico", "privado", "publico_privado"]).optional(),
        eventDate: z.date(),
        startTime: z.string().optional(),
        duration: z.number().optional(),
        location: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        cache: z.string().optional(),
        hasProduction: z.boolean().optional(),
        productionValue: z.string().optional(),
        productionPercentage: z.string().optional(),
        negotiationType: z.enum(["cache", "garantia", "bilheteria", "permuta"]).optional(),
        guarantee: z.string().optional(),
        ticketPercentage: z.string().optional(),
        discount: z.string().optional(),
        observations: z.string().optional(),
        paymentDueDate: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createEvent({ ...input, createdBy: ctx.user.id } as any);
        return { id };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        artistId: z.number().optional(),
        contractorId: z.number().optional().nullable(),
        localPartnerId: z.number().optional().nullable(),
        title: z.string().min(1).optional(),
        status: z.enum(["reservado", "bloqueado", "confirmado", "cancelado"]).optional(),
        eventType: z.enum(["show", "casamento", "corporativo", "tv", "gravacao", "campanha", "participacao"]).optional(),
        contractType: z.enum(["publico", "privado", "publico_privado"]).optional(),
        eventDate: z.date().optional(),
        startTime: z.string().optional().nullable(),
        duration: z.number().optional(),
        location: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        cache: z.string().optional(),
        hasProduction: z.boolean().optional(),
        productionValue: z.string().optional(),
        productionPercentage: z.string().optional(),
        negotiationType: z.enum(["cache", "garantia", "bilheteria", "permuta"]).optional(),
        guarantee: z.string().optional(),
        ticketPercentage: z.string().optional(),
        discount: z.string().optional(),
        observations: z.string().optional().nullable(),
        paymentDueDate: z.date().optional().nullable(),
        isPaid: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateEvent(id, data as any);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEvent(input.id);
        return { success: true };
      }),
  }),

  // ============== USERS MANAGEMENT ==============
  users: router({
    list: protectedProcedure
      .input(z.object({ includeInactive: z.boolean().optional() }).optional())
      .query(async ({ input }) => db.getAllUsers(input?.includeInactive)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        role: z.enum(["user", "admin", "empresario", "financeiro", "pre_producao", "contratos"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateUser(id, data);
        return { success: true };
      }),
  }),

  // ============== NOTIFICATIONS ==============
  notifications: router({
    list: protectedProcedure
      .input(z.object({ onlyUnread: z.boolean().optional() }).optional())
      .query(async ({ ctx, input }) => db.getUserNotifications(ctx.user.id, input?.onlyUnread)),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.id);
        return { success: true };
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markAllNotificationsAsRead(ctx.user.id);
        return { success: true };
      }),
  }),

  // ============== REPORTS ==============
  reports: router({
    performance: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => db.getPerformanceReport(input)),
    
    eventsByState: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => db.getEventsByState(input)),
    
    contractors: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => db.getContractorReport(input)),
    
    receivables: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => db.getReceivablesReport(input)),
    
    localPartners: protectedProcedure
      .input(z.object({
        artistId: z.number().optional(),
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input }) => db.getLocalPartnerReport(input)),
  }),
});

export type AppRouter = typeof appRouter;
