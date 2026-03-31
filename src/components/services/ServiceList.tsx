import React from "react";
import Icon from "@/components/ui/icon";
import ServiceCard from "./ServiceCard";
import { ServiceData } from "./types";

interface ServiceListProps {
  services: ServiceData[];
  isEditing: boolean;
  onEdit: (id: number, field: keyof ServiceData, value: string | number) => void;
}

const ServiceList: React.FC<ServiceListProps> = ({ services, isEditing, onEdit }) => {
  if (services.length === 0) {
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
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isEditing={isEditing}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceList;