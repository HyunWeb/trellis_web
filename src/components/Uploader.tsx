"use client";

import { useCallback, useRef, useState } from "react";
import type { Job } from "@/lib/trellis";

const POLL_INTERVAL_MS = 2000;

type State =
  | { phase: "idle" }
  | { phase: "uploading" }
  | { phase: "processing"; jobId: string }
  | { phase: "done"; glbUrl: string }
  | { phase: "error"; message: string };

export default function Uploader({
  onModelReady,
}: {
  onModelReady: (glbUrl: string) => void;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  }, []);

  const poll = useCallback(
    (jobId: string) => {
      const tick = async () => {
        try {
          const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
          if (!res.ok) throw new Error(await res.text());
          const job: Job = await res.json();

          if (job.status === "done" && job.glb_url) {
            setState({ phase: "done", glbUrl: job.glb_url });
            onModelReady(job.glb_url);
            return;
          }
          if (job.status === "failed") {
            setState({ phase: "error", message: job.error ?? "변환에 실패했습니다" });
            return;
          }
          pollTimer.current = setTimeout(tick, POLL_INTERVAL_MS);
        } catch (err) {
          setState({
            phase: "error",
            message: err instanceof Error ? err.message : "상태 확인 중 오류가 발생했습니다",
          });
        }
      };
      tick();
    },
    [onModelReady]
  );

  const handleFile = useCallback(
    async (file: File) => {
      stopPolling();

      if (file.type !== "image/png") {
        setState({ phase: "error", message: "PNG 파일만 업로드할 수 있습니다" });
        return;
      }

      setPreview(URL.createObjectURL(file));
      setState({ phase: "uploading" });

      try {
        const form = new FormData();
        form.append("image", file, file.name);

        const res = await fetch("/api/jobs", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        const job: Job = await res.json();

        setState({ phase: "processing", jobId: job.id });
        poll(job.id);
      } catch (err) {
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다",
        });
      }
    },
    [poll, stopPolling]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-400 p-4 text-center transition hover:border-neutral-600"
      >
        {preview ? (
          // checkerboard-ish background helps show transparency
          <img
            src={preview}
            alt="업로드된 이미지 미리보기"
            className="h-32 w-32 object-contain [background-image:linear-gradient(45deg,#ccc_25%,transparent_25%),linear-gradient(-45deg,#ccc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#ccc_75%),linear-gradient(-45deg,transparent_75%,#ccc_75%)] [background-size:16px_16px] [background-position:0_0,0_8px,8px_-8px,-8px_0]"
          />
        ) : (
          <p className="text-sm text-neutral-500">
            투명 배경 PNG를 드래그하거나 클릭해서 업로드하세요
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <StatusLine state={state} />
    </div>
  );
}

function StatusLine({ state }: { state: State }) {
  switch (state.phase) {
    case "uploading":
      return <p className="text-sm text-neutral-500">업로드 중...</p>;
    case "processing":
      return <p className="text-sm text-neutral-500">3D 모델 생성 중... (job: {state.jobId})</p>;
    case "done":
      return <p className="text-sm text-green-600">완료!</p>;
    case "error":
      return <p className="text-sm text-red-600">{state.message}</p>;
    default:
      return null;
  }
}
