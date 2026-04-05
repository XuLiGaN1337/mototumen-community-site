import React from "react";
import Icon from "@/components/ui/icon";
import { Section } from "./docsSections";

interface DocsContentProps {
  section: Section;
}

export const DocsContent: React.FC<DocsContentProps> = ({ section }) => {
  return (
    <main className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <Icon name={section.icon as "Shield"} size={16} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-white">{section.title}</h2>
      </div>
      {section.content}
    </main>
  );
};
