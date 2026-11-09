import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { NotificationDropdown } from "../components/shared/NotificationDropdown";
import API from "../services/api";

vi.mock("../services/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Dev", email: "dev@x.com", role: "DEVELOPER", status: "ACTIVE" },
  }),
}));

vi.mock("../context/SocketContext", () => ({
  useSocket: () => ({ socket: null, connected: false }),
}));

const mockApi = API as any;

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    kind: "TASK_ASSIGNED",
    message: "You have a task",
    readAt: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.get.mockResolvedValue({ data: { notifications: [] } });
  mockApi.post.mockResolvedValue({ data: {} });
});

afterEach(() => {
  cleanup();
});

describe("NotificationDropdown", () => {
  it("renders the bell button", async () => {
    render(<NotificationDropdown />);
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("shows notifications when data is loaded", async () => {
    mockApi.get.mockResolvedValue({
      data: { notifications: [notification({ message: "You have a task" })] },
    });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => expect(screen.getByText("You have a task")).toBeInTheDocument());
  });

  it("marks a notification as read when clicked", async () => {
    mockApi.get.mockResolvedValue({
      data: { notifications: [notification({ id: 7, message: "Click me" })] },
    });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByLabelText("Notifications"));

    const item = await screen.findByText("Click me");
    fireEvent.click(item);

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith("/me/notifications/7/read"));
  });

  it("shows an empty state when there are no notifications", async () => {
    mockApi.get.mockResolvedValue({ data: { notifications: [] } });

    render(<NotificationDropdown />);
    fireEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => expect(screen.getByText("No notifications")).toBeInTheDocument());
  });
});
