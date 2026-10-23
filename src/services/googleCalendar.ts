import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const credentialsPath = join(process.cwd(), "credentials.json");
const tokenPath = join(process.cwd(), "token.json");

const scopes = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];

async function getGoogleAuth(): Promise<OAuth2Client> {
  const credentialsFile = JSON.parse(await readFile(credentialsPath, "utf8"));

  const clientConfig = credentialsFile.installed;

  const auth = new OAuth2Client(
    clientConfig.client_id,
    clientConfig.client_secret,
    clientConfig.redirect_uris[0],
  );

  try {
    const savedToken = JSON.parse(await readFile(tokenPath, "utf8"));

    auth.setCredentials(savedToken);
    return auth;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  // Primeira autorização: abre o navegador para conceder acesso.
  const newAuth = await authenticate({
    keyfilePath: credentialsPath,
    scopes,
  });

  await writeFile(tokenPath, JSON.stringify(newAuth.credentials, null, 2), {
    mode: 0o600,
  });

  return newAuth;
}

export async function testGoogleCalendar() {
  const auth = await getGoogleAuth();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const result = await calendar.calendarList.list();

  console.log("Calendários encontrados:");

  for (const item of result.data.items ?? []) {
    console.log(item.summary);
  }
}

export async function createTestEvent() {
  const auth = await getGoogleAuth();

  const calendar = google.calendar({
    version: "v3",
    auth,
  });

  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(14, 0, 0, 0);

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  const result = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: "Barbearia",
      description: "Evento de teste do projeto Barber Assistant",
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    },
  });

  console.log("Evento criado:", result.data.summary);
  console.log("Link:", result.data.htmlLink);
}
