"use client";

import { useState } from "react";

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  }
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  return (
    <button
      type="button"
      aria-label={`Sao chép bản ${label}`}
      onClick={async () => {
        setState((await copy(text)) ? "done" : "failed");
        setTimeout(() => setState("idle"), 1600);
      }}
      className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
    >
      {state === "done" ? "Đã chép" : state === "failed" ? "Lỗi" : "Chép"}
    </button>
  );
}
