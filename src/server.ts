import Fastify from "fastify";
import { chatRoutes } from "./routes/chat";
import { appointmentRoutes } from "./routes/appointments";
import { db } from "./data/database";

const app = Fastify({ logger: true });

app.get("/", async () => ({
  message: "Barber Assistant está funcionando!",
}));

app.register(chatRoutes);
app.register(appointmentRoutes);

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "127.0.0.1",
    });
  } catch (error) {
    app.log.error(error);
    db.close();
    process.exit(1);
  }
};

const shutdown = async () => {
  await app.close();
  db.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
