import { useCallback, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';
import { Button } from '@/ui/atoms/button/button';
import { cn } from '@/lib/utils';

import type { FlowData } from '@/features/chat/types';

interface FlowEditorProps {
  initialFlow?: FlowData;
  onChange?: (flow: FlowData) => void;
  readOnly?: boolean;
  className?: string;
}

// Internal component that uses ReactFlow hooks
function FlowEditorInner({
  initialFlow,
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
  const { setViewport, toObject, screenToFlowPosition } = useReactFlow();

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

  // Add a new node at center of viewport
  const handleAddNode = useCallback(() => {
    const id = `node-${Date.now()}`;
    // Get center of the current viewport
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const position = screenToFlowPosition({
      x: centerX,
      y: centerY,
    });

    const newNode: Node = {
      id,
      type: 'default',
      position,
      data: { label: `Node ${nodes.length + 1}` },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes.length, screenToFlowPosition, setNodes]);

  return (
    <div className={cn('relative w-full h-full', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        fitView
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Toolbar for adding nodes */}
      {!readOnly && (
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={handleAddNode}
            className="shadow-lg"
          >
            <Plus className="size-4 mr-2" />
            Add Node
          </Button>
        </div>
      )}
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
