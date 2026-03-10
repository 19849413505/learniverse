import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Lock, Unlock, CheckCircle, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const CustomNode = memo(({ data, isConnectable }: any) => {
  const router = useRouter();
  const { label, description, status, nodeId, deckId } = data;

  const handleClick = () => {
    if (status === 'unlocked' || status === 'completed') {
       router.push(`/lesson?nodeId=${nodeId}&deckId=${deckId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative p-4 rounded-2xl border-2 transition-all w-[250px] shadow-sm bg-white ${
      status === 'completed' ? 'border-green-400 bg-green-50 shadow-green-100' :
      status === 'unlocked' ? 'border-indigo-500 shadow-indigo-200 cursor-pointer hover:shadow-lg hover:-translate-y-1' :
      'border-gray-200 bg-gray-50 opacity-70'
    }`}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        className="w-3 h-3 bg-gray-300"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          status === 'completed' ? 'bg-green-100 text-green-600' :
          status === 'unlocked' ? 'bg-indigo-100 text-indigo-600' :
          'bg-gray-200 text-gray-500'
        }`}>
          {status === 'completed' ? <CheckCircle className="w-4 h-4" /> :
           status === 'unlocked' ? <BookOpen className="w-4 h-4" /> :
           <Lock className="w-4 h-4" />}
        </div>
        <h3 className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight">{label}</h3>
      </div>

      <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-2">{description}</p>

      {status === 'locked' && (
         <div className="mt-3 text-[10px] font-bold text-rose-400 uppercase tracking-wider text-center bg-rose-50 py-1 rounded-md">
           Locked
         </div>
      )}

      {status === 'unlocked' && (
         <div className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider text-center bg-indigo-50 py-1 rounded-md">
           Start Learning
         </div>
      )}

      {status === 'completed' && (
         <div className="mt-3 text-[10px] font-bold text-green-600 uppercase tracking-wider text-center bg-green-100 py-1 rounded-md">
           Mastered
         </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        className="w-3 h-3 bg-indigo-300"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
