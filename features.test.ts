import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Artists Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Verify the procedure exists and is callable
    expect(caller.artists.list).toBeDefined();
    expect(typeof caller.artists.list).toBe("function");
  });

  it("should have create procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.artists.create).toBeDefined();
    expect(typeof caller.artists.create).toBe("function");
  });

  it("should have update procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.artists.update).toBeDefined();
    expect(typeof caller.artists.update).toBe("function");
  });
});

describe("Contractors Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.contractors.list).toBeDefined();
    expect(typeof caller.contractors.list).toBe("function");
  });

  it("should have create procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.contractors.create).toBeDefined();
    expect(typeof caller.contractors.create).toBe("function");
  });
});

describe("Local Partners Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.localPartners.list).toBeDefined();
    expect(typeof caller.localPartners.list).toBe("function");
  });

  it("should have create procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.localPartners.create).toBeDefined();
    expect(typeof caller.localPartners.create).toBe("function");
  });
});

describe("Events Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.events.list).toBeDefined();
    expect(typeof caller.events.list).toBe("function");
  });

  it("should have create procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.events.create).toBeDefined();
    expect(typeof caller.events.create).toBe("function");
  });

  it("should have search procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.events.search).toBeDefined();
    expect(typeof caller.events.search).toBe("function");
  });
});

describe("Reports Router", () => {
  it("should have performance procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.performance).toBeDefined();
    expect(typeof caller.reports.performance).toBe("function");
  });

  it("should have eventsByState procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.eventsByState).toBeDefined();
    expect(typeof caller.reports.eventsByState).toBe("function");
  });

  it("should have contractors procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.contractors).toBeDefined();
    expect(typeof caller.reports.contractors).toBe("function");
  });

  it("should have receivables procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.receivables).toBeDefined();
    expect(typeof caller.reports.receivables).toBe("function");
  });

  it("should have localPartners procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.reports.localPartners).toBeDefined();
    expect(typeof caller.reports.localPartners).toBe("function");
  });
});

describe("Users Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.users.list).toBeDefined();
    expect(typeof caller.users.list).toBe("function");
  });

  it("should have update procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.users.update).toBeDefined();
    expect(typeof caller.users.update).toBe("function");
  });
});

describe("Notifications Router", () => {
  it("should have list procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.notifications.list).toBeDefined();
    expect(typeof caller.notifications.list).toBe("function");
  });

  it("should have markAsRead procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.notifications.markAsRead).toBeDefined();
    expect(typeof caller.notifications.markAsRead).toBe("function");
  });
});

describe("Auth Router", () => {
  it("should have me procedure defined", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.auth.me).toBeDefined();
    expect(typeof caller.auth.me).toBe("function");
  });

  it("should return user from me procedure", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("admin");
  });
});
