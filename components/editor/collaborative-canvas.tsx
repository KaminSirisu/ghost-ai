"use client";

import {
  DragEvent,
  KeyboardEvent,
  MouseEvent,
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
  Panel,
  type Connection,
  type EdgeTypes,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  type ReactFlowInstance,
  ViewportPortal,
} from "@xyflow/react";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  useCanRedo,
  useCanUndo,
  useOthers,
  useRedo,
  useUndo,
  useUpdateMyPresence,
} from "@liveblocks/react";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import Image from "next/image";

import { CanvasEdge as CanvasEdgeRenderer } from "@/components/editor/canvas-edge";
import { CanvasEdgeActionsProvider } from "@/components/editor/canvas-edge-actions";
import { CanvasNode as CanvasNodeRenderer } from "@/components/editor/canvas-node";
import { CanvasNodeActionsProvider } from "@/components/editor/canvas-node-actions";
import type { CanvasTemplateImportRequest } from "@/components/editor/canvas-room";
import { ShapePanel } from "@/components/editor/shape-panel";
import { useCanvasAutosave, type CanvasSaveStatus } from "@/hooks/use-canvas-autosave";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  CANVAS_SHAPE_DRAG_MIME,
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  DEFAULT_NODE_SIZES,
  NODE_SHAPES,
  CanvasEdge,
  CanvasNode,
  type CanvasSnapshot,
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
  color: "var(--text-muted)",
  width: 14,
  height: 14,
};
const EDGE_INTERACTION_WIDTH = 24;
const VIEWPORT_ANIMATION_DURATION_MS = 180;

interface CollaborativeCanvasProps {
  isAiSidebarOpen: boolean;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  onSaveCanvasReady: (saveCanvas: (() => Promise<void>) | null) => void;
  projectId: string;
  templateImportRequest: CanvasTemplateImportRequest | null;
}

interface PresenceParticipant {
  avatar: string;
  color: string;
  cursor: {
    x: number;
    y: number;
  } | null;
  id: string;
  name: string;
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

    const dragOffset =
      payload.dragOffset &&
      typeof payload.dragOffset.x === "number" &&
      typeof payload.dragOffset.y === "number"
        ? {
            x: payload.dragOffset.x,
            y: payload.dragOffset.y,
          }
        : undefined;

    return {
      dragOffset,
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

function normalizeCanvasNode(node: CanvasNode): CanvasNode {
  const shape = isNodeShape(node.data.shape) ? node.data.shape : "rectangle";
  const fallbackSize = DEFAULT_NODE_SIZES[shape];
  const width = node.width ?? node.initialWidth ?? fallbackSize.width;
  const height = node.height ?? node.initialHeight ?? fallbackSize.height;

  return {
    ...node,
    type: CANVAS_NODE_TYPE,
    data: {
      ...node.data,
      color:
        typeof node.data.color === "string"
          ? node.data.color
          : DEFAULT_NODE_COLOR.fill,
      textColor:
        typeof node.data.textColor === "string"
          ? node.data.textColor
          : DEFAULT_NODE_COLOR.text,
      shape,
    },
    height,
    initialHeight: node.initialHeight ?? height,
    initialWidth: node.initialWidth ?? width,
    width,
  };
}

export function CollaborativeCanvas({
  isAiSidebarOpen,
  onSaveCanvasReady,
  onSaveStatusChange,
  projectId,
  templateImportRequest,
}: CollaborativeCanvasProps) {
  const nodeCounterRef = useRef(0);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const importedTemplateRequestIdRef = useRef<number | null>(null);
  const savedCanvasLoadAttemptedRef = useRef(false);
  const latestCanvasRef = useRef<{
    edges: CanvasEdge[];
    nodes: CanvasNode[];
  }>({
    edges: [],
    nodes: [],
  });
  const selectedCanvasRef = useRef<{
    edges: CanvasEdge[];
    nodes: CanvasNode[];
  }>({
    edges: [],
    nodes: [],
  });
  const [flowInstance, setFlowInstance] =
    useState<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null);
  const [hasCheckedSavedCanvas, setHasCheckedSavedCanvas] = useState(false);
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const others = useOthers();
  const updateMyPresence = useUpdateMyPresence();
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
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
  const { saveCanvas, status: saveStatus } = useCanvasAutosave({
    edges,
    enabled: hasCheckedSavedCanvas,
    nodes,
    projectId,
  });

  useEffect(() => {
    latestCanvasRef.current = {
      edges,
      nodes,
    };
  }, [edges, nodes]);

  useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  useEffect(() => {
    onSaveCanvasReady(saveCanvas);

    return () => {
      onSaveCanvasReady(null);
    };
  }, [onSaveCanvasReady, saveCanvas]);

  useEffect(() => {
    if (savedCanvasLoadAttemptedRef.current) {
      return;
    }

    if (nodes.length > 0 || edges.length > 0) {
      savedCanvasLoadAttemptedRef.current = true;
      window.queueMicrotask(() => {
        setHasCheckedSavedCanvas(true);
      });
      return;
    }

    savedCanvasLoadAttemptedRef.current = true;
    let isCancelled = false;

    async function loadSavedCanvas() {
      try {
        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Saved canvas load failed");
        }

        const body = (await response.json()) as { canvas: CanvasSnapshot | null };

        if (!body.canvas || isCancelled) {
          return;
        }

        const latestCanvas = latestCanvasRef.current;

        if (latestCanvas.nodes.length > 0 || latestCanvas.edges.length > 0) {
          return;
        }

        const nodeAdditions = body.canvas.nodes.map(
          (node) =>
            ({
              type: "add",
              item: normalizeCanvasNode(node),
            }) satisfies NodeChange<CanvasNode>,
        );
        const edgeAdditions = body.canvas.edges.map(
          (edge) =>
            ({
              type: "add",
              item: edge,
            }) satisfies EdgeChange<CanvasEdge>,
        );

        if (nodeAdditions.length === 0 && edgeAdditions.length === 0) {
          return;
        }

        onNodesChange(nodeAdditions);
        onEdgesChange(edgeAdditions);

        window.requestAnimationFrame(() => {
          void flowInstance?.fitView({
            duration: VIEWPORT_ANIMATION_DURATION_MS,
            padding: 0.2,
          });
        });
      } catch (error) {
        console.error(error);
      } finally {
        if (!isCancelled) {
          setHasCheckedSavedCanvas(true);
        }
      }
    }

    void loadSavedCanvas();

    return () => {
      isCancelled = true;
    };
  }, [edges.length, flowInstance, nodes.length, onEdgesChange, onNodesChange, projectId]);

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

