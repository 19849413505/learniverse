"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, CheckCircle, BookOpen } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import DiagnosticModal from './diagnostic/DiagnosticModal';

export default function CourseSkillTreeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deckId');

  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ⚡ Bolt: Cache node map for O(1) lookups during render using useMemo
  // Prevents O(N^2) complexity while ensuring data doesn't go stale
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // Diagnostic State
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<any[]>([]);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  useEffect(() => {
    if (!deckId) {
      router.push('/courses');
    }
  }, [deckId, router]);

  const fetchSkillTree = () => {
    if (!deckId) return;
    setLoading(true);
    fetch(`${apiEndpoint}/course/skill-tree/demo-user-id/${deckId}`)
      .then(res => res.json())
      .then(data => {
        const fetchedNodes = data.nodes || [];
        setNodes(fetchedNodes);

        // Trigger diagnostic test if user is completely new to this course (no completed nodes)
        const hasProgress = fetchedNodes.some((n: any) => n.userStatus === 'completed');
        if (!hasProgress && fetchedNodes.length > 0) {
           fetchDiagnosticQuestions();
        } else {
           setLoading(false);
        }
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  };

  const fetchDiagnosticQuestions = async () => {
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
        setLoading(false);
     }
  };

  useEffect(() => {
    fetchSkillTree();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, apiEndpoint]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen font-bold text-gray-500">Loading Skill Tree...</div>;
  }

  // Very naive tree rendering for MVP: just a vertical path
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900">Math Academy Path</h1>
        <p className="text-gray-500">Mastery learning requires you to complete prerequisites first.</p>
      </div>

      {showDiagnostic && (
        <DiagnosticModal
          deckId={deckId as string}
          questions={diagnosticQuestions}
          onComplete={() => {
             setShowDiagnostic(false);
             fetchSkillTree(); // Refresh tree to show newly unlocked nodes
          }}
        />
      )}

      <div className="relative border-l-4 border-indigo-200 ml-8 space-y-12 py-8">
        {nodes.map((node, i) => {
          // Check if all prerequisites are completed
          const prerequisites = node.prerequisites || [];
          const isLocked = prerequisites.some((prereq: any) => {
             // ⚡ Bolt: Replace O(N) array search with O(1) map lookup
             // Critical for large skill trees where rendering becomes O(N^2)
             const prereqNode = nodeMap.get(prereq.sourceId);
             return prereqNode?.userStatus !== 'completed';
          });

          // Override userStatus based on strict frontend calculation for MVP
          const currentStatus = isLocked ? 'locked' : (node.userStatus === 'completed' ? 'completed' : 'unlocked');

          return (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-8"
            >
              {/* Icon / Node */}
              <div className={`absolute -left-[26px] top-4 w-12 h-12 rounded-full border-4 flex items-center justify-center bg-white ${
                currentStatus === 'completed' ? 'border-green-500 text-green-500' :
                currentStatus === 'unlocked' ? 'border-indigo-500 text-indigo-500 shadow-lg shadow-indigo-200' :
                'border-gray-300 text-gray-300'
              }`}>
                 {currentStatus === 'completed' ? <CheckCircle className="w-6 h-6" /> :
                  currentStatus === 'unlocked' ? <Unlock className="w-5 h-5" /> :
                  <Lock className="w-5 h-5" />}
              </div>

              {/* Card */}
              <div className={`p-6 rounded-2xl border-2 transition-all ${
                 currentStatus === 'completed' ? 'bg-green-50 border-green-200' :
                 currentStatus === 'unlocked' ? 'bg-white border-indigo-200 shadow-md cursor-pointer hover:border-indigo-400' :
                 'bg-gray-50 border-gray-200 opacity-60'
              }`}>
                <h3 className="text-xl font-bold text-gray-900">{node.name}</h3>
                <p className="text-gray-600 mt-2">{node.description}</p>

                {currentStatus === 'unlocked' && (
                  <button
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700"
                    onClick={() => {
                       router.push(`/lesson?nodeId=${node.id}&deckId=${deckId}`);
                    }}
                  >
                    <BookOpen className="w-4 h-4" /> Start Micro-Lesson
                  </button>
                )}

                {currentStatus === 'locked' && (
                   <p className="text-sm text-rose-500 mt-4 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Complete prerequisites to unlock
                   </p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
