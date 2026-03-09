import React, { Suspense } from 'react';
import LessonClient from '@/components/course/LessonClient';

export default function LessonPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading Lesson...</div>}>
      <LessonClient />
    </Suspense>
  );
}
