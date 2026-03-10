"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import DiagnosticModal from './diagnostic/DiagnosticModal';
import ReactFlow, { Background, Controls, Edge, Node, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './CustomNode';
import { getLayoutedElements } from './layoutNodes';
import useSWR from 'swr';

const nodeTypes = {
  custom: CustomNode,
};

export default function CourseSkillTreeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deckId');

  const [rfNodes, setRfNodes] = useState<Node[]>([]);
  const [rfEdges, setRfEdges] = useState<Edge[]>([]);
  const [loadingDiagnostic, setLoadingDiagnostic] = useState(false);

  // Diagnostic State
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<any[]>([]);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  const fetcher = (url: string) => fetch(url).then(res => res.json());

  const { data: treeData, error, isLoading, mutate } = useSWR(
    deckId ? `${apiEndpoint}/course/skill-tree/demo-user-id/${deckId}` : null,
    fetcher
  );

  const fetchDiagnosticQuestions = async () => {
     setLoadingDiagnostic(true);
     try {
       const res = await fetch(`${apiEndpoint}/course/diagnostic/${deckId}`);
       const data = await res.json();
       if (data.questions && data.questions.length > 0) {
          setDiagnosticQuestions(data.questions);
          setShowDiagnostic(true);
       }
     } catch (e) {
        console.error("Failed to load diagnostic", e);
     } finally {
        setLoadingDiagnostic(false);
     }
  };

  useEffect(() => {
     if (treeData && treeData.nodes) {
        const fetchedNodes = treeData.nodes || [];

        // Transform for React Flow
        const flowNodes: Node[] = [];
        const flowEdges: Edge[] = [];

        fetchedNodes.forEach((node: any) => {
          const prerequisites = node.prerequisites || [];
          const isLocked = prerequisites.some((prereq: any) => {
             const prereqNode = fetchedNodes.find((n: any) => n.id === prereq.sourceId);
             return prereqNode?.userStatus !== 'completed';
          });
          const currentStatus = isLocked ? 'locked' : (node.userStatus === 'completed' ? 'completed' : 'unlocked');

          flowNodes.push({
            id: node.id,
            type: 'custom',
            position: { x: 0, y: 0 }, // Will be calculated by dagre
            data: {
               label: node.name,
               description: node.description,
               status: currentStatus,
               nodeId: node.id,
               deckId: deckId
            }
          });

          // Create edges based on dependencies
          prerequisites.forEach((prereq: any) => {
             flowEdges.push({
                id: `e-${prereq.sourceId}-${node.id}`,
                source: prereq.sourceId,
                target: node.id,
                type: 'smoothstep',
                animated: currentStatus === 'unlocked', // Animate edges leading to unlocked nodes
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                  color: '#818cf8',
                },
                style: { stroke: '#818cf8', strokeWidth: 2 }
             });
          });
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes,
          flowEdges
        );

        setRfNodes(layoutedNodes);
        setRfEdges(layoutedEdges);

        // Trigger diagnostic test if user is completely new to this course (no completed nodes)
        const hasProgress = fetchedNodes.some((n: any) => n.userStatus === 'completed');
        if (!hasProgress && fetchedNodes.length > 0 && !showDiagnostic && diagnosticQuestions.length === 0) {
           fetchDiagnosticQuestions();
        }
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeData]);

  if (isLoading) {
    return (
       <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)] space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="font-bold text-gray-500">Loading Curriculum Path...</span>
       </div>
    );
  }

  if (error) {
     return <div className="flex justify-center items-center h-screen font-bold text-red-500">Failed to load curriculum.</div>;
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] bg-gray-50 relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-center bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-extrabold text-gray-900">Curriculum Path</h1>
        <p className="text-gray-500 text-sm">Mastery learning requires you to complete prerequisites first.</p>
      </div>

      {showDiagnostic && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
           <DiagnosticModal
             deckId={deckId as string}
             questions={diagnosticQuestions}
             onComplete={() => {
                setShowDiagnostic(false);
                mutate(); // Refresh tree using SWR to show newly unlocked nodes
             }}
           />
        </div>
      )}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        fitView
        className="bg-indigo-50/30"
        minZoom={0.1}
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
