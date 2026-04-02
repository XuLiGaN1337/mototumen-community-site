import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ServiceHero from "@/components/services/ServiceHero";
import ServicePageFilters from "@/components/services/ServicePageFilters";
import ServiceList from "@/components/services/ServiceList";
import { ServiceData } from "@/components/services/types";

const API_URL = "https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388";

const Service = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "services" });
      if (selectedCategory !== "Все") {
        params.append("category", selectedCategory);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`${API_URL}?${params}`);
      const data = await response.json();
      setEditData(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [selectedCategory]);

  const filteredServices = editData;

  const handleEdit = (id: number, field: keyof ServiceData, value: string | number) => {
    setEditData(prev => prev.map(service => 
      service.id === id ? { ...service, [field]: value } : service
    ));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Все");
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        <ServiceHero />
        <ServicePageFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          filteredCount={filteredServices.length}
          totalCount={editData.length}
          onClearFilters={clearFilters}
        />
        <ServiceList
          services={filteredServices}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </div>
    </PageLayout>
  );
};

export default Service;