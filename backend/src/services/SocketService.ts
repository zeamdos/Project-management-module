import { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";

let io: SocketServer | null = null;

export function initSocket(server: any) {
  io = new SocketServer(server, {
    cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-secret") as any;
      socket.data.userId = decoded.id ?? decoded.userId;
      socket.join(`user:${socket.data.userId}`);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: user ${socket.data.userId}`);
    socket.on("disconnect", () => console.log(`Socket disconnected: user ${socket.data.userId}`));
  });

  return io;
}

export function emitToUser(userId: number, event: string, data: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

export function broadcast(event: string, data: any) {
  if (!io) return;
  io.emit(event, data);
}
