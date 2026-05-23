export async function GET() {
  return Response.json({ status: "ok", service: "aaos-research", ts: Date.now() });
}
