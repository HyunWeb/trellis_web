import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/trellis";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const job = await getJob(id);
    return NextResponse.json(job);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 502 });
  }
}
