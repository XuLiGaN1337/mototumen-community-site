import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { sections } from "@/components/docs/docsSections";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsContent } from "@/components/docs/DocsContent";

const Docs: React.FC = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("roles");

  const current = sections.find(s => s.id === active)!;

  return (
    <div className="min-h-screen bg-zinc-900 text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-zinc-400 hover:text-white">
          <Icon name="ArrowLeft" className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-['Oswald']">Документация</h1>
          <p className="text-zinc-400">Всё о платформе МОТОТюмень: роли, функции и правила</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <DocsSidebar sections={sections} active={active} onSelect={setActive} />
          <DocsContent section={current} />
        </div>
      </div>
    </div>
  );
};

export default Docs;
