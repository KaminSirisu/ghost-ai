"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { CanvasNode } from "@/types/canvas";

export function CanvasNode({ data, height, width }: NodeProps<CanvasNode>) {
  const nodeWidth = width ?? 160;
  const nodeHeight = height ?? 88;

  return (
    <div
      className="group relative flex items-center justify-center text-center text-sm font-medium"
      style={{
        height: nodeHeight,
        width: nodeWidth,
      }}
    >
      <NodeShape
        color={data.color}
        height={nodeHeight}
        shape={data.shape}
        width={nodeWidth}
      />
      <span className="relative z-10 px-4 text-copy-primary">
        {data.label}
      </span>
      <CanvasHandles />
    </div>
  );
}

interface NodeShapeProps {
  color: string;
  height: number;
  shape: CanvasNode["data"]["shape"];
  width: number;
}

function NodeShape({ color, height, shape, width }: NodeShapeProps) {
  if (shape === "diamond") {
    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <polygon
          points={`${width / 2},1 ${width - 1},${height / 2} ${width / 2},${height - 1} 1,${height / 2}`}
          fill={color}
          stroke="var(--border-subtle)"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <polygon
          points={`${width * 0.24},1 ${width * 0.76},1 ${width - 1},${height / 2} ${width * 0.76},${height - 1} ${width * 0.24},${height - 1} 1,${height / 2}`}
          fill={color}
          stroke="var(--border-subtle)"
          strokeWidth="2"
        />
      </svg>
    );
  }

  if (shape === "cylinder") {
    const ellipseHeight = Math.min(24, height * 0.24);

    return (
      <svg
        className="absolute inset-0"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        aria-hidden="true"
      >
        <path
          d={`M1 ${ellipseHeight / 2} C1 1 ${width - 1} 1 ${width - 1} ${ellipseHeight / 2} V${height - ellipseHeight / 2} C${width - 1} ${height - 1} 1 ${height - 1} 1 ${height - ellipseHeight / 2} Z`}
          fill={color}
          stroke="var(--border-subtle)"
          strokeWidth="2"
        />
        <path
          d={`M1 ${ellipseHeight / 2} C1 ${ellipseHeight - 1} ${width - 1} ${ellipseHeight - 1} ${width - 1} ${ellipseHeight / 2}`}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="2"
        />
      </svg>
    );
  }

  const radiusClass = {
    circle: "rounded-full",
    pill: "rounded-full",
    rectangle: "rounded-xl",
  }[shape];

  return (
    <div
      className={`absolute inset-0 border border-surface-border-subtle ${radiusClass}`}
      style={{
        backgroundColor: color,
        height,
        width,
      }}
      aria-hidden="true"
    />
  );
}

function CanvasHandles() {
  return (
    <>
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="source"
        position={Position.Top}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="source"
        position={Position.Right}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="source"
        position={Position.Bottom}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="source"
        position={Position.Left}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="target"
        position={Position.Top}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="target"
        position={Position.Right}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="target"
        position={Position.Bottom}
      />
      <Handle
        className="!h-2 !w-2 !border !border-base !bg-copy-primary opacity-0 transition-opacity group-hover:opacity-100"
        type="target"
        position={Position.Left}
      />
    </>
  );
}
