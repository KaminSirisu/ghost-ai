"use client";

import type { CSSProperties } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CanvasNode, NodeShape } from "@/types/canvas";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/start-templates";
import { Download } from "lucide-react";

interface StartTemplatesModalProps {
  open: boolean;
  onImport: (template: CanvasTemplate) => void;
  onOpenChange: (open: boolean) => void;
}

interface PreviewBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

const PREVIEW_WIDTH = 560;
const PREVIEW_HEIGHT = 220;
const PREVIEW_PADDING = 28;

export function StartTemplatesModal({
  open,
  onImport,
  onOpenChange,
}: StartTemplatesModalProps) {
  function handleImport(template: CanvasTemplate) {
    onImport(template);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] w-[min(calc(100vw-2rem),72rem)] max-w-none rounded-3xl border border-surface-border bg-surface p-0 text-copy-primary shadow-2xl shadow-base/60 sm:max-w-none">
        <DialogHeader className="px-6 pb-4 pt-6 sm:px-8">
          <DialogTitle className="text-2xl font-semibold text-copy-primary">
            Import Template
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-copy-muted">
            Choose a starter template to pre-populate your canvas. Any existing
            nodes will be replaced.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(min(760px,100vh-2rem)-7rem)]">
          <div className="grid gap-4 px-6 pb-6 sm:px-8 md:grid-cols-3">
            {CANVAS_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className="group flex min-h-0 flex-col overflow-hidden rounded-2xl border border-surface-border bg-elevated transition hover:border-brand"
              >
                <TemplatePreview template={template} />
                <div className="flex flex-1 flex-col border-t border-surface-border px-4 py-4">
                  <h3 className="text-base font-semibold text-copy-primary">
                    {template.name}
                  </h3>
                  <p className="mt-2 min-h-20 text-sm leading-6 text-copy-muted">
                    {template.description}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 w-full border-surface-border bg-surface text-copy-primary hover:bg-subtle"
                    onClick={() => handleImport(template)}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Import
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const bounds = getPreviewBounds(template.nodes);
  const scale = Math.min(
    (PREVIEW_WIDTH - PREVIEW_PADDING * 2) / bounds.width,
    (PREVIEW_HEIGHT - PREVIEW_PADDING * 2) / bounds.height,
  );

  function toPreviewPoint(x: number, y: number) {
    return {
      x: (x - bounds.minX) * scale + PREVIEW_PADDING,
      y: (y - bounds.minY) * scale + PREVIEW_PADDING,
    };
  }

  function getNodeCenter(node: CanvasNode) {
    const width = node.width ?? node.initialWidth ?? 160;
    const height = node.height ?? node.initialHeight ?? 88;

    return toPreviewPoint(
      node.position.x + width / 2,
      node.position.y + height / 2,
    );
  }

  return (
    <svg
      className="h-56 w-full bg-base"
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      role="img"
      aria-label={`${template.name} preview`}
    >
      {template.edges.map((edge) => {
        const source = template.nodes.find((node) => node.id === edge.source);
        const target = template.nodes.find((node) => node.id === edge.target);

        if (!source || !target) {
          return null;
        }

        const start = getNodeCenter(source);
        const end = getNodeCenter(target);

        return (
          <line
            key={edge.id}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            stroke="var(--text-secondary)"
            strokeLinecap="round"
            strokeOpacity="0.48"
            strokeWidth="2"
          />
        );
      })}

      {template.nodes.map((node) => (
        <PreviewNode
          key={node.id}
          node={node}
          scale={scale}
          toPreviewPoint={toPreviewPoint}
        />
      ))}
    </svg>
  );
}

interface PreviewNodeProps {
  node: CanvasNode;
  scale: number;
  toPreviewPoint: (x: number, y: number) => { x: number; y: number };
}

function PreviewNode({ node, scale, toPreviewPoint }: PreviewNodeProps) {
  const width = (node.width ?? node.initialWidth ?? 160) * scale;
  const height = (node.height ?? node.initialHeight ?? 88) * scale;
  const origin = toPreviewPoint(node.position.x, node.position.y);
  const style = {
    fill: node.data.color,
    stroke: "var(--border-subtle)",
  } satisfies CSSProperties;

  return (
    <g>
      <PreviewNodeShape
        height={height}
        shape={node.data.shape}
        style={style}
        width={width}
        x={origin.x}
        y={origin.y}
      />
    </g>
  );
}

interface PreviewNodeShapeProps {
  height: number;
  shape: NodeShape;
  style: CSSProperties;
  width: number;
  x: number;
  y: number;
}

function PreviewNodeShape({
  height,
  shape,
  style,
  width,
  x,
  y,
}: PreviewNodeShapeProps) {
  if (shape === "diamond") {
    return (
      <polygon
        points={`${x + width / 2},${y} ${x + width},${y + height / 2} ${x + width / 2},${y + height} ${x},${y + height / 2}`}
        style={style}
        strokeWidth="1.5"
      />
    );
  }

  if (shape === "hexagon") {
    return (
      <polygon
        points={`${x + width * 0.24},${y} ${x + width * 0.76},${y} ${x + width},${y + height / 2} ${x + width * 0.76},${y + height} ${x + width * 0.24},${y + height} ${x},${y + height / 2}`}
        style={style}
        strokeWidth="1.5"
      />
    );
  }

  if (shape === "cylinder") {
    const ellipseHeight = Math.min(10, height * 0.24);

    return (
      <>
        <path
          d={`M${x} ${y + ellipseHeight / 2} C${x} ${y} ${x + width} ${y} ${x + width} ${y + ellipseHeight / 2} V${y + height - ellipseHeight / 2} C${x + width} ${y + height} ${x} ${y + height} ${x} ${y + height - ellipseHeight / 2} Z`}
          style={style}
          strokeWidth="1.5"
        />
        <path
          d={`M${x} ${y + ellipseHeight / 2} C${x} ${y + ellipseHeight} ${x + width} ${y + ellipseHeight} ${x + width} ${y + ellipseHeight / 2}`}
          fill="none"
          stroke={String(style.stroke)}
          strokeWidth="1.5"
        />
      </>
    );
  }

  const radius = shape === "rectangle" ? 6 : height / 2;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={radius}
      ry={radius}
      style={style}
      strokeWidth="1.5"
    />
  );
}

function getPreviewBounds(nodes: CanvasNode[]): PreviewBounds {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      width: 1,
      height: 1,
    };
  }

  const bounds = nodes.reduce(
    (accumulator, node) => {
      const width = node.width ?? node.initialWidth ?? 160;
      const height = node.height ?? node.initialHeight ?? 88;

      return {
        minX: Math.min(accumulator.minX, node.position.x),
        minY: Math.min(accumulator.minY, node.position.y),
        maxX: Math.max(accumulator.maxX, node.position.x + width),
        maxY: Math.max(accumulator.maxY, node.position.y + height),
      };
    },
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  return {
    minX: bounds.minX,
    minY: bounds.minY,
    width: Math.max(bounds.maxX - bounds.minX, 1),
    height: Math.max(bounds.maxY - bounds.minY, 1),
  };
}
