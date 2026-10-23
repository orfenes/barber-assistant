import { FastifyInstance } from "fastify";
import { getAppointments } from "../services/booking";

export async function appointmentRoutes(app: FastifyInstance) {
  app.get("/appointments", async () => {
    return getAppointments();
  });
}
