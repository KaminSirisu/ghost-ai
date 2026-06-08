import { FileText, Network, Sparkles } from "lucide-react";

interface AuthShellProps {
  children: React.ReactNode;
}

const featureItems = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Network,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="grid lg:grid-cols-2 bg-base min-h-screen font-sans text-copy-primary">
      <section className="hidden lg:flex lg:flex-col lg:justify-between px-12 xl:px-20 py-10 border-surface-border border-r bg-accent-dim">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center bg-primary shadow-primary/20 shadow-sm rounded-xl w-9 h-9">
            <p>G</p>
          </div>
          <p className="font-semibold text-copy-primary text-base">Ghost AI</p>
        </div>

        <div className="max-w-2xl">
          <h1 className="max-w-xl font-semibold text-copy-primary text-4xl leading-tight tracking-normal">
            Design systems at the speed of thought.
          </h1>
          <p className="mt-6 max-w-2xl text-copy-secondary text-lg leading-8">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <ul className="space-y-9 mt-16">
            {featureItems.map(({ description, icon: Icon, title }) => (
              <li key={title} className="flex gap-5">
                <span className="flex justify-center items-center mt-1 border border-brand/30 rounded-xl w-8 h-8 text-brand bg-accent-dim shrink-0">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold text-copy-secondary text-lg">
                    {title}
                  </span>
                  <span className="block mt-2 text-copy-muted text-base leading-7">
                    {description}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-copy-muted text-xs">
          (c) 2026 Ghost AI. All rights reserved.
        </p>
      </section>

      <section className="flex justify-center items-center bg-base px-5 py-8 min-h-screen font-sans">
        {children}
      </section>
    </main>
  );
}
