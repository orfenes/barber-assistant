import { testGoogleCalendar } from "./services/googleCalendar";

testGoogleCalendar().catch((error) => {
  console.error("Erro ao conectar com o Google Calendar:", error);
  process.exitCode = 1;
});
