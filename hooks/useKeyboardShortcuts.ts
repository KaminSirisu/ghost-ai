"use client";

import { useEffect } from "react";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

interface UseKeyboardShortcutsOptions<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> {
  flowInstance: ReactFlowInstance<NodeType, EdgeType> | null;
  onRedo: () => void;
  onUndo: () => void;
}

const ZOOM_DURATION_MS = 180;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']"),
  );
}

export function useKeyboardShortcuts<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({
  flowInstance,
  onRedo,
  onUndo,
}: UseKeyboardShortcutsOptions<NodeType, EdgeType>) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) {
        return;
      }

      const isModifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isModifierPressed && key === "z") {
        event.preventDefault();

        if (event.shiftKey) {
          onRedo();
          return;
        }

        onUndo();
        return;
      }

      if (isModifierPressed && key === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void flowInstance?.zoomIn({ duration: ZOOM_DURATION_MS });
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        void flowInstance?.zoomOut({ duration: ZOOM_DURATION_MS });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [flowInstance, onRedo, onUndo]);
}
