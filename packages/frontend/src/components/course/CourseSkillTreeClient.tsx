"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, CheckCircle, BookOpen } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CourseSkillTreeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deckId');

  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

  useEffect(() => {
    if (!deckId) return;
    fetch(`${apiEndpoint}/course/skill-tree/demo-user-id/${deckId}`)
      .then(res => res.json())
      .then(data => {
        setNodes(data.nodes || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, [deckId, apiEndpoint]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading Skill Tree...</div>;
  }

  // Very naive tree rendering for MVP: just a vertical path
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900">Math Academy Path</h1>
        <p className="text-gray-500">Mastery learning requires you to complete prerequisites first.</p>
      </div>

      <div className="relative border-l-4 border-indigo-200 ml-8 space-y-12 py-8">
        {nodes.map((node, i) => {
          // Check if all prerequisites are completed
          const prerequisites = node.prerequisites || [];
          const isLocked = prerequisites.some((prereq: any) => {
             const prereqNode = nodes.find(n => n.id === prereq.sourceId);
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
                    onClick={async () => {
                       // MVP: Automatically complete it and refresh
                       await fetch(`${apiEndpoint}/course/complete-node/demo-user-id/${node.id}`, { method: 'POST' });
                       window.location.reload();
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
