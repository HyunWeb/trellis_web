import { NextRequest, NextResponse } from "next/server";
import { createJob } from "@/lib/trellis";

// Proxies the upload to the Python trellis-service so the service URL/
// credentials never reach the browser directly.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const image = form.get("image");

  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "Missing 'image' field" }, { status: 400 });
  }

  if (image.type !== "image/png") {
    return NextResponse.json({ error: "Only PNG uploads are supported" }, { status: 400 });
  }

  try {
    const filename = image instanceof File ? image.name : "upload.png";
    const job = await createJob(image, filename);
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create job" }, { status: 502 });
  }
}