      const canvasBounds = canvasWrapperRef.current?.getBoundingClientRect();

      if (
        canvasBounds &&
        (event.clientX < canvasBounds.left ||
          event.clientX > canvasBounds.right ||
          event.clientY < canvasBounds.top ||
          event.clientY > canvasBounds.bottom)
      ) {
        return;
      }

      const position = flowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const nodeSize = payload.size;

      const newNode: CanvasNode = {
        id: createNodeId(payload.shape),
        type: CANVAS_NODE_TYPE,
        position: {
          x: position.x - nodeSize.width / 2,
          y: position.y - nodeSize.height / 2,
        },
        data: {
          label: "",
          color: DEFAULT_NODE_COLOR.fill,
          textColor: DEFAULT_NODE_COLOR.text,
          shape: payload.shape,
        },
        width: nodeSize.width,
        height: nodeSize.height,
        initialWidth: nodeSize.width,
        initialHeight: nodeSize.height,
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

  const collaborators = useMemo(
    () =>
      others
        .filter((participant) => participant.id !== currentUserId)
        .map(
          (participant) =>
            ({
              avatar: participant.info.avatar,
              color: participant.info.color,
              cursor: participant.presence.cursor,
              id: participant.id,
              name: participant.info.name,
            }) satisfies PresenceParticipant,
        ),
    [currentUserId, others],
  );

  const handleCanvasMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!flowInstance) {
        return;
      }

      updateMyPresence({
        cursor: flowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [flowInstance, updateMyPresence],
  );

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({
      cursor: null,
    });
  }, [updateMyPresence]);

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

  const handleSelectionChange = useCallback(
    ({ nodes, edges }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) => {
      selectedCanvasRef.current = {
        edges,
        nodes,
      };
    },
    [],
  );

  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        (event.key !== "Delete" && event.key !== "Backspace") ||
        isEditableEventTarget(event.target)
      ) {
        return;
      }

      const selectedNodes = selectedCanvasRef.current.nodes;
      const selectedEdges = selectedCanvasRef.current.edges;
      const selectedNodeIds = new Set(selectedNodes.map((node) => node.id));
      const edgesToDelete = latestCanvasRef.current.edges.filter(
        (edge) =>
          selectedEdges.some((selectedEdge) => selectedEdge.id === edge.id) ||
          selectedNodeIds.has(edge.source) ||
          selectedNodeIds.has(edge.target),
      );

      if (selectedNodes.length === 0 && edgesToDelete.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onDelete({
        edges: edgesToDelete,
        nodes: selectedNodes,
      });
    },
    [onDelete],
  );

  const handleCanvasPointerDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (isEditableEventTarget(event.target)) {
        return;
      }

      canvasWrapperRef.current?.focus({
        preventScroll: true,
      });
    },
    [],
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
            ...normalizeCanvasNode(node),
            position: { ...node.position },
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
        <div
          ref={canvasWrapperRef}
          className="h-full w-full outline-none"
          tabIndex={0}
          onKeyDown={handleCanvasKeyDown}
          onMouseDown={handleCanvasPointerDown}
        >
          <ReactFlow
            className="h-full w-full bg-base"
            nodes={nodes}
            edges={edges}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMouseLeave={handleCanvasMouseLeave}
            onMouseMove={handleCanvasMouseMove}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onSelectionChange={handleSelectionChange}
            onConnect={handleConnect}
            onDelete={onDelete}
            onInit={setFlowInstance}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={defaultEdgeOptions}
            defaultMarkerColor="var(--text-primary)"
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            deleteKeyCode={null}
            edgeTypes={EDGE_TYPES}
            nodeTypes={NODE_TYPES}
            proOptions={{ hideAttribution: true }}
          >
            <PresenceAvatarGroup
              collaborators={collaborators}
              isAiSidebarOpen={isAiSidebarOpen}
            />
            <LiveCursors collaborators={collaborators} />
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
        </div>
      </CanvasEdgeActionsProvider>
    </CanvasNodeActionsProvider>
  );
}

