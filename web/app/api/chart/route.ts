export const runtime = "edge";

import { NextRequest } from "next/server";

// GET /api/chart?symbol=AAOI&range=ytd&interval=1d
// Proxies Yahoo Finance v8 chart API and returns simplified time-series.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "AAOI").toUpperCase();
  const range = searchParams.get("range") ?? "ytd";
  const interval = searchParams.get("interval") ?? "1d";

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      cache: "no-store",
    });
    if (!res.ok) return Response.json({ error: `yahoo ${res.status}` }, { status: 502 });

    const data = await res.json() as {
      chart?: {
        result?: Array<{
          meta?: {
            regularMarketPrice?: number;
            chartPreviousClose?: number;
            currency?: string;
            symbol?: string;
            previousClose?: number;
          };
          timestamp?: number[];
          indicators?: { quote?: Array<{ close?: (number | null)[] }> };
        }>;
        error?: unknown;
      };
    };

    const r = data?.chart?.result?.[0];
    if (!r) return Response.json({ error: "no data" }, { status: 404 });

    const ts = r.timestamp ?? [];
    const closes = r.indicators?.quote?.[0]?.close ?? [];
    const points = ts
      .map((t, i) => ({ t: t * 1000, c: closes[i] }))
      .filter(p => typeof p.c === "number" && p.c !== null) as { t: number; c: number }[];

    const meta = r.meta ?? {};
    const last = meta.regularMarketPrice ?? points[points.length - 1]?.c;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? points[0]?.c;
    const change = last != null && prevClose != null ? last - prevClose : 0;
    const changePct = last != null && prevClose ? ((last - prevClose) / prevClose) * 100 : 0;

    return Response.json({
      symbol: meta.symbol ?? symbol,
      currency: meta.currency ?? "USD",
      last,
      prevClose,
      change,
      changePct,
      points,
    }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
