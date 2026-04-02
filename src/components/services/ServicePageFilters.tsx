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
import { ServiceData } from "./types";
import { Card } from "@/components/ui/card";

interface ServicePageFiltersProps {
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

const ServicePageFilters: React.FC<ServicePageFiltersProps> = ({
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
  const [formData, setFormData] = useState<Partial<ServiceData>>({
    name: "",
    description: "",
    category: "",
    location: "",
    phone: "",
    hours: "",
    rating: 5.0,
    image: "",
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
      hours: "",
      rating: 5.0,
      image: "",
    });
  };

  const handleSubmit = () => {
    console.log("Создание услуги:", formData);
    setIsDialogOpen(false);
    resetForm();
  };

  const getServiceStatus = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const workTimeMatch = formData.hours?.match(/(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/);
    
    if (workTimeMatch) {
      const [, startHour, startMin, endHour, endMin] = workTimeMatch;
      const startTime = parseInt(startHour) + parseInt(startMin) / 60;
      const endTime = parseInt(endHour) + parseInt(endMin) / 60;
      const currentTime = currentHour + now.getMinutes() / 60;
      const isWorkDay = currentDay >= 1 && currentDay <= 6;
      const isWorkTime = currentTime >= startTime && currentTime < endTime;
      return isWorkDay && isWorkTime;
    }
    return false;
  };

  const isOpen = getServiceStatus();
  return (
    <section className="py-6 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-4">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Поиск мотосервисов..."
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
                <span className="hidden" />
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать услугу</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Название</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleFormChange("name", e.target.value)}
                        placeholder="Название услуги"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Описание</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormChange("description", e.target.value)}
                        placeholder="Описание услуги"
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
                      <Label htmlFor="hours">Часы работы</Label>
                      <Input
                        id="hours"
                        value={formData.hours}
                        onChange={(e) => handleFormChange("hours", e.target.value)}
                        placeholder="09:00-18:00"
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
                          <div className={`flex items-center gap-1 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border ${
                            isOpen 
                              ? 'bg-green-500/90 border-green-400' 
                              : 'bg-red-500/90 border-red-400'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              isOpen ? 'bg-green-200' : 'bg-red-200'
                            }`} />
                            <span className="text-xs font-medium text-white">
                              {isOpen ? 'ОТКРЫТО' : 'ЗАКРЫТО'}
                            </span>
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
                            {formData.name || "Название услуги"}
                          </h3>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {formData.description || "Описание услуги..."}
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
                          {formData.hours && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Icon name="Clock" className="h-3 w-3 text-orange-500 flex-shrink-0" />
                              <span>{formData.hours}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" size="sm">
                            <Icon name="Phone" className="h-4 w-4 mr-1" />
                            Позвонить
                          </Button>
                          <Button className="flex-1 bg-accent hover:bg-accent/90" size="sm">
                            <Icon name="MapPin" className="h-4 w-4 mr-1" />
                            На карте
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </DialogContent>
            </Dialog>


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

export default ServicePageFilters;