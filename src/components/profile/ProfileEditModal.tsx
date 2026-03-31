import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface ProfileEditModalProps {
  isOpen: boolean;
  loading: boolean;
  uploadingMedia: boolean;
  editForm: any;
  onClose: () => void;
  onSave: () => void;
  onChange: (field: string, value: any) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  loading,
  uploadingMedia,
  editForm,
  onClose,
  onSave,
  onChange,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-lg sm:max-w-2xl max-h-[95vh] overflow-y-auto bg-[#252836] text-white border-gray-700 p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold">Редактировать профиль</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-gray-300 text-sm">Телефон</Label>
              <Input
                value={editForm.phone}
                onChange={(e) => onChange('phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
                className="bg-[#1e2332] border-gray-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Локация</Label>
              <Input
                value={editForm.location}
                onChange={(e) => onChange('location', e.target.value)}
                placeholder="Город, страна"
                className="bg-[#1e2332] border-gray-700 text-white mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-gray-300 text-sm">Позывной</Label>
              <Input
                value={editForm.callsign}
                onChange={(e) => onChange('callsign', e.target.value)}
                placeholder="MOTO777"
                className="bg-[#1e2332] border-gray-700 text-white mt-1"
                maxLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">До 20 символов</p>
            </div>
            <div>
              <Label className="text-gray-300 text-sm">Telegram</Label>
              <Input
                value={editForm.telegram}
                onChange={(e) => onChange('telegram', e.target.value)}
                placeholder="@username"
                className="bg-[#1e2332] border-gray-700 text-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-sm">Пол</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={editForm.gender === 'male' ? 'default' : 'outline'}
                onClick={() => onChange('gender', 'male')}
                className={`flex-1 sm:flex-none ${editForm.gender === 'male' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700'}`}
              >
                <Icon name="User" className="h-4 w-4 mr-2" />
                Мужской
              </Button>
              <Button
                type="button"
                variant={editForm.gender === 'female' ? 'default' : 'outline'}
                onClick={() => onChange('gender', 'female')}
                className={`flex-1 sm:flex-none ${editForm.gender === 'female' ? 'bg-pink-600 hover:bg-pink-700' : 'border-gray-700'}`}
              >
                <Icon name="User" className="h-4 w-4 mr-2" />
                Женский
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-gray-300 text-sm">О себе</Label>
            <Textarea
              value={editForm.bio}
              onChange={(e) => onChange('bio', e.target.value)}
              placeholder="Расскажите о себе..."
              rows={3}
              className="bg-[#1e2332] border-gray-700 text-white resize-none mt-1"
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-gray-700">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading || uploadingMedia}
              className="border-gray-700 flex-1 sm:flex-none"
            >
              Отмена
            </Button>
            <Button
              onClick={onSave}
              disabled={loading || uploadingMedia}
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              {loading || uploadingMedia ? (
                <>
                  <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                  {uploadingMedia ? 'Загрузка...' : 'Сохранение...'}
                </>
              ) : (
                <>
                  <Icon name="Save" className="h-4 w-4 mr-2" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};