"use client";

import { useState, type ComponentType, type DragEvent, type SVGProps } from "react";
import {
  Circle,
  Cylinder,
  Diamond,
  Hexagon,
  Pill,
  RectangleHorizontal,
} from "lucide-react";

import { NodeShape } from "@/components/editor/canvas-node";
import {
  CANVAS_SHAPE_DRAG_MIME,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZES,
  NODE_SHAPES,
  type CanvasShapeDragPayload,
  type CanvasNodeSize,
  type NodeShape as CanvasNodeShape,
} from "@/types/canvas";

type ShapeIcon = ComponentType<SVGProps<SVGSVGElement>>;

const SHAPE_ICONS: Record<CanvasNodeShape, ShapeIcon> = {
  rectangle: RectangleHorizontal,
  diamond: Diamond,
  circle: Circle,
  pill: Pill,
  cylinder: Cylinder,
  hexagon: Hexagon,
};

interface DragPreviewState {
  cursor: {
    x: number;
    y: number;
  };
  shape: CanvasNodeShape;
  size: CanvasNodeSize;
}

function toShapeLabel(shape: CanvasNodeShape) {
  return shape.charAt(0).toUpperCase() + shape.slice(1);
}

function handleShapeDragStart(
  event: DragEvent<HTMLButtonElement>,
  shape: CanvasNodeShape,
) {
  const size = DEFAULT_NODE_SIZES[shape];
  const buttonRect = event.currentTarget.getBoundingClientRect();
  const dragOffset = {
    x: event.clientX - buttonRect.left,
    y: event.clientY - buttonRect.top,
  };
  const payload: CanvasShapeDragPayload = {
    dragOffset,
    shape,
    size,
  };

  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(CANVAS_SHAPE_DRAG_MIME, JSON.stringify(payload));

  const dragImage = document.createElement("span");
  dragImage.style.opacity = "0";
  dragImage.style.position = "fixed";
  dragImage.style.pointerEvents = "none";
  dragImage.style.width = "1px";
  dragImage.style.height = "1px";
  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, dragOffset.x, dragOffset.y);
  window.setTimeout(() => {
    dragImage.remove();
  }, 0);

  return {
    cursor: {
      x: event.clientX,
      y: event.clientY,
    },
    shape,
    size,
  };
}

export function ShapePanel() {
  const [dragPreview, setDragPreview] = useState<DragPreviewState | null>(null);

  function updatePreviewPosition(event: DragEvent<HTMLButtonElement>) {
    if (!dragPreview || event.clientX === 0 || event.clientY === 0) {
      return;
    }

    setDragPreview({
      ...dragPreview,
      cursor: {
        x: event.clientX,
        y: event.clientY,
      },
    });
  }

  function clearPreview() {
    setDragPreview(null);
  }

  return (
    <>
      <div className="pointer-events-auto absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-2 py-2 shadow-2xl backdrop-blur">
        {NODE_SHAPES.map((shape) => {
          const Icon = SHAPE_ICONS[shape];
          const label = toShapeLabel(shape);

          return (
            <button
              key={shape}
              type="button"
              draggable
              className="flex h-10 w-10 cursor-grab items-center justify-center rounded-xl border border-transparent text-copy-muted transition hover:border-surface-border-subtle hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
              aria-label={`Drag ${label} shape`}
              title={label}
              onDrag={updatePreviewPosition}
              onDragEnd={clearPreview}
              onDragStart={(event) =>
                setDragPreview(handleShapeDragStart(event, shape))
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {dragPreview && (
        <div
          className="pointer-events-none fixed z-50 opacity-65"
          style={{
            height: dragPreview.size.height,
            left: dragPreview.cursor.x,
            top: dragPreview.cursor.y,
            transform: "translate(-50%, -50%)",
            width: dragPreview.size.width,
          }}
          aria-hidden="true"
        >
          <div className="relative h-full w-full">
            <NodeShape
              color={DEFAULT_NODE_COLOR.fill}
              height={dragPreview.size.height}
              shape={dragPreview.shape}
              width={dragPreview.size.width}
            />
          </div>
        </div>
      )}
    </>
  );
}
