import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import ShopHero from "@/components/shop/ShopHero";
import ShopPageFilters from "@/components/shop/ShopPageFilters";
import ShopList from "@/components/shop/ShopList";
import { ShopData } from "@/components/shop/types";

const API_URL = "https://functions.poehali.dev/34a08e29-2d68-492d-958c-6de39b313388";

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShops = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ type: "shops" });
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
      console.error("Error loading shops:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, [selectedCategory]);

  const filteredShops = editData;

  const handleEdit = (id: number, field: keyof ShopData, value: string | number) => {
    setEditData(prev => prev.map(shop => 
      shop.id === id ? { ...shop, [field]: value } : shop
    ));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Все");
  };

  const handleSearch = () => {
    loadShops();
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-background">
        <ShopHero />
        <ShopPageFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          filteredCount={filteredShops.length}
          totalCount={editData.length}
          onClearFilters={clearFilters}
          onSearch={handleSearch}
        />
        <ShopList
          shops={filteredShops}
          isEditing={isEditing}
          onEdit={handleEdit}
        />
      </div>
    </PageLayout>
  );
};

export default Shop;