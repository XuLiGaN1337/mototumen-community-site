import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { Filters } from "./ClassifiedTypes";

interface ClassifiedsFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  filters: Filters;
  handleFilterChange: (key: string, value: string) => void;
  clearFilters: () => void;
  categories: string[];
}

const ClassifiedsFilters: React.FC<ClassifiedsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  filters,
  handleFilterChange,
  clearFilters,
  categories,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">Фильтры</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="relative">
        <Icon name="Search" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Поиск объявлений..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Категория</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Все категории</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Цена</label>
        <select
          value={filters.priceRange}
          onChange={(e) => handleFilterChange("priceRange", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Любая цена</option>
          <option value="0-10000">До 10 000 ₽</option>
          <option value="10000-50000">10 000 - 50 000 ₽</option>
          <option value="50000-200000">50 000 - 200 000 ₽</option>
          <option value="200000-500000">200 000 - 500 000 ₽</option>
          <option value="500000+">От 500 000 ₽</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Состояние</label>
        <select
          value={filters.condition}
          onChange={(e) => handleFilterChange("condition", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Любое</option>
          <option value="new">Новое</option>
          <option value="used">Б/у</option>
          <option value="broken">Требует ремонта</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Тип цены</label>
        <select
          value={filters.priceType}
          onChange={(e) => handleFilterChange("priceType", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Любой тип</option>
          <option value="fixed">Фиксированная</option>
          <option value="negotiable">Торг</option>
          <option value="free">Бесплатно</option>
          <option value="exchange">Обмен</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Сортировка</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange("sortBy", e.target.value)}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="newest">Сначала новые</option>
          <option value="price-asc">Сначала дешевые</option>
          <option value="price-desc">Сначала дорогие</option>
          <option value="popular">По популярности</option>
        </select>
      </div>

      <Button onClick={clearFilters} variant="outline" className="w-full">
        <Icon name="RotateCcw" className="h-4 w-4 mr-2" />
        Сбросить фильтры
      </Button>
    </CardContent>
  </Card>
);

export default ClassifiedsFilters;
