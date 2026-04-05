import React from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";

interface UserProfileTabsProps {
  vehiclesCount: number;
  friendsCount: number;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({ vehiclesCount, friendsCount }) => {
  return (
    <div className="bg-[#252836] rounded-lg p-2 mb-4">
      <TabsList className="grid w-full grid-cols-3 bg-[#1e2332]">
        <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
          <Icon name="User" className="h-4 w-4 mr-2" />
          Профиль
        </TabsTrigger>
        <TabsTrigger value="garage" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
          <Icon name="Car" className="h-4 w-4 mr-2" />
          Гараж
          {vehiclesCount > 0 && (
            <span className="ml-2 bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {vehiclesCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="friends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
          <Icon name="Users" className="h-4 w-4 mr-2" />
          Друзья
          {friendsCount > 0 && (
            <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {friendsCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </div>
  );
};
