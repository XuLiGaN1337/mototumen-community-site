import React from "react";
import Icon from "@/components/ui/icon";
import SchoolCard from "./SchoolCard";
import { SchoolData } from "./types";

interface SchoolListProps {
  schools: SchoolData[];
  isEditing: boolean;
  onEdit: (id: number, field: keyof SchoolData, value: string | number) => void;
}

const SchoolList: React.FC<SchoolListProps> = ({ schools, isEditing, onEdit }) => {
  if (schools.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center py-12">
            <Icon name="Search" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ничего не найдено</h3>
            <p className="text-muted-foreground">Попробуйте изменить параметры поиска</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 sm:py-10 px-4">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {schools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              isEditing={isEditing}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SchoolList;