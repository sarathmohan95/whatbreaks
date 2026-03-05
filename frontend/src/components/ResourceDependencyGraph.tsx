'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Resource {
  id: string;
  name: string;
  type: string;
  dependencies?: string[];
}

interface ResourceDependencyGraphProps {
  resources?: Resource[];
}

const getResourceIconUrl = (type: string): string => {
  const iconMap: Record<string, string> = {
    's3': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonSimpleStorageService.svg',
    'cloudfront': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonCloudFront.svg',
    'lambda': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSLambda.svg',
    'dynamodb': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonDynamoDB.svg',
    'rds': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonRDS.svg',
    'ec2': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonEC2.svg',
    'elb': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/ElasticLoadBalancing.svg',
    'alb': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/ElasticLoadBalancing.svg',
    'nlb': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/ElasticLoadBalancing.svg',
    'vpc': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonVirtualPrivateCloud.svg',
    'route53': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonRoute53.svg',
    'api_gateway': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonAPIGateway.svg',
    'apigateway': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonAPIGateway.svg',
    'sns': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonSimpleNotificationService.svg',
    'sqs': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonSimpleQueueService.svg',
    'iam': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSIdentityandAccessManagement.svg',
    'kms': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSKeyManagementService.svg',
    'elasticache': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonElastiCache.svg',
    'redis': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonElastiCache.svg',
    'cloudwatch': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonCloudWatch.svg',
    'eks': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonElasticKubernetesService.svg',
    'ecs': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonElasticContainerService.svg',
    'asg': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSAutoScaling.svg',
    'autoscaling': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSAutoScaling.svg',
    'sg': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonVirtualPrivateCloud.svg',
    'acm': 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AWSCertificateManager.svg',
  };

  if (!type) {
    return 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonEC2.svg';
  }

  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  for (const [key, url] of Object.entries(iconMap)) {
    if (normalizedType.includes(key)) {
      return url;
    }
  }
  
  return 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonEC2.svg';
};

const getResourceColor = (type: string) => {
  const colorMap: Record<string, { color: string; bgColor: string }> = {
    's3': { color: '#569A31', bgColor: '#E8F5E9' },
    'cloudfront': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'lambda': { color: '#FF9900', bgColor: '#FFF3E0' },
    'dynamodb': { color: '#3B48CC', bgColor: '#E8EAF6' },
    'rds': { color: '#3B48CC', bgColor: '#E8EAF6' },
    'ec2': { color: '#FF9900', bgColor: '#FFF3E0' },
    'elb': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'alb': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'nlb': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'vpc': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'route53': { color: '#8C4FFF', bgColor: '#F3E5F5' },
    'api_gateway': { color: '#FF4F8B', bgColor: '#FCE4EC' },
    'sns': { color: '#FF4F8B', bgColor: '#FCE4EC' },
    'sqs': { color: '#FF4F8B', bgColor: '#FCE4EC' },
    'iam': { color: '#DD344C', bgColor: '#FFEBEE' },
    'kms': { color: '#DD344C', bgColor: '#FFEBEE' },
    'elasticache': { color: '#C925D1', bgColor: '#F3E5F5' },
    'redis': { color: '#C925D1', bgColor: '#F3E5F5' },
    'cloudwatch': { color: '#E7157B', bgColor: '#FCE4EC' },
    'eks': { color: '#FF9900', bgColor: '#FFF3E0' },
    'ecs': { color: '#FF9900', bgColor: '#FFF3E0' },
    'asg': { color: '#FF9900', bgColor: '#FFF3E0' },
    'sg': { color: '#DD344C', bgColor: '#FFEBEE' },
    'default': { color: '#232F3E', bgColor: '#ECEFF1' },
  };

  if (!type) {
    return colorMap.default;
  }

  const normalizedType = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  for (const [key, value] of Object.entries(colorMap)) {
    if (normalizedType.includes(key)) {
      return value;
    }
  }
  
  return colorMap.default;
};

export default function ResourceDependencyGraph({ resources = [] }: ResourceDependencyGraphProps) {
  console.log('🔗 ResourceDependencyGraph rendering with resources:', resources);
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!resources || resources.length === 0) {
      return { nodes: [], edges: [] };
    }

    console.log('🔨 Building nodes and edges from resources...');

    const nodes: Node[] = resources.map((resource, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const colors = getResourceColor(resource.type);
      const iconUrl = getResourceIconUrl(resource.type);
      
      return {
        id: resource.id,
        type: 'default',
        position: { x: col * 280, y: row * 140 },
        data: {
          label: (
            <div className="flex items-center gap-3 p-2">
              <div className="flex-shrink-0">
                <img 
                  src={iconUrl} 
                  alt={resource.type}
                  style={{ width: 48, height: 48 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://unpkg.com/aws-icons@latest/icons/architecture-service/AmazonEC2.svg';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">
                  {resource.name}
                </div>
                <div className="text-xs text-gray-600 uppercase tracking-wide">
                  {resource.type}
                </div>
              </div>
            </div>
          ),
        },
        style: {
          backgroundColor: colors.bgColor,
          borderColor: colors.color,
          borderWidth: 2,
          padding: 8,
          borderRadius: 8,
          minWidth: 240,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      };
    });

    console.log('✅ Created nodes:', nodes);

    const edges: Edge[] = [];
    resources.forEach((resource) => {
      console.log(`Checking dependencies for ${resource.id}:`, resource.dependencies);
      
      if (resource.dependencies && resource.dependencies.length > 0) {
        resource.dependencies.forEach((depId) => {
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
            const colors = getResourceColor(node.data.type || '');
            return colors.color;
          }}
        />
      </ReactFlow>
    </div>
  );
}
