import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp, mockDataSource } from "./helpers/testApp";
import { Task, TaskStatus } from "../src/entities/Task";
import { Project } from "../src/entities/Project";
import { Team } from "../src/entities/Team";
import { User, UserRole } from "../src/entities/User";

const app = createApp();
const JWT_SECRET = "test-secret";

function signToken(role: UserRole = UserRole.MANAGER) {
  return jwt.sign({ id: 1, orgId: 1, role, email: "manager@enterprise.com" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

const managerAuth = () => `Bearer ${signToken(UserRole.MANAGER)}`;
const developerAuth = () => `Bearer ${signToken(UserRole.DEVELOPER)}`;

function taskRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    projectId: 1,
    project: { id: 1, name: "Apollo", orgId: 1 },
    teamId: null,
    team: null,
    title: "Build login page",
    description: null,
    status: TaskStatus.TODO,
    requiredRole: "frontend",
    assigneeId: null,
    assignee: null,
    deadline: null,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };
}

describe("GET /api/tasks", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 with the task list for a valid token", async () => {
    ds.repoFor(Task).createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([taskRow()]),
    });

    const res = await request(app).get("/api/tasks").set("Authorization", developerAuth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(res.body.tasks[0]).toMatchObject({ id: 1, title: "Build login page" });
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/tasks", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 201 with the created task for valid data", async () => {
    ds.repoFor(Project).findOne.mockResolvedValue({ id: 1, name: "Apollo", orgId: 1 });
    ds.repoFor(Task).findOne.mockResolvedValue(taskRow({ title: "New Task" }));

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", managerAuth())
      .send({ projectId: 1, title: "New Task" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "New Task", projectName: "Apollo" });
  });

  it("returns 400 for an invalid team (validation)", async () => {
    ds.repoFor(Project).findOne.mockResolvedValue({ id: 1, name: "Apollo", orgId: 1 });
    ds.repoFor(Team).findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", managerAuth())
      .send({ projectId: 1, title: "New Task", teamId: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 404 when the project does not exist", async () => {
    ds.repoFor(Project).findOne.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", managerAuth())
      .send({ projectId: 12345, title: "Orphan Task" });

    expect(res.status).toBe(404);
  });

  it("returns 403 for a developer (insufficient role)", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", developerAuth())
      .send({ projectId: 1, title: "Nope" });

    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/tasks/:id", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 with the updated task for valid data", async () => {
    const existing = taskRow({ title: "Old Title" });
    ds.repoFor(Task).findOne.mockResolvedValue(existing);
    ds.repoFor(Task).save.mockImplementation((t: any) => Promise.resolve(t));

    const res = await request(app)
      .patch("/api/tasks/1")
      .set("Authorization", managerAuth())
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, title: "Updated Title" });
  });
});

describe("PATCH /api/tasks/:id/status", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 when moving to a valid status", async () => {
    const existing = taskRow({ status: TaskStatus.TODO });
    const taskRepo = ds.repoFor(Task);
    taskRepo.findOne.mockResolvedValue(existing);
    taskRepo.save.mockImplementation((t: any) => Promise.resolve(t));

    const res = await request(app)
      .patch("/api/tasks/1/status")
      .set("Authorization", managerAuth())
      .send({ status: TaskStatus.IN_PROGRESS });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
  });
});