export const defaultCanvasNodeType = CANVAS_NODE_TYPE;

function isEditableEventTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest("input, textarea, select, [contenteditable='true']") ||
      target.isContentEditable,
  );
}

interface PresenceAvatarGroupProps {
  collaborators: PresenceParticipant[];
  isAiSidebarOpen: boolean;
}

function PresenceAvatarGroup({
  collaborators,
  isAiSidebarOpen,
}: PresenceAvatarGroupProps) {
  const visibleCollaborators = collaborators.slice(0, 5);
  const overflowCount = Math.max(collaborators.length - visibleCollaborators.length, 0);

  return (
    <Panel
      position="top-right"
      className={[
        "z-20 m-4 flex items-center rounded-full border border-surface-border bg-surface/90 px-2 py-2 shadow-2xl shadow-base/50 backdrop-blur transition-[margin] duration-300",
        isAiSidebarOpen ? "md:mr-[22rem]" : "",
      ].join(" ")}
    >
      {visibleCollaborators.length > 0 ? (
        <>
          <div className="flex -space-x-2">
            {visibleCollaborators.map((collaborator) => (
              <CollaboratorAvatar
                key={collaborator.id}
                participant={collaborator}
              />
            ))}
            {overflowCount > 0 ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-elevated text-xs font-semibold text-copy-secondary ring-2 ring-base">
                +{overflowCount}
              </div>
            ) : null}
          </div>
          <div className="mx-3 h-6 w-px bg-surface-border-subtle" />
        </>
      ) : null}

      <div className="flex h-9 w-9 items-center justify-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-9 w-9",
              userButtonAvatarBox: "h-9 w-9",
            },
          }}
        />
      </div>
    </Panel>
  );
}

interface CollaboratorAvatarProps {
  participant: PresenceParticipant;
}

function CollaboratorAvatar({ participant }: CollaboratorAvatarProps) {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-elevated text-xs font-semibold text-copy-primary ring-2 ring-base"
      title={participant.name}
      aria-label={participant.name}
    >
      {participant.avatar ? (
        <Image
          src={participant.avatar}
          alt={participant.name}
          width={36}
          height={36}
          unoptimized
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(participant.name)
      )}
    </div>
  );
}

interface LiveCursorsProps {
  collaborators: PresenceParticipant[];
}

function LiveCursors({ collaborators }: LiveCursorsProps) {
  const cursors = collaborators.filter(
    (collaborator) => collaborator.cursor !== null,
  );

  if (cursors.length === 0) {
    return null;
  }

  return (
    <ViewportPortal>
      {cursors.map((collaborator) => {
        const cursor = collaborator.cursor;

        if (!cursor) {
          return null;
        }

        return (
          <div
            key={collaborator.id}
            className="pointer-events-none absolute z-30 flex items-start gap-1"
            style={{
              left: cursor.x,
              top: cursor.y,
            }}
          >
            <div
              className="h-3 w-3 rounded-[2px] shadow-lg"
              style={{
                backgroundColor: collaborator.color,
                transform: "translate(-1px, -1px) rotate(45deg)",
              }}
            />
            <div
              className="rounded-xl px-2 py-1 text-xs font-medium leading-none shadow-lg"
              style={{
                backgroundColor: collaborator.color,
                color: "var(--bg-base)",
              }}
            >
              {collaborator.name}
            </div>
          </div>
        );
      })}
    </ViewportPortal>
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "G";
}

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
