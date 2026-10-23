// Responsável por receber as requisições HTTP e chamar a lógica de agendamento.
import { FastifyInstance } from "fastify";
import { handleMessage } from "../services/booking";

export async function chatRoutes(app: FastifyInstance) {
  app.post("/chat", async (request, reply) => {
    const body = request.body as {
      message?: string;
      phone?: string;
    };

    const message = body.message?.trim().toLowerCase();
    const phone = body.phone?.trim();

    if (!message || !phone) {
      return reply.status(400).send({
        error: "Os campos message e phone são obrigatórios.",
      });
    }

    return handleMessage(phone, message);
  });
}
