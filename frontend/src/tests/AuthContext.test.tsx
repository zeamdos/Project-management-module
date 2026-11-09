import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import API from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

const mockApi = API as any;

// Exposes the context value so tests can drive it directly.
let ctx!: ReturnType<typeof useAuth>;
const Capture: React.FC = () => {
  ctx = useAuth();
  return null;
};

function renderProvider(ui: React.ReactNode = <Capture />) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  // Return null data so the AuthProvider mount-time "/me" sync does not
  // overwrite the state the test is asserting on.
  mockApi.get.mockResolvedValue({ data: null });
  mockApi.post.mockResolvedValue({ data: {} });
  mockApi.patch.mockResolvedValue({ data: {} });
});

afterEach(() => {
  cleanup();
});

describe("AuthContext", () => {
  it("renders its children inside the provider", () => {
    renderProvider(<div>child-content</div>);
    expect(screen.getByText("child-content")).toBeInTheDocument();
  });

  it("login calls the API and sets the token and user", async () => {
    const user = { id: 1, name: "Dev", email: "dev@x.com", role: "DEVELOPER", status: "ACTIVE" };
    mockApi.post.mockResolvedValue({ data: { token: "jwt-token", user } });

    renderProvider();
    await act(async () => {
      await ctx.login("dev@x.com", "Passw0rd!23");
    });

    expect(mockApi.post).toHaveBeenCalledWith("/auth/login", {
      email: "dev@x.com",
      password: "Passw0rd!23",
    });
    expect(localStorage.getItem("token")).toBe("jwt-token");
    expect(ctx.token).toBe("jwt-token");
    expect(ctx.user).toMatchObject({ email: "dev@x.com", role: "DEVELOPER" });
  });

  it("login throws when the credentials are invalid", async () => {
    mockApi.post.mockRejectedValue(new Error("Invalid email or password"));

    renderProvider();
    await expect(ctx.login("dev@x.com", "wrong")).rejects.toThrow("Invalid email or password");

    expect(ctx.token).toBeNull();
    expect(ctx.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logout clears the token and user", async () => {
    localStorage.setItem("token", "jwt");
    localStorage.setItem(
      "user",
      JSON.stringify({ id: 1, name: "Dev", email: "d@x.com", role: "DEVELOPER", status: "ACTIVE" })
    );

    renderProvider();
    await act(async () => {
      ctx.logout();
    });

    expect(ctx.token).toBeNull();
    expect(ctx.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("useAuth throws when used outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Capture />)).toThrow(/within an AuthProvider/);
    spy.mockRestore();
  });
});
