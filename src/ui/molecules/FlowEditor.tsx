import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Connection,
  type OnSelectionChangeParams,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Input } from '@/ui/atoms/input';
import { Label } from '@/ui/atoms/label';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { Separator } from '@/ui/atoms/separator';
import { cn } from '@/lib/utils';

import type { FlowData } from '@/features/chat/types';
import { SimpleNode } from './flow-nodes/SimpleNode';

export interface FlowNodeType {
  type: string;
  label: string;
  description?: string;
  initialData?: Record<string, unknown>;
  className?: string;
  style?: React.CSSProperties;
}

interface FlowEditorProps {
  initialFlow?: FlowData;
  availableNodes?: FlowNodeType[];
  onChange?: (flow: FlowData) => void;
  readOnly?: boolean;
  className?: string;
}

const nodeTypes = {
  simple: SimpleNode,
};

// --- Node Item Component ---
interface NodeItemProps {
  node: FlowNodeType;
  readOnly: boolean;
  onDoubleClick: () => void;
}

const NodeItem = ({ node, readOnly, onDoubleClick }: NodeItemProps) => {
  return (
    <div
      className={cn(
        'p-3 border rounded-md bg-card shadow-sm transition-all select-none',
        readOnly
          ? 'cursor-not-allowed opacity-70'
          : 'cursor-pointer hover:bg-accent hover:border-primary/50'
      )}
      onDoubleClick={onDoubleClick}
    >
      <div className="text-sm font-medium">{node.label}</div>
      <div className="text-xs text-muted-foreground mt-1">
        Double-click to add
      </div>
    </div>
  );
};

// --- Node Palette Component ---
interface NodePaletteProps {
  nodes: FlowNodeType[];
  readOnly: boolean;
  onNodeDoubleClick: (node: FlowNodeType) => void;
}

const NodePalette = ({
  nodes,
  readOnly,
  onNodeDoubleClick,
}: NodePaletteProps) => {
  return (
    <aside className="w-56 border-r bg-background flex flex-col h-full shrink-0">
      <div className="p-4 font-semibold border-b">Components</div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {nodes.map((node) => (
            <NodeItem
              key={node.type + node.label}
              node={node}
              readOnly={readOnly}
              onDoubleClick={() => {
                if (readOnly) return;
                onNodeDoubleClick(node);
              }}
            />
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
};

// --- Right Sidebar: Property Panel ---
const PropertyPanel = ({
  selectedNode,
  onNodeUpdate,
  readOnly,
}: {
  selectedNode: Node | null;
  onNodeUpdate: (id: string, data: Record<string, unknown>) => void;
  readOnly: boolean;
}) => {
  if (!selectedNode) {
    return (
      <aside className="w-72 border-l bg-background flex flex-col h-full">
        <div className="p-4 font-semibold border-b">Properties</div>
        <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground text-sm">
          Select a node to view or edit properties
        </div>
      </aside>
    );
  }

  const handleChange = (key: string, value: string) => {
    onNodeUpdate(selectedNode.id, {
      ...selectedNode.data,
      [key]: value,
    });
  };

  return (
    <aside className="w-72 border-l bg-background flex flex-col h-full">
      <div className="p-4 font-semibold border-b">Properties</div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div className="font-medium capitalize">{selectedNode.type}</div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="node-label">Label</Label>
            <Input
              id="node-label"
              value={(selectedNode.data.label as string) || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              disabled={readOnly}
              placeholder="Enter node label"
            />
          </div>

          {/* Add specific fields based on node type if needed */}
          {/* For now, generic data editor or specific known fields could go here */}
          {selectedNode.type === 'decision' && (
            <div className="text-xs text-muted-foreground mt-4">
              * Drag connections from Top/Bottom/Left/Right handles.
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
};

// Internal component that uses ReactFlow hooks
function FlowEditorInner({
  initialFlow,
  availableNodes = [],
  onChange,
  readOnly = false,
  className,
}: FlowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialFlow?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialFlow?.edges || []
  );
  const { setViewport, screenToFlowPosition, toObject } = useReactFlow();

  // Track selected node for the property panel
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const defaultNodeTypes: FlowNodeType[] = useMemo(
    () => [
      {
        type: 'simple',
        label: 'Simple Node',
        initialData: { label: 'Simple Node' },
      },
    ],
    []
  );

  const nodeLibrary =
    availableNodes.length > 0 ? availableNodes : defaultNodeTypes;

  // Handler to add a node at the center of the viewport
  const handleAddNodeAtCenter = useCallback(
    (nodeTemplate: FlowNodeType) => {
      if (readOnly) return;

      try {
        // Calculate the center position in flow coordinates
        // The center of the screen in viewport coordinates
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Convert screen coordinates to flow coordinates
        const position = screenToFlowPosition({
          x: centerX,
          y: centerY,
        });

        const newNode: Node = {
          id: `node-${Date.now()}`,
          type: nodeTemplate.type,
          position,
          data: {
            ...nodeTemplate.initialData,
            label: nodeTemplate.initialData?.label || nodeTemplate.label,
            className: nodeTemplate.className,
            style: nodeTemplate.style,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      } catch (err) {
        console.error('Failed to add node at center', err);
      }
    },
    [readOnly, screenToFlowPosition, setNodes]
  );

  // Restore viewport if provided
  useEffect(() => {
    if (initialFlow?.viewport) {
      const { x, y, zoom } = initialFlow.viewport;
      setViewport({ x, y, zoom }, { duration: 300 });
    }
  }, [initialFlow?.viewport, setViewport]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange && !readOnly) {
      const flowData = toObject();
      onChange(flowData);
    }
  }, [nodes, edges, onChange, readOnly, toObject]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      if (selectedNodes.length > 0) {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    []
  );

  const handleNodeUpdate = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: { ...node.data, ...data },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  return (
    <div
      className={cn(
        'flex w-full h-full bg-background overflow-hidden relative',
        className
      )}
    >
      {/* 1. Left Sidebar: Nodes */}
      <NodePalette
        nodes={nodeLibrary}
        readOnly={readOnly}
        onNodeDoubleClick={handleAddNodeAtCenter}
      />

      {/* 2. Main Area: Flow Canvas */}
      <div className="flex-1 min-w-0 bg-background relative h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onSelectionChange={handleSelectionChange}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={true}
          style={{ width: '100%', height: '100%' }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* 3. Right Sidebar: Properties */}
      <PropertyPanel
        selectedNode={selectedNode}
        onNodeUpdate={handleNodeUpdate}
        readOnly={readOnly}
      />
    </div>
  );
}

// Main component that wraps with ReactFlowProvider
export function FlowEditor(props: FlowEditorProps) {
  return (
    <ReactFlowProvider>
      <FlowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
