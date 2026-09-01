"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Uploader from "@/components/Uploader";

// three.js touches the DOM/WebGL, so keep it client-only.
const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
});

export default function Home() {
  const [glbUrl, setGlbUrl] = useState<string | null>(null);

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 p-8">
      <h1 className="text-2xl font-semibold">PNG → 3D</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Uploader onModelReady={setGlbUrl} />

        <div className="h-96">
          {glbUrl ? (
            <ModelViewer url={glbUrl} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg bg-neutral-100 text-sm text-neutral-400 dark:bg-neutral-900">
              변환된 모델이 여기에 표시됩니다
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
