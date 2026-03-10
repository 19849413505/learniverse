"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, BookOpen, Quote } from 'lucide-react';

export default function TutorsLounge() {
  const [affinities, setAffinities] = useState<any[]>([]);
  const [diaries, setDiaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiEndpoint = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
    fetch(`${apiEndpoint}/affinity/status/demo-user-id`)
      .then(res => res.json())
      .then(data => {
         setAffinities(data.affinities || []);
         setDiaries(data.diaries || []);
         setLoading(false);
      })
      .catch(e => {
         console.error(e);
         setLoading(false);
      });
  }, []);

  const getPersonaName = (id: string) => {
     if (id === 'Socrates') return '苏格拉底';
     if (id === 'Feynman') return '费曼';
     if (id === 'Seneca') return '塞内卡';
     return id;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-[80vh] font-bold text-gray-500">Entering the Lounge...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 flex justify-center items-center gap-3">
          <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
          Tutor Affinities
        </h1>
        <p className="text-gray-500">Your relationship bonds with your virtual mentors based on your learning performance.</p>
      </div>

      {/* Affinity Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {affinities.map((aff) => (
          <div key={aff.personaId} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
               <Heart className={`w-8 h-8 ${aff.score > 10 ? 'fill-rose-500' : ''}`} />
            </div>
            <h3 className="font-bold text-xl text-gray-800">{getPersonaName(aff.personaId)}</h3>
            <p className="text-sm text-gray-500 mt-1">Bond Level</p>
            <div className="text-3xl font-extrabold text-indigo-600 mt-4">{aff.score}</div>
          </div>
        ))}
        {affinities.length === 0 && (
           <div className="col-span-3 text-center text-gray-400 py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              No bonds established yet. Complete a Micro-Lesson to generate a diary entry!
           </div>
        )}
      </div>

      {/* Diary Entries */}
      <div className="space-y-6">
         <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Tutors' Secret Diaries
         </h2>
         <div className="space-y-4">
           {diaries.map((entry, idx) => (
             <motion.div
               key={entry.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden"
             >
               <Quote className="absolute top-4 right-4 w-12 h-12 text-gray-100 rotate-180" />
               <div className="flex items-center gap-3 mb-4">
                  <span className="font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm">
                    {getPersonaName(entry.personaId)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
               <p className="text-gray-700 italic leading-relaxed z-10 relative">"{entry.content}"</p>
             </motion.div>
           ))}
         </div>
      </div>
    </div>
  );
}
