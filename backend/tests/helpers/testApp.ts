import express from "express";
import { AppDataSource } from "../../src/config/data-source";
import { AuthController } from "../../src/controllers/authController";
import { TaskController } from "../../src/controllers/taskController";
import { AdminController } from "../../src/controllers/adminController";
import { DeveloperController } from "../../src/controllers/developerController";
import { authenticate, requireRole } from "../../src/middleware/auth";
import { validateBody } from "../../src/middleware/validate";
import {
  loginSchema,
  registerSchema,
  createUserSchema,
  createTaskSchema,
  updateTaskSchema,
} from "../../src/schemas";
import { UserRole } from "../../src/entities/User";

/**
 * Builds an Express app that mirrors the real route wiring in src/index.ts
 * (minus the boot side-effects) so the controllers can be exercised through HTTP
 * with supertest.
 */
export function createApp() {
  const app = express();
  app.use(express.json());

  app.post("/api/auth/register", validateBody(registerSchema), AuthController.register);
  app.post("/api/auth/login", validateBody(loginSchema), AuthController.login);

  app.get("/api/me", authenticate, DeveloperController.me);

  app.post(
    "/api/tasks",
    authenticate,
    requireRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEAD),
    validateBody(createTaskSchema),
    TaskController.create
  );
  app.get("/api/tasks", authenticate, TaskController.list);
  app.patch("/api/tasks/:id", authenticate, validateBody(updateTaskSchema), TaskController.update);
  app.patch("/api/tasks/:id/status", authenticate, TaskController.updateStatus);

  app.get("/api/admin/users", authenticate, requireRole(UserRole.ADMIN), AdminController.listUsers);
  app.post(
    "/api/admin/users",
    authenticate,
    requireRole(UserRole.ADMIN),
    validateBody(createUserSchema),
    AdminController.createUser
  );

  return app;
}

/** Chainable QueryBuilder stub used by the entity repositories. */
export function createQueryBuilderMock() {
  const qb: any = {};
  qb.select = jest.fn(() => qb);
  qb.addSelect = jest.fn(() => qb);
  qb.leftJoinAndSelect = jest.fn(() => qb);
  qb.innerJoinAndSelect = jest.fn(() => qb);
  qb.leftJoin = jest.fn(() => qb);
  qb.where = jest.fn(() => qb);
  qb.andWhere = jest.fn(() => qb);
  qb.orWhere = jest.fn(() => qb);
  qb.orderBy = jest.fn(() => qb);
  qb.addOrderBy = jest.fn(() => qb);
  qb.groupBy = jest.fn(() => qb);
  qb.skip = jest.fn(() => qb);
  qb.take = jest.fn(() => qb);
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawOne = jest.fn().mockResolvedValue(null);
  return qb;
}

export function createRepoMock() {
  return {
    find: jest.fn().mockResolvedValue([]),
    findBy: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((data: any) => ({ ...data })),
    save: jest.fn((data: any) => Promise.resolve({ ...data, id: data?.id ?? 1 })),
    insert: jest.fn().mockResolvedValue({ identifiers: [{ id: 1 }] }),
    update: jest.fn().mockResolvedValue({ affected: 1 }),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
    createQueryBuilder: jest.fn(() => createQueryBuilderMock()),
  };
}

/**
 * Replaces the mocked AppDataSource methods with a fresh, per-test repository
 * registry. Returns `repoFor(Entity)` so tests can stub return values.
 */
export function mockDataSource() {
  const repos = new Map<any, any>();
  const getRepository = jest.fn((entity: any) => {
    if (!repos.has(entity)) repos.set(entity, createRepoMock());
    return repos.get(entity);
  });

  const ds: any = AppDataSource as any;
  ds.getRepository = getRepository;
  ds.transaction = jest.fn(async (cb: any) => cb({ getRepository }));
  ds.getMetadata = jest.fn(() => ({ findColumnWithPropertyName: () => undefined }));

  const repoFor = (entity: any) => getRepository(entity) as any;
  return { getRepository, repoFor };
}
