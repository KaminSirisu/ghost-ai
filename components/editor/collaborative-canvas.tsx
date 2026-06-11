"use client";

import {
  DragEvent,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  MarkerType,
  type Connection,
  type EdgeTypes,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";

import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasEdgeActionsProvider } from "@/components/editor/canvas-edge-actions";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasNodeActionsProvider } from "@/components/editor/canvas-node-actions";
import type { CanvasTemplateImportRequest } from "@/components/editor/canvas-room";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
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
const EDGE_TYPES = {
  [CANVAS_EDGE_TYPE]: CanvasEdgeRenderer,
} satisfies EdgeTypes;
const DEFAULT_EDGE_MARKER = {
  type: MarkerType.ArrowClosed,
  color: "var(--text-primary)",
  width: 18,
  height: 18,
};
const EDGE_INTERACTION_WIDTH = 24;
const VIEWPORT_ANIMATION_DURATION_MS = 180;

interface CollaborativeCanvasProps {
  templateImportRequest: CanvasTemplateImportRequest | null;
}

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

export function CollaborativeCanvas({
  templateImportRequest,
}: CollaborativeCanvasProps) {
  const nodeCounterRef = useRef(0);
  const importedTemplateRequestIdRef = useRef<number | null>(null);
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
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
          textColor: DEFAULT_NODE_COLOR.text,
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

  const updateNodeLabel = useCallback(
    (nodeId: string, label: string) => {
      const node = nodes.find((item) => item.id === nodeId);

      if (!node || node.data.label === label) {
        return;
      }

      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              label,
            },
          },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateNodeColor = useCallback(
    (nodeId: string, color: string, textColor: string) => {
      const node = nodes.find((item) => item.id === nodeId);

      if (
        !node ||
        (node.data.color === color && node.data.textColor === textColor)
      ) {
        return;
      }

      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: {
            ...node,
            data: {
              ...node.data,
              color,
              textColor,
            },
          },
        },
      ]);
    },
    [nodes, onNodesChange],
  );

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      const edge = edges.find((item) => item.id === edgeId);

      if (!edge || edge.data?.label === label) {
        return;
      }

      onEdgesChange([
        {
          type: "replace",
          id: edgeId,
          item: {
            ...edge,
            data: {
              label,
            },
          },
        },
      ]);
    },
    [edges, onEdgesChange],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const canvasConnection = {
        ...connection,
        type: CANVAS_EDGE_TYPE,
        data: {
          label: "",
        },
        markerEnd: DEFAULT_EDGE_MARKER,
        interactionWidth: EDGE_INTERACTION_WIDTH,
      } satisfies Connection & Partial<CanvasEdge>;

      onConnect(canvasConnection);
    },
    [onConnect],
  );

  useEffect(() => {
    if (
      !templateImportRequest ||
      importedTemplateRequestIdRef.current === templateImportRequest.id
    ) {
      return;
    }

    importedTemplateRequestIdRef.current = templateImportRequest.id;

    const nodeRemovals = nodes.map(
      (node) =>
        ({
          type: "remove",
          id: node.id,
        }) satisfies NodeChange<CanvasNode>,
    );
    const edgeRemovals = edges.map(
      (edge) =>
        ({
          type: "remove",
          id: edge.id,
        }) satisfies EdgeChange<CanvasEdge>,
    );
    const nodeAdditions = templateImportRequest.template.nodes.map(
      (node) =>
        ({
          type: "add",
          item: {
            ...node,
            data: {
              ...node.data,
            },
            position: {
              ...node.position,
            },
          },
        }) satisfies NodeChange<CanvasNode>,
    );
    const edgeAdditions = templateImportRequest.template.edges.map(
      (edge) =>
        ({
          type: "add",
          item: {
            ...edge,
            data: edge.data ? { ...edge.data } : undefined,
          },
        }) satisfies EdgeChange<CanvasEdge>,
    );

    onEdgesChange(edgeRemovals);
    onNodesChange(nodeRemovals);

    window.requestAnimationFrame(() => {
      onNodesChange(nodeAdditions);
      onEdgesChange(edgeAdditions);

      window.requestAnimationFrame(() => {
        void flowInstance?.fitView({
          duration: VIEWPORT_ANIMATION_DURATION_MS,
          padding: 0.2,
        });
      });
    });
  }, [
    edges,
    flowInstance,
    nodes,
    onEdgesChange,
    onNodesChange,
    templateImportRequest,
  ]);

  const handleZoomIn = useCallback(() => {
    void flowInstance?.zoomIn({ duration: VIEWPORT_ANIMATION_DURATION_MS });
  }, [flowInstance]);

  const handleZoomOut = useCallback(() => {
    void flowInstance?.zoomOut({ duration: VIEWPORT_ANIMATION_DURATION_MS });
  }, [flowInstance]);

  const handleFitView = useCallback(() => {
    void flowInstance?.fitView({
      duration: VIEWPORT_ANIMATION_DURATION_MS,
      padding: 0.2,
    });
  }, [flowInstance]);

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
    }
  }, [canRedo, redo]);

  useKeyboardShortcuts({
    flowInstance,
    onRedo: handleRedo,
    onUndo: handleUndo,
  });

  const nodeActions = useMemo(
    () => ({
      updateNodeColor,
      updateNodeLabel,
    }),
    [updateNodeColor, updateNodeLabel],
  );

  const edgeActions = useMemo(
    () => ({
      updateEdgeLabel,
    }),
    [updateEdgeLabel],
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: CANVAS_EDGE_TYPE,
      data: {
        label: "",
      },
      markerEnd: DEFAULT_EDGE_MARKER,
      interactionWidth: EDGE_INTERACTION_WIDTH,
    }),
    [],
  );

  return (
    <CanvasNodeActionsProvider value={nodeActions}>
      <CanvasEdgeActionsProvider value={edgeActions}>
        <ReactFlow
          className="bg-base"
          nodes={nodes}
          edges={edges}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onDelete={onDelete}
          onInit={setFlowInstance}
          connectionLineType={ConnectionLineType.Bezier}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={defaultEdgeOptions}
          defaultMarkerColor="var(--text-primary)"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          edgeTypes={EDGE_TYPES}
          fitView
          nodeTypes={NODE_TYPES}
          proOptions={{ hideAttribution: true }}
        >
          <ShapePanel />
          <CanvasControlBar
            canRedo={canRedo}
            canUndo={canUndo}
            isViewportReady={Boolean(flowInstance)}
            onFitView={handleFitView}
            onRedo={handleRedo}
            onUndo={handleUndo}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="var(--border-subtle)"
          />
        </ReactFlow>
      </CanvasEdgeActionsProvider>
    </CanvasNodeActionsProvider>
  );
}

