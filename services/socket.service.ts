import { Server } from "socket.io";
import { eventBus, AppEvents } from "../events/eventBus";

export class SocketService {
  private static io: Server | null = null;

  static init(io: Server) {
    this.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-claim", (claimId) => {
        socket.join(`claim-${claimId}`);
        console.log(`Socket ${socket.id} joined claim-${claimId}`);
      });

      socket.on("mobile-connected", (data) => {
        console.log(`Mobile connected for claim: ${data.claimId}`);
        io.to(`claim-${data.claimId}`).emit("mobile-synced", data);
      });

      socket.on("send-otp", (data) => {
        console.log(`OTP requested for claim: ${data.claimId}`);
        io.to(`claim-${data.claimId}`).emit("otp-received", data);
      });

      socket.on("verify-handshake", (data) => {
        console.log(`Handshake verification for claim: ${data.claimId}`);
        io.to(`claim-${data.claimId}`).emit("handshake-verified", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });

    // Listen to event bus and broadcast to sockets
    eventBus.on(AppEvents.CLAIM_UPDATED, (data) => {
      this.io?.to(`claim-${data.id}`).emit("claim-updated", data.full);
    });

    eventBus.on(AppEvents.ASSESSOR_ASSIGNED, (data) => {
      this.io?.to(`claim-${data.id}`).emit("claim-updated", data.full);
    });

    eventBus.on(AppEvents.NOTE_ADDED, (data) => {
      this.io?.to(`claim-${data.claimId}`).emit("note-added", data.note);
    });

    eventBus.on(AppEvents.EVIDENCE_ADDED, (data) => {
      this.io?.to(`claim-${data.claimId}`).emit("evidence-added", data.evidence);
    });

    eventBus.on(AppEvents.PAYMENT_SUCCESS, (data) => {
      // Payment success usually triggers a claim update too, which is handled above
    });
  }

  static emitToClaim(claimId: string, event: string, data: any) {
    this.io?.to(`claim-${claimId}`).emit(event, data);
  }
}
