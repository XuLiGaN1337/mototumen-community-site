import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RoleBadgeProps {
  currentRole: string;
  canChange?: boolean;
  onRoleChange?: (role: string) => void;
  isCeo?: boolean;
}

const ROLE_CONFIG = {
  ceo: { emoji: " 👑", label: "CEO" },
  admin: { emoji: " ⚡", label: "Админ" },
  moderator: { emoji: " 🛡️", label: "Модератор" },
  user: { emoji: "", label: "Пользователь" }
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ 
  currentRole, 
  canChange = false, 
  onRoleChange,
  isCeo = false
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentConfig = ROLE_CONFIG[currentRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.user;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const handleClick = () => {
    if (isCeo || !canChange) return;
    
    if (window.innerWidth < 768) {
      if (!tooltipOpen) {
        setTooltipOpen(true);
        setTimeout(() => setTooltipOpen(false), 2000);
      } else {
        setShowOptions(!showOptions);
        setTooltipOpen(false);
      }
    } else {
      setShowOptions(!showOptions);
    }
  };

  const handleRoleSelect = (role: string) => {
    if (onRoleChange) {
      onRoleChange(role);
    }
    setShowOptions(false);
    setTooltipOpen(false);
  };

  if (!canChange || isCeo) {
    return (
      <TooltipProvider>
        <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>
            <span className="text-2xl cursor-default">
              {currentConfig.emoji}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentConfig.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <TooltipProvider>
        <Tooltip open={tooltipOpen && !showOptions} onOpenChange={setTooltipOpen}>
          <TooltipTrigger asChild>
            <button
              onClick={handleClick}
              className="text-2xl cursor-pointer hover:scale-110 transition-transform"
            >
              {currentConfig.emoji}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentConfig.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {showOptions && (
        <div className="absolute top-8 left-0 z-50 bg-popover border rounded-lg shadow-lg p-2 space-y-1 min-w-[140px]">
          {currentRole !== 'admin' && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleRoleSelect('admin')}
            >
              ⚡ Админ
            </Button>
          )}
          {currentRole !== 'moderator' && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleRoleSelect('moderator')}
            >
              🛡️ Модератор
            </Button>
          )}
          {currentRole !== 'user' && (
            <Button
              size="sm"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => handleRoleSelect('user')}
            >
              Пользователь
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export const getRoleEmoji = (role: string): string => {
  return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.emoji || "";
};

export const getRoleLabel = (role: string): string => {
  return ROLE_CONFIG[role as keyof typeof ROLE_CONFIG]?.label || "Пользователь";
};