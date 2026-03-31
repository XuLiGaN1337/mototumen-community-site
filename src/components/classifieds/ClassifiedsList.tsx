import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import ClassifiedCard from "./ClassifiedCard";
import { Classified, Filters } from "./ClassifiedTypes";

interface ClassifiedsListProps {
  classifieds: Classified[];
  activeTab: string;
  setActiveTab: (v: string) => void;
  getFilteredClassifieds: (type?: string) => Classified[];
  sortedClassifieds: (items: Classified[]) => Classified[];
}

const ClassifiedsList: React.FC<ClassifiedsListProps> = ({
  activeTab,
  setActiveTab,
  getFilteredClassifieds,
  sortedClassifieds,
}) => (
  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
    <TabsList className="grid w-full grid-cols-5">
      <TabsTrigger value="all">Все</TabsTrigger>
      <TabsTrigger value="sale">Продажа</TabsTrigger>
      <TabsTrigger value="wanted">Куплю</TabsTrigger>
      <TabsTrigger value="exchange">Обмен</TabsTrigger>
      <TabsTrigger value="free">Даром</TabsTrigger>
    </TabsList>

    {["all", "sale", "wanted", "exchange", "free"].map((tabValue) => {
      const filtered = getFilteredClassifieds(tabValue === "all" ? undefined : tabValue);
      const sorted = sortedClassifieds(filtered);
      return (
        <TabsContent key={tabValue} value={tabValue} className="mt-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Объявлений: {filtered.length}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sorted.map((classified) => (
              <ClassifiedCard key={classified.id} item={classified} user={null} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Icon name="FileText" className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Объявления не найдены</h3>
              <p className="text-muted-foreground">
                Попробуйте изменить параметры поиска или фильтры
              </p>
            </div>
          )}
        </TabsContent>
      );
    })}
  </Tabs>
);

export default ClassifiedsList;
