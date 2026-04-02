import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import SchoolHero from "@/components/schools/SchoolHero";
import SchoolPageFilters from "@/components/schools/SchoolPageFilters";
import SchoolList from "@/components/schools/SchoolList";
import { SchoolData } from "@/components/schools/types";

const API_URL = "https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388";

const Schools = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "schools" });
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
      console.error("Error loading schools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, [selectedCategory]);

  const filteredSchools = editData;

  const handleEdit = (id: number, field: keyof SchoolData, value: string | number) => {
    setEditData(prev => prev.map(school => 
      school.id === id ? { ...school, [field]: value } : school
    ));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Все");
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        <SchoolHero />
        <SchoolPageFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          filteredCount={filteredSchools.length}
          totalCount={editData.length}
          onClearFilters={clearFilters}
        />
        <SchoolList
          schools={filteredSchools}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </div>
    </PageLayout>
  );
};

export default Schools;