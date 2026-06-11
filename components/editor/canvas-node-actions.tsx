"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

interface CanvasNodeActionsValue {
  updateNodeColor: (
    nodeId: string,
    color: string,
    textColor: string,
  ) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
}

const CanvasNodeActionsContext =
  createContext<CanvasNodeActionsValue | null>(null);

interface CanvasNodeActionsProviderProps {
  children: ReactNode;
  value: CanvasNodeActionsValue;
}

export function CanvasNodeActionsProvider({
  children,
  value,
}: CanvasNodeActionsProviderProps) {
  return (
    <CanvasNodeActionsContext.Provider value={value}>
      {children}
    </CanvasNodeActionsContext.Provider>
  );
}

export function useCanvasNodeActions() {
  const value = useContext(CanvasNodeActionsContext);

  if (!value) {
    throw new Error(
      "useCanvasNodeActions must be used within CanvasNodeActionsProvider",
    );
  }

  return value;
}
