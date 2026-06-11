import { MarkerType } from "@xyflow/react";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_SIZES,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

interface TemplateNodeInput {
  id: string;
  label: string;
  position: {
    x: number;
    y: number;
  };
  shape: NodeShape;
  colorIndex: number;
}

function createNode({
  colorIndex,
  id,
  label,
  position,
  shape,
}: TemplateNodeInput): CanvasNode {
  const colorPair = NODE_COLORS[colorIndex] ?? NODE_COLORS[0];
  const size = DEFAULT_NODE_SIZES[shape];

  return {
    id,
    type: CANVAS_NODE_TYPE,
    position,
    data: {
      label,
      color: colorPair.fill,
      textColor: colorPair.text,
      shape,
    },
    width: size.width,
    height: size.height,
    initialWidth: size.width,
    initialHeight: size.height,
  };
}

function createEdge(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    source,
    target,
    type: CANVAS_EDGE_TYPE,
    data: {
      label: "",
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "var(--text-primary)",
      width: 18,
      height: 18,
    },
    interactionWidth: 24,
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-platform",
    name: "Microservices Platform",
    description:
      "API gateway, service cluster, shared messaging, and persistence layers for a common product backend.",
    nodes: [
      createNode({
        id: "client-app",
        label: "Client App",
        position: { x: 0, y: 116 },
        shape: "circle",
        colorIndex: 1,
      }),
      createNode({
        id: "api-gateway",
        label: "API Gateway",
        position: { x: 196, y: 120 },
        shape: "hexagon",
        colorIndex: 7,
      }),
      createNode({
        id: "user-service",
        label: "User Service",
        position: { x: 420, y: 0 },
        shape: "pill",
        colorIndex: 2,
      }),
      createNode({
        id: "order-service",
        label: "Order Service",
        position: { x: 420, y: 120 },
        shape: "pill",
        colorIndex: 3,
      }),
      createNode({
        id: "billing-service",
        label: "Billing Service",
        position: { x: 420, y: 240 },
        shape: "pill",
        colorIndex: 5,
      }),
      createNode({
        id: "event-bus",
        label: "Event Bus",
        position: { x: 660, y: 120 },
        shape: "diamond",
        colorIndex: 6,
      }),
      createNode({
        id: "primary-db",
        label: "PostgreSQL",
        position: { x: 884, y: 116 },
        shape: "cylinder",
        colorIndex: 1,
      }),
    ],
    edges: [
      createEdge("client-to-gateway", "client-app", "api-gateway"),
      createEdge("gateway-to-user", "api-gateway", "user-service"),
      createEdge("gateway-to-order", "api-gateway", "order-service"),
      createEdge("gateway-to-billing", "api-gateway", "billing-service"),
      createEdge("user-to-bus", "user-service", "event-bus"),
      createEdge("order-to-bus", "order-service", "event-bus"),
      createEdge("billing-to-bus", "billing-service", "event-bus"),
      createEdge("bus-to-db", "event-bus", "primary-db"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source control through build, test, artifact publishing, deployment approval, and production rollout.",
    nodes: [
      createNode({
        id: "git-repo",
        label: "Git Repo",
        position: { x: 0, y: 96 },
        shape: "hexagon",
        colorIndex: 1,
      }),
      createNode({
        id: "build",
        label: "Build",
        position: { x: 190, y: 108 },
        shape: "rectangle",
        colorIndex: 7,
      }),
      createNode({
        id: "tests",
        label: "Automated Tests",
        position: { x: 396, y: 96 },
        shape: "diamond",
        colorIndex: 6,
      }),
      createNode({
        id: "artifact-registry",
        label: "Artifact Registry",
        position: { x: 612, y: 96 },
        shape: "cylinder",
        colorIndex: 2,
      }),
      createNode({
        id: "approval",
        label: "Release Approval",
        position: { x: 820, y: 76 },
        shape: "pill",
        colorIndex: 4,
      }),
      createNode({
        id: "production",
        label: "Production",
        position: { x: 1028, y: 96 },
        shape: "circle",
        colorIndex: 3,
      }),
    ],
    edges: [
      createEdge("repo-to-build", "git-repo", "build"),
      createEdge("build-to-tests", "build", "tests"),
      createEdge("tests-to-registry", "tests", "artifact-registry"),
      createEdge("registry-to-approval", "artifact-registry", "approval"),
      createEdge("approval-to-production", "approval", "production"),
    ],
  },
  {
    id: "event-driven-system",
    name: "Event-Driven System",
    description:
      "Ingestion, event routing, independent consumers, durable storage, and analytics projection.",
    nodes: [
      createNode({
        id: "event-producers",
        label: "Event Producers",
        position: { x: 0, y: 136 },
        shape: "circle",
        colorIndex: 1,
      }),
      createNode({
        id: "ingestion-api",
        label: "Ingestion API",
        position: { x: 196, y: 140 },
        shape: "pill",
        colorIndex: 7,
      }),
      createNode({
        id: "event-stream",
        label: "Event Stream",
        position: { x: 424, y: 116 },
        shape: "diamond",
        colorIndex: 6,
      }),
      createNode({
        id: "notifications",
        label: "Notification Worker",
        position: { x: 664, y: 0 },
        shape: "rectangle",
        colorIndex: 5,
      }),
      createNode({
        id: "projection",
        label: "Read Model Projector",
        position: { x: 664, y: 140 },
        shape: "rectangle",
        colorIndex: 2,
      }),
      createNode({
        id: "warehouse-loader",
        label: "Warehouse Loader",
        position: { x: 664, y: 280 },
        shape: "rectangle",
        colorIndex: 3,
      }),
      createNode({
        id: "read-store",
        label: "Read Store",
        position: { x: 908, y: 132 },
        shape: "cylinder",
        colorIndex: 1,
      }),
    ],
    edges: [
      createEdge("producers-to-ingestion", "event-producers", "ingestion-api"),
      createEdge("ingestion-to-stream", "ingestion-api", "event-stream"),
      createEdge("stream-to-notifications", "event-stream", "notifications"),
      createEdge("stream-to-projection", "event-stream", "projection"),
      createEdge("stream-to-warehouse", "event-stream", "warehouse-loader"),
      createEdge("projection-to-store", "projection", "read-store"),
    ],
  },
];
