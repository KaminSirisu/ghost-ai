"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DEBOUNCE_MS = 1200;
const SAVE_STATUS_RESET_MS = 1400;

interface UseCanvasAutosaveOptions {
  edges: CanvasEdge[];
  enabled: boolean;
  nodes: CanvasNode[];
  projectId: string;
}

interface UseCanvasAutosaveResult {
  saveCanvas: () => Promise<void>;
  status: CanvasSaveStatus;
}

export function useCanvasAutosave({
  edges,
  enabled,
  nodes,
  projectId,
}: UseCanvasAutosaveOptions): UseCanvasAutosaveResult {
  const [status, setStatus] = useState<CanvasSaveStatus>("idle");
  const lastSavedSignatureRef = useRef<string | null>(null);
  const saveRequestIdRef = useRef(0);
  const statusResetTimeoutRef = useRef<number | null>(null);

  const setTerminalStatus = useCallback((nextStatus: "saved" | "error") => {
    setStatus(nextStatus);

    if (statusResetTimeoutRef.current !== null) {
      window.clearTimeout(statusResetTimeoutRef.current);
    }

    statusResetTimeoutRef.current = window.setTimeout(() => {
      setStatus("idle");
      statusResetTimeoutRef.current = null;
    }, SAVE_STATUS_RESET_MS);
  }, []);

  const saveCanvasSignature = useCallback(
    async (signature: string, signal?: AbortSignal) => {
      const requestId = saveRequestIdRef.current + 1;
      saveRequestIdRef.current = requestId;
      if (statusResetTimeoutRef.current !== null) {
        window.clearTimeout(statusResetTimeoutRef.current);
        statusResetTimeoutRef.current = null;
      }
      setStatus("saving");

      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: signature,
          signal,
        });

        if (!response.ok) {
          if (saveRequestIdRef.current === requestId) {
            setTerminalStatus("error");
          }

          return;
        }

        lastSavedSignatureRef.current = signature;

        if (saveRequestIdRef.current === requestId) {
          setTerminalStatus("saved");
        }
      } catch {
        if (signal?.aborted) {
          return;
        }

        if (saveRequestIdRef.current === requestId) {
          setTerminalStatus("error");
        }
      }
    },
    [projectId, setTerminalStatus],
  );

  const saveCanvas = useCallback(async () => {
    await saveCanvasSignature(JSON.stringify({ nodes, edges }));
  }, [edges, nodes, saveCanvasSignature]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const signature = JSON.stringify({ nodes, edges });

    if (lastSavedSignatureRef.current === signature) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      await saveCanvasSignature(signature, abortController.signal);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [edges, enabled, nodes, saveCanvasSignature]);

  useEffect(() => {
    return () => {
      if (statusResetTimeoutRef.current !== null) {
        window.clearTimeout(statusResetTimeoutRef.current);
      }
    };
  }, []);

  return {
    saveCanvas,
    status,
  };
}
