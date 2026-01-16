import { type FlowNodeType } from '@/ui/molecules/FlowEditor';

export const FLOW_NODES: FlowNodeType[] = [
  {
    type: 'simple',
    label: 'Simple Node',
    description: 'A basic node with title and text',
    initialData: {
      label: 'Node',
      description: 'A simple node',
    },
  },
  {
    type: 'simple',
    label: 'Advanced Node',
    description: 'Node with various property types',
    initialData: {
      label: 'Advanced',
      count: 0,
      enabled: true,
      metadata: {
        author: 'System',
        version: '1.0',
      },
    },
  },
];
