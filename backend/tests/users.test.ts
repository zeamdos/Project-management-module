import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp, mockDataSource } from "./helpers/testApp";
import { User, UserRole, UserStatus } from "../src/entities/User";
import { Organization } from "../src/entities/Organization";

const app = createApp();
const JWT_SECRET = "test-secret";

function signToken(role: UserRole) {
  return jwt.sign({ id: 1, orgId: 1, role, email: "user@enterprise.com" }, JWT_SECRET, {
    expiresIn: "1h",
  });
}

const adminAuth = () => `Bearer ${signToken(UserRole.ADMIN)}`;
const developerAuth = () => `Bearer ${signToken(UserRole.DEVELOPER)}`;

describe("GET /api/admin/users", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  it("returns 200 with a paginated roster for an admin", async () => {
    ds.repoFor(User).findAndCount.mockResolvedValue([
      [
        {
          id: 1,
          orgId: 1,
          name: "Master Admin",
          email: "admin@enterprise.com",
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      ],
      1,
    ]);

    const res = await request(app).get("/api/admin/users").set("Authorization", adminAuth());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(res.body.data[0]).toMatchObject({ email: "admin@enterprise.com" });
  });

  it("returns 401 without a token", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin user", async () => {
    const res = await request(app).get("/api/admin/users").set("Authorization", developerAuth());
    expect(res.status).toBe(403);
  });
});

describe("POST /api/admin/users", () => {
  let ds: ReturnType<typeof mockDataSource>;

  beforeEach(() => {
    ds = mockDataSource();
  });

  const validPayload = {
    name: "Jane Developer",
    email: "jane.dev@enterprise.com",
    password: "TempPassw0rd!",
    role: UserRole.DEVELOPER,
  };

  it("returns 201 with the provisioned user for valid data", async () => {
    ds.repoFor(User).findOne.mockResolvedValue(null);
    ds.repoFor(Organization).findOne.mockResolvedValue({ id: 1, name: "Enterprise HQ" });

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", adminAuth())
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: "jane.dev@enterprise.com",
      role: UserRole.DEVELOPER,
    });
    expect(typeof res.body.tempPassword).toBe("string");
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", adminAuth())
      .send({ name: "No Email" });

    expect(res.status).toBe(400);
    expect(res.body.errors ?? res.body.error).toBeDefined();
  });

  it("returns 409 when the email already exists", async () => {
    ds.repoFor(User).findOne.mockResolvedValue({ id: 2, email: "jane.dev@enterprise.com" });

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", adminAuth())
      .send(validPayload);

    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });
});