export const defaultCanvasNodeType = CANVAS_NODE_TYPE;

interface CanvasControlBarProps {
  canRedo: boolean;
  canUndo: boolean;
  isViewportReady: boolean;
  onFitView: () => void;
  onRedo: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

function CanvasControlBar({
  canRedo,
  canUndo,
  isViewportReady,
  onFitView,
  onRedo,
  onUndo,
  onZoomIn,
  onZoomOut,
}: CanvasControlBarProps) {
  return (
    <div className="pointer-events-auto absolute bottom-6 left-6 z-20 flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-2 py-2 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-1">
        <CanvasControlButton
          label="Zoom out"
          disabled={!isViewportReady}
          onClick={onZoomOut}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </CanvasControlButton>
        <CanvasControlButton
          label="Fit view"
          disabled={!isViewportReady}
          onClick={onFitView}
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </CanvasControlButton>
        <CanvasControlButton
          label="Zoom in"
          disabled={!isViewportReady}
          onClick={onZoomIn}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </CanvasControlButton>
      </div>

      <div className="mx-1 h-6 w-px bg-surface-border-subtle" />

      <div className="flex items-center gap-1">
        <CanvasControlButton label="Undo" disabled={!canUndo} onClick={onUndo}>
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </CanvasControlButton>
        <CanvasControlButton label="Redo" disabled={!canRedo} onClick={onRedo}>
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </CanvasControlButton>
      </div>
    </div>
  );
}

interface CanvasControlButtonProps {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}

function CanvasControlButton({
  children,
  disabled = false,
  label,
  onClick,
}: CanvasControlButtonProps) {
  return (
    <button
      type="button"
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-copy-muted transition hover:border-surface-border-subtle hover:bg-elevated hover:text-copy-primary disabled:pointer-events-none disabled:opacity-40"
      aria-label={label}
      disabled={disabled}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
