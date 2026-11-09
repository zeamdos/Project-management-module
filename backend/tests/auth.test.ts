import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createApp, mockDataSource } from "./helpers/testApp";
import { User, UserRole, UserStatus } from "../src/entities/User";
import { Organization } from "../src/entities/Organization";

const app = createApp();

const JWT_SECRET = "test-secret";

function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

describe("POST /api/auth/login", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 with a token and user for valid credentials", async () => {
    const password = "Passw0rd!23";
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = {
      id: 5,
      orgId: 1,
      email: "dev@enterprise.com",
      passwordHash,
      name: "Dev User",
      role: UserRole.DEVELOPER,
      specialty: "Frontend",
      status: UserStatus.ACTIVE,
    };

    const userRepo = ds.repoFor(User);
    userRepo.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(existing),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dev@enterprise.com", password });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.user).toMatchObject({
      id: 5,
      email: "dev@enterprise.com",
      role: UserRole.DEVELOPER,
    });
  });

  it("returns 401 for invalid credentials", async () => {
    const existing = {
      id: 6,
      orgId: 1,
      email: "dev@enterprise.com",
      passwordHash: await bcrypt.hash("CorrectPassword!1", 10),
      name: "Dev User",
      role: UserRole.DEVELOPER,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
      lockedUntil: null,
    };

    const userRepo = ds.repoFor(User);
    userRepo.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(existing),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "dev@enterprise.com", password: "wrong-password" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "" });
    expect(res.status).toBe(400);
    expect(res.body.errors ?? res.body.error).toBeDefined();
  });
});

describe("POST /api/auth/register", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 201 with the new user id and role for valid data", async () => {
    ds.repoFor(User).findOne.mockResolvedValue(null);
    ds.repoFor(Organization).findOne.mockResolvedValue({ id: 1, name: "Enterprise HQ" });

    const res = await request(app).post("/api/auth/register").send({
      name: "New Dev",
      email: "new.dev@enterprise.com",
      password: "Passw0rd!23",
      specialty: "Frontend",
    });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe(UserRole.DEVELOPER);
    expect(res.body.userId).toBeDefined();
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new.dev@enterprise.com" });

    expect(res.status).toBe(400);
    expect(res.body.errors ?? res.body.error).toBeDefined();
  });
});

describe("GET /api/me", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 with the user profile for a valid token", async () => {
    const user = {
      id: 5,
      orgId: 1,
      name: "Dev User",
      email: "dev@enterprise.com",
      role: UserRole.DEVELOPER,
      specialty: "Frontend",
      status: UserStatus.ACTIVE,
    };
    ds.repoFor(User).findOne.mockResolvedValue(user);

    const token = signToken({ id: 5, orgId: 1, role: UserRole.DEVELOPER, email: user.email });
    const res = await request(app).get("/api/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 5, email: "dev@enterprise.com", role: UserRole.DEVELOPER });
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/me");
    expect(res.status).toBe(401);
  });
});
