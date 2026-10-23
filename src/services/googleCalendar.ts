import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { join } from "node:path";

export async function testGoogleCalendar() {
  const auth = await authenticate({
    keyfilePath: join(process.cwd(), "credentials.json"),
    scopes: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
    ],
  });

  console.log("Access token presente:", Boolean(auth.credentials.access_token));

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
