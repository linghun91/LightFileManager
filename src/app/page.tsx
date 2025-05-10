import FileExplorer from '@/components/file-manager/FileExplorer';
import AppLogo from '@/components/icons/AppLogo';
import { Toaster } from "@/components/ui/toaster";


export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-3 sm:p-4 border-b flex items-center gap-2 sm:gap-3 shadow-sm sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <AppLogo className="text-primary h-6 w-6 sm:h-7 sm:w-7" />
        <h1 className="text-lg sm:text-xl font-semibold">Light File Manager</h1>
      </header>
      <main className="flex-1 overflow-hidden"> {/* Ensures FileExplorer can manage its own scroll/layout */}
        <FileExplorer />
      </main>
      <Toaster />
    </div>
  );
}
