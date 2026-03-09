import React, { Suspense } from 'react';
import CourseSkillTreeClient from '@/components/course/CourseSkillTreeClient';

export default function CourseSkillTreePage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading Math Academy Course...</div>}>
      <CourseSkillTreeClient />
    </Suspense>
  );
}
