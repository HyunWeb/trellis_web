/**
 * Client for the trellis-service (separate Python/FastAPI repo).
 * Set TRELLIS_SERVICE_URL in .env.local, e.g. http://localhost:8000
 */

export type JobStatus = "queued" | "processing" | "done" | "failed";

export interface Job {
  id: string;
  status: JobStatus;
  glb_url?: string;
  error?: string;
}

function baseUrl() {
  const url = process.env.TRELLIS_SERVICE_URL;
  if (!url) {
    throw new Error("TRELLIS_SERVICE_URL is not set");
  }
  return url.replace(/\/$/, "");
}

/** Submit a PNG (as a File/Blob) and create a new reconstruction job. */
export async function createJob(image: Blob, filename: string): Promise<Job> {
  const form = new FormData();
  form.append("image", image, filename);

  const res = await fetch(`${baseUrl()}/jobs`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Failed to create job: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

/** Poll a job's current status. */
export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${baseUrl()}/jobs/${jobId}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to fetch job: ${res.status} ${await res.text()}`);
  }

  return res.json();
}
