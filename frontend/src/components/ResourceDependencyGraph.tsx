'use client';

import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import AWS icons
import {
  ArchitectureServiceAmazonS3,
  ArchitectureServiceAmazonCloudFront,
  ArchitectureServiceAWSLambda,
  ArchitectureServiceAmazonDynamoDB,
  ArchitectureServiceAmazonRDS,
  ArchitectureServiceAmazonEC2,
  ArchitectureServiceElasticLoadBalancing,
  ArchitectureServiceAmazonVPC,
  SecurityIdentityComplianceAWSIdentityAccessManagement,
  NetworkingContentDeliveryAmazonRoute53,
  ArchitectureServiceAmazonAPIGateway,
  ApplicationIntegrationAmazonSimpleNotificationService,
  ApplicationIntegrationAmazonSimpleQueueService,
  SecurityIdentityComplianceAWSCertificateManager,
  SecurityIdentityComplianceAWSKeyManagementService,
  ArchitectureServiceAmazonElastiCache,
  ManagementGovernanceAmazonCloudWatch,
} from 'aws-react-icons';

interface Resource {
  id: string;
  name: string;
  type: string;
  dependencies?: string[];
}

interface ResourceDependencyGraphProps {
  resources?: Resource[];
}

// Resource type to AWS icon component mapping
const getResourceIcon = (type: string) => {
  if (!type) return null;

  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Map resource types to AWS icon components
  if (normalizedType.includes('s3')) return ArchitectureServiceAmazonS3;
  if (normalizedType.includes('cloudfront')) return ArchitectureServiceAmazonCloudFront;
  if (normalizedType.includes('lambda')) return ArchitectureServiceAWSLambda;
  if (normalizedType.includes('dynamodb')) return ArchitectureServiceAmazonDynamoDB;
  if (normalizedType.includes('rds')) return ArchitectureServiceAmazonRDS;
  if (normalizedType.includes('ec2')) return ArchitectureServiceAmazonEC2;
  if (normalizedType.includes('elb') || normalizedType.includes('alb') || normalizedType.includes('nlb')) {
    return ArchitectureServiceElasticLoadBalancing;
  }
  if (normalizedType.includes('vpc')) return ArchitectureServiceAmazonVPC;
  if (normalizedType.includes('iam')) return SecurityIdentityComplianceAWSIdentityAccessManagement;
  if (normalizedType.includes('route53')) return NetworkingContentDeliveryAmazonRoute53;
  if (normalizedType.includes('api_gateway') || normalizedType.includes('apigateway')) {
    return ArchitectureServiceAmazonAPIGateway;
  }
  if (normalizedType.includes('sns')) return ApplicationIntegrationAmazonSimpleNotificationService;
  if (normalizedType.includes('sqs')) return ApplicationIntegrationAmazonSimpleQueueService;
  if (normalizedType.includes('acm')) return SecurityIdentityComplianceAWSCertificateManager;
  if (normalizedType.includes('kms')) return SecurityIdentityComplianceAWSKeyManagementService;
  if (normalizedType.includes('elasticache') || normalizedType.includes('redis')) {
    return ArchitectureServiceAmazonElastiCache;
  }
  if (normalizedType.includes('cloudwatch')) return ManagementGovernanceAmazonCloudWatch;
  
  return null;
};

// Resource type to color mapping (AWS brand colors)
const getResourceColor = (type: string) => {
  if (!type) return { color: '#232F3E', bgColor: '#ECEFF1' };

  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // AWS service category colors
  if (normalizedType.includes('s3') || normalizedType.includes('cloudfront')) {
    return { color: '#569A31', bgColor: '#E8F5E9' }; // Storage - Green
  }
  if (normalizedType.includes('lambda') || normalizedType.includes('ec2')) {
    return { color: '#FF9900', bgColor: '#FFF3E0' }; // Compute - Orange
  }
  if (normalizedType.includes('dynamodb') || normalizedType.includes('rds') || normalizedType.includes('elasticache')) {
    return { color: '#3B48CC', bgColor: '#E8EAF6' }; // Database - Blue
  }
  if (normalizedType.includes('vpc') || normalizedType.includes('elb') || normalizedType.includes('route53')) {
    return { color: '#8C4FFF', bgColor: '#F3E5F5' }; // Networking - Purple
  }
  if (normalizedType.includes('iam') || normalizedType.includes('kms') || normalizedType.includes('acm')) {
    return { color: '#DD344C', bgColor: '#FFEBEE' }; // Security - Red
  }
  if (normalizedType.includes('sns') || normalizedType.includes('sqs') || normalizedType.includes('api_gateway')) {
    return { color: '#FF4F8B', bgColor: '#FCE4EC' }; // Integration - Pink
  }
  if (normalizedType.includes('cloudwatch')) {
    return { color: '#E7157B', bgColor: '#FCE4EC' }; // Management - Magenta
  }
  
  return { color: '#232F3E', bgColor: '#ECEFF1' }; // Default AWS dark
};

export default function ResourceDependencyGraph({ resources = [] }: ResourceDependencyGraphProps) {
  console.log('🔗 ResourceDependencyGraph rendering with resources:', resources);
  
  // Convert resources to nodes and edges
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!resources || resources.length === 0) {
      return { nodes: [], edges: [] };
    }

    console.log('🔨 Building nodes and edges from resources...');

    // Create nodes
    const nodes: Node[] = resources.map((resource, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const style = getResourceStyle(resource.type);
      
      return {
        id: resource.id,
        type: 'default',
        position: { x: col * 250, y: row * 120 },
        data: {
          label: (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{style.icon}</span>
              <div>
                <div className="font-semibold text-sm">{resource.name}</div>
                <div className="text-xs text-gray-600">{resource.type}</div>
              </div>
            </div>
          ),
        },
        style: {
          backgroundColor: style.bgColor,
          borderColor: style.color,
          borderWidth: 2,
          padding: 10,
          borderRadius: 8,
          minWidth: 180,
        },
      };
    });

    console.log('✅ Created nodes:', nodes);

    // Create edges from dependencies
    const edges: Edge[] = [];
    resources.forEach((resource) => {
      console.log(`Checking dependencies for ${resource.id}:`, resource.dependencies);
      
      if (resource.dependencies && resource.dependencies.length > 0) {
        resource.dependencies.forEach((depId) => {
          // Check if the dependency exists in our resources
          if (resources.some(r => r.id === depId)) {
            console.log(`✅ Creating edge: ${depId} -> ${resource.id}`);
            edges.push({
              id: `${depId}-${resource.id}`,
              source: depId,
              target: resource.id,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#64748b', strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#64748b',
              },
            });
          } else {
            console.warn(`⚠️ Dependency ${depId} not found in resources`);
          }
        });
      }
    });

    console.log('✅ Created edges:', edges);

    return { nodes, edges };
  }, [resources]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  if (!resources || resources.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gray-900/50 rounded-lg border border-white/10 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-400">No resource dependencies detected</p>
          <p className="text-sm text-gray-500 mt-1">
            Dependencies will appear here when infrastructure resources are analyzed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-gray-900/50 rounded-lg border border-white/10 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-900/50"
      >
        <Background color="#374151" gap={16} />
        <Controls className="bg-gray-800 border-gray-700" />
        <MiniMap
          className="bg-gray-800 border-gray-700"
          nodeColor={(node: any) => {
            const style = getResourceStyle(node.data.type);
            return style.color;
          }}
        />
      </ReactFlow>
    </div>
  );
}
