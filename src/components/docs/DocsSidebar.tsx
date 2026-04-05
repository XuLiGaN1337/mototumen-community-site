import React from "react";
import Icon from "@/components/ui/icon";
import { Section } from "./docsSections";

interface DocsSidebarProps {
  sections: Section[];
  active: string;
  onSelect: (id: string) => void;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ sections, active, onSelect }) => {
  return (
    <aside className="md:w-60 flex-shrink-0">
      <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
              active === s.id
                ? "bg-accent text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <Icon name={s.icon as "Shield"} size={16} className="flex-shrink-0" />
            {s.title}
          </button>
        ))}
      </nav>
    </aside>
  );
};
