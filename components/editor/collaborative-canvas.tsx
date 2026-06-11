"use client";

import { DragEvent, useCallback, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  type NodeTypes,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";

import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { ShapePanel } from "@/components/editor/shape-panel";
import {
  CANVAS_SHAPE_DRAG_MIME,
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_SHAPES,
  CanvasEdge,
  CanvasNode,
  type CanvasShapeDragPayload,
  type NodeShape,
} from "@/types/canvas";

const INITIAL_NODES: CanvasNode[] = [];
const INITIAL_EDGES: CanvasEdge[] = [];
const NODE_TYPES = {
  [CANVAS_NODE_TYPE]: CanvasNodeRenderer,
} satisfies NodeTypes;

function isNodeShape(value: unknown): value is NodeShape {
  return (
    typeof value === "string" &&
    NODE_SHAPES.includes(value as NodeShape)
  );
}

function parseShapeDragPayload(data: string): CanvasShapeDragPayload | null {
  try {
    const payload = JSON.parse(data) as Partial<CanvasShapeDragPayload>;

    if (
      !isNodeShape(payload.shape) ||
      !payload.size ||
      typeof payload.size.width !== "number" ||
      typeof payload.size.height !== "number"
    ) {
      return null;
    }

    return {
      shape: payload.shape,
      size: {
        width: payload.size.width,
        height: payload.size.height,
      },
    };
  } catch {
    return null;
  }
}

export function CollaborativeCanvas() {
  const nodeCounterRef = useRef(0);
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: INITIAL_NODES,
    },
    edges: {
      initial: INITIAL_EDGES,
    },
  });

  const createNodeId = useCallback((shape: NodeShape) => {
    nodeCounterRef.current += 1;

    return `${shape}-${Date.now()}-${nodeCounterRef.current}`;
  }, []);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.types.includes(CANVAS_SHAPE_DRAG_MIME)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      const payload = parseShapeDragPayload(
        event.dataTransfer.getData(CANVAS_SHAPE_DRAG_MIME),
      );

      if (!payload || !flowInstance) {
        return;
      }

      event.preventDefault();

      const position = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: CanvasNode = {
        id: createNodeId(payload.shape),
        type: CANVAS_NODE_TYPE,
        position,
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          shape: payload.shape,
        },
        width: payload.size.width,
        height: payload.size.height,
        initialWidth: payload.size.width,
        initialHeight: payload.size.height,
      };

      onNodesChange([
        {
          type: "add",
          item: newNode,
        },
      ]);
    },
    [createNodeId, flowInstance, onNodesChange],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: CANVAS_EDGE_TYPE,
    }),
    [],
  );

  return (
    <ReactFlow
      className="bg-base"
      nodes={nodes}
      edges={edges}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      onInit={setFlowInstance}
      connectionMode={ConnectionMode.Loose}
      defaultEdgeOptions={defaultEdgeOptions}
      defaultMarkerColor="var(--text-primary)"
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      fitView
      nodeTypes={NODE_TYPES}
      proOptions={{ hideAttribution: true }}
    >
      <ShapePanel />
      <MiniMap
        pannable
        zoomable
        nodeColor="var(--bg-subtle)"
        maskColor="rgba(8, 8, 9, 0.7)"
        className="!border !border-surface-border !bg-surface"
      />
      <Background
        variant={BackgroundVariant.Dots}
        gap={24}
        size={1}
        color="var(--border-subtle)"
      />
    </ReactFlow>
  );
}

export const defaultCanvasNodeType = CANVAS_NODE_TYPE;
