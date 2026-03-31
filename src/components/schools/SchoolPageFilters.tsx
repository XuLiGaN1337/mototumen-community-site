import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { categories } from "./data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SchoolData } from "./types";
import { Card } from "@/components/ui/card";

interface SchoolPageFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  filteredCount: number;
  totalCount: number;
  onClearFilters: () => void;
}

const SchoolPageFilters: React.FC<SchoolPageFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  isEditing,
  setIsEditing,
  filteredCount,
  totalCount,
  onClearFilters
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SchoolData>>({
    name: "",
    description: "",
    category: "",
    location: "",
    phone: "",
    price: "",
    experience: "",
    instructor: "",
    rating: 5.0,
    image: "",
    courses: [],
    features: [],
  });

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      location: "",
      phone: "",
      price: "",
      experience: "",
      instructor: "",
      rating: 5.0,
      image: "",
      courses: [],
      features: [],
    });
  };

  const handleSubmit = () => {
    console.log("Создание школы:", formData);
    setIsDialogOpen(false);
    resetForm();
  };
  return (
    <section className="py-6 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Поиск мотошкол..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Категория" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-accent hover:bg-accent/90">
                  <Icon name="Plus" className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать мотошколу</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        placeholder="Название школы"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        placeholder="Описание школы"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Категория</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleFormChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(c => c !== "Все").map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">Адрес</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleFormChange("location", e.target.value)}
                        placeholder="ул. Пример, 1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleFormChange("phone", e.target.value)}
                        placeholder="+7 (3452) 555-123"
                      />
                    </div>

                    <div>
                      <Label htmlFor="price">Стоимость</Label>
                      <Input
                        id="price"
                        value={formData.price}
                        onChange={(e) => handleFormChange("price", e.target.value)}
                        placeholder="от 15 000 ₽"
                      />
                    </div>

                    <div>
                      <Label htmlFor="instructor">Инструктор</Label>
                      <Input
                        id="instructor"
                        value={formData.instructor}
                        onChange={(e) => handleFormChange("instructor", e.target.value)}
                        placeholder="Имя инструктора"
                      />
                    </div>

                    <div>
                      <Label htmlFor="experience">Опыт</Label>
                      <Input
                        id="experience"
                        value={formData.experience}
                        onChange={(e) => handleFormChange("experience", e.target.value)}
                        placeholder="15+ лет"
                      />
                    </div>

                    <div>
                      <Label htmlFor="image">URL изображения</Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => handleFormChange("image", e.target.value)}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSubmit}
                        className="flex-1 bg-accent hover:bg-accent/90"
                      >
                        Создать
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetForm();
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">Предпоказ</h3>
                    <Card className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={formData.image || "https://picsum.photos/400/300?random=99"} 
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <div className="flex items-center gap-1 bg-green-500/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-green-400">
                            <div className="w-2 h-2 rounded-full bg-green-200" />
                            <span className="text-xs font-medium text-white">ОТКРЫТО</span>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3">
                          <div className="flex items-center gap-1 bg-background/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm border border-border">
                            <Icon name="Star" className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs font-medium text-foreground">
                              {formData.rating || 5.0}
                            </span>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm rounded px-2 py-1">
                          <span className="text-white text-xs font-medium">
                            {formData.category || "Категория"}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-foreground truncate">
                            {formData.name || "Название школы"}
                          </h3>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {formData.description || "Описание школы..."}
                          </p>
                        </div>

                        <div className="space-y-2 mb-4">
                          {formData.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="MapPin" className="h-3 w-3 text-blue-500 flex-shrink-0" />
                              <span className="truncate">{formData.location}</span>
                            </div>
                          )}
                          {formData.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="Phone" className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span>{formData.phone}</span>
                            </div>
                          )}
                          {formData.price && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="DollarSign" className="h-3 w-3 text-orange-500 flex-shrink-0" />
                              <span>{formData.price}</span>
                            </div>
                          )}
                          {formData.experience && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="Award" className="h-3 w-3 text-purple-500 flex-shrink-0" />
                              <span>Опыт: {formData.experience}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            <Icon name="Phone" className="h-4 w-4 mr-1" />
                            Позвонить
                          </Button>
                          <Button className="flex-1 bg-accent hover:bg-accent/90" size="sm">
                            <Icon name="Info" className="h-4 w-4 mr-1" />
                            Подробнее
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
              size="sm"
            >
              <Icon name="Edit" className="h-4 w-4 mr-2" />
              {isEditing ? "Сохранить" : "Редактировать"}
            </Button>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>Найдено: {filteredCount} из {totalCount}</span>
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <Icon name="X" className="h-3 w-3 mr-1" />
            Очистить
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SchoolPageFilters;