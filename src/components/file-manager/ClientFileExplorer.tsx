"use client";

import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/toaster";

// 动态导入RealFileExplorer组件，禁用SSR
const RealFileExplorer = dynamic(
  () => import('@/components/file-manager/RealFileExplorer'),
  { ssr: false }
);

export default function ClientFileExplorer() {
  return (
    <>
      <RealFileExplorer />
      <Toaster />
    </>
  );
}
