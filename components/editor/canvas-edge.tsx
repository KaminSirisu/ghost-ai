"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

import { useCanvasEdgeActions } from "@/components/editor/canvas-edge-actions";
import { cn } from "@/lib/utils";
import type { CanvasEdge } from "@/types/canvas";

const EMPTY_EDGE_LABEL_HINT = "Add label";
const EDGE_INTERACTION_WIDTH = 24;

export function CanvasEdge({
  data,
  id,
  markerEnd,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeLabel } = useCanvasEdgeActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data?.label ?? "");
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const label = data?.label ?? "";
  const isActive = selected || isHovered || isEditing;
  const showLabel = isEditing || Boolean(label) || isActive;

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const beginEditing = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDraftLabel(label);
    setIsEditing(true);
  };

  const commitLabel = () => {
    updateEdgeLabel(id, draftLabel.trim());
    setIsEditing(false);
  };

  const handleDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraftLabel(event.target.value);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation();

    if (event.key === "Enter" || event.key === "Escape") {
      event.preventDefault();
      commitLabel();
    }
  };

  const stopCanvasInteraction = (event: SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeLinecap="round"
        strokeWidth={EDGE_INTERACTION_WIDTH}
        className="react-flow__edge-interaction"
        onDoubleClick={beginEditing}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <path
        d={edgePath}
        fill="none"
        markerEnd={markerEnd}
        stroke="var(--text-primary)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className={cn(
          "pointer-events-none transition-opacity duration-150",
          isActive ? "opacity-95" : "opacity-55",
        )}
      />
      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={stopCanvasInteraction}
            onDoubleClick={beginEditing}
            onMouseDown={stopCanvasInteraction}
            onPointerDown={stopCanvasInteraction}
            onWheel={stopCanvasInteraction}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                aria-label="Edge label"
                className="min-w-14 rounded-full border border-surface-border bg-surface px-2.5 py-1 text-center text-xs font-medium text-copy-primary outline-none shadow-lg shadow-base/40 placeholder:text-copy-muted focus:border-brand"
                style={{
                  width: `${Math.max(7, draftLabel.length + 2)}ch`,
                }}
                placeholder={EMPTY_EDGE_LABEL_HINT}
                value={draftLabel}
                onBlur={commitLabel}
                onChange={handleDraftChange}
                onKeyDown={handleInputKeyDown}
              />
            ) : (
              <button
                type="button"
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium shadow-lg shadow-base/30 transition",
                  label
                    ? "border-surface-border bg-surface/95 text-copy-primary"
                    : "border-surface-border-subtle bg-surface/70 text-copy-muted opacity-70",
                )}
                onDoubleClick={beginEditing}
              >
                {label || EMPTY_EDGE_LABEL_HINT}
              </button>
            )}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
