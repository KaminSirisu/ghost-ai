"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface CanvasEdgeActionsValue {
  updateEdgeLabel: (edgeId: string, label: string) => void;
}

const CanvasEdgeActionsContext =
  createContext<CanvasEdgeActionsValue | null>(null);

interface CanvasEdgeActionsProviderProps {
  children: ReactNode;
  value: CanvasEdgeActionsValue;
}

export function CanvasEdgeActionsProvider({
  children,
  value,
}: CanvasEdgeActionsProviderProps) {
  return (
    <CanvasEdgeActionsContext.Provider value={value}>
      {children}
    </CanvasEdgeActionsContext.Provider>
  );
}

export function useCanvasEdgeActions() {
  const value = useContext(CanvasEdgeActionsContext);

  if (!value) {
    throw new Error(
      "useCanvasEdgeActions must be used within CanvasEdgeActionsProvider",
    );
  }

  return value;
}
