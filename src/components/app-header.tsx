import { BrainCircuit } from 'lucide-react';

export default function AppHeader() {
  return (
    <header className="no-print border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
            Correlator
          </h1>
        </div>
        <p className="text-sm text-muted-foreground hidden md:block">
          Uncover hidden patterns in your life.
        </p>
      </div>
    </header>
  );
}
