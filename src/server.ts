import Fastify from "fastify";
import { chatRoutes } from "./routes/chat";

const app = Fastify({ logger: true });

app.get("/", async () => ({
  message: "Barber Assistant está funcionando!",
}));

app.register(chatRoutes);

const start = async () => {
  try {
    await app.listen({
      port: 3000,
      host: "127.0.0.1",
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();