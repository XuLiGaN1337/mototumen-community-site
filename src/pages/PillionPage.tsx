import React, { useState, useEffect } from "react";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";

import { API_URL, Pilot, Passenger } from "./pillion/pillionTypes";
import { PilotCard, PassengerCard } from "./pillion/PillionCards";
import { PillionDetailModal } from "./pillion/PillionDetailModal";
import { PilotFormModal, PassengerFormModal } from "./pillion/PillionFormModals";

const PillionPage: React.FC = () => {
  const { user, token, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<"pilots" | "passengers">("pilots");

  // Списки
  const [pilots, setPilots] = useState<Pilot[]>([]);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loadingPilots, setLoadingPilots] = useState(true);
  const [loadingPassengers, setLoadingPassengers] = useState(true);

  // Карточка детали
  const [detailPilot, setDetailPilot] = useState<Pilot | null>(null);
  const [detailPassenger, setDetailPassenger] = useState<Passenger | null>(null);

  // Формы
  const [showPilotForm, setShowPilotForm] = useState(false);
  const [showPassengerForm, setShowPassengerForm] = useState(false);
  const [showAuthWarn, setShowAuthWarn] = useState(false);

  // Свои карточки (включая скрытые)
  const [myPilotCard, setMyPilotCard] = useState<Pilot | null>(null);
  const [myPassengerCard, setMyPassengerCard] = useState<Passenger | null>(null);

  const myPilot = myPilotCard ?? pilots.find((p) => p.user_id === user?.id);
  const myPassenger = myPassengerCard ?? passengers.find((p) => p.user_id === user?.id);

  // ── Загрузка ──────────────────────────────────────────────

  const loadPilots = async () => {
    setLoadingPilots(true);
    try {
      const r = await fetch(`${API_URL}?action=pilots`);
      const d = await r.json();
      setPilots(Array.isArray(d) ? d : []);
    } catch {
      setPilots([]);
    } finally {
      setLoadingPilots(false);
    }
  };

  const loadPassengers = async () => {
    setLoadingPassengers(true);
    try {
      const r = await fetch(`${API_URL}?action=passengers`);
      const d = await r.json();
      setPassengers(Array.isArray(d) ? d : []);
    } catch {
      setPassengers([]);
    } finally {
      setLoadingPassengers(false);
    }
  };

  useEffect(() => {
    loadPilots();
    loadPassengers();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`${API_URL}?action=pilots&user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setMyPilotCard(Array.isArray(d) ? (d[0] ?? null) : (d ?? null)))
      .catch(() => {});
    fetch(`${API_URL}?action=passengers&user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setMyPassengerCard(Array.isArray(d) ? (d[0] ?? null) : (d ?? null)))
      .catch(() => {});
  }, [user?.id]);

  // ── Обработчики кнопки создания ───────────────────────────

  const handleCreateBtn = () => {
    if (!isAuthenticated) {
      setShowAuthWarn(true);
      return;
    }
    if (tab === "pilots") {
      setShowPilotForm(true);
    } else {
      setShowPassengerForm(true);
    }
  };

  // ── Обновить список после сохранения ──────────────────────

  const afterPilotSaved = () => {
    loadPilots();
    if (user?.id) {
      fetch(`${API_URL}?action=pilots&user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => setMyPilotCard(Array.isArray(d) ? (d[0] ?? null) : (d ?? null)))
        .catch(() => {});
    }
  };

  const afterPassengerSaved = () => {
    loadPassengers();
    if (user?.id) {
      fetch(`${API_URL}?action=passengers&user_id=${user.id}`)
        .then((r) => r.json())
        .then((d) => setMyPassengerCard(Array.isArray(d) ? (d[0] ?? null) : (d ?? null)))
        .catch(() => {});
    }
  };

  // ── Обновить рейтинг после отзыва ─────────────────────────

  const afterReview = () => {
    loadPilots();
    loadPassengers();
  };

  // ── Текст кнопки ──────────────────────────────────────────

  const btnLabel =
    tab === "pilots"
      ? myPilot
        ? myPilot.is_active
          ? "Редактировать мою карточку"
          : "⚠ Карточка скрыта — включить"
        : "Разместить карточку пилота"
      : myPassenger
      ? myPassenger.is_active
        ? "Редактировать мою карточку"
        : "⚠ Карточка скрыта — включить"
      : "Разместить карточку пассажира";

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {/* ─── ХЕДЕР ─── */}
        <div className="mb-8 text-center">
          <h1 className="font-['Oswald'] text-4xl sm:text-5xl font-black text-white tracking-wide mb-2">
            ИЩУ ПИЛОТА /{" "}
            <span className="text-orange-500">ДВОЙКУ</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Найди себе попутчика или напарника для совместных поездок по Тюмени и области
          </p>
        </div>

        {/* ─── ТАБЫ ─── */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "pilots" | "passengers")}
          className="w-full"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="bg-zinc-800 border border-zinc-700">
              <TabsTrigger
                value="pilots"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <Icon name="Bike" size={16} className="mr-2" />
                Ищу двойку
              </TabsTrigger>
              <TabsTrigger
                value="passengers"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <Icon name="Users" size={16} className="mr-2" />
                Ищу пилота
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={handleCreateBtn}
              className={`${
                myPilot && !myPilot.is_active
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-orange-500 hover:bg-orange-600"
              } text-white`}
            >
              <Icon name="Plus" size={16} className="mr-2" />
              {btnLabel}
            </Button>
          </div>

          {/* ─── ПИЛОТЫ ─── */}
          <TabsContent value="pilots">
            {loadingPilots ? (
              <div className="flex justify-center py-16">
                <Icon name="Loader2" size={32} className="animate-spin text-gray-500" />
              </div>
            ) : pilots.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Bike" size={48} className="text-zinc-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Пока нет карточек пилотов</p>
                <p className="text-gray-500 text-sm mt-1">Будь первым!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pilots.map((pilot) => (
                  <PilotCard
                    key={pilot.id}
                    pilot={pilot}
                    onClick={() => setDetailPilot(pilot)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ─── ПАССАЖИРЫ ─── */}
          <TabsContent value="passengers">
            {loadingPassengers ? (
              <div className="flex justify-center py-16">
                <Icon name="Loader2" size={32} className="animate-spin text-gray-500" />
              </div>
            ) : passengers.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="Users" size={48} className="text-zinc-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Пока нет карточек пассажиров</p>
                <p className="text-gray-500 text-sm mt-1">Будь первым!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {passengers.map((passenger) => (
                  <PassengerCard
                    key={passenger.id}
                    passenger={passenger}
                    onClick={() => setDetailPassenger(passenger)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* ─── МОДАЛ ДЕТАЛИ ПИЛОТА ─── */}
        <PillionDetailModal
          open={!!detailPilot}
          onClose={() => setDetailPilot(null)}
          type="pilot"
          pilot={detailPilot ?? undefined}
          currentUserId={user?.id}
          token={token}
          onReviewSent={afterReview}
        />

        {/* ─── МОДАЛ ДЕТАЛИ ПАССАЖИРА ─── */}
        <PillionDetailModal
          open={!!detailPassenger}
          onClose={() => setDetailPassenger(null)}
          type="passenger"
          passenger={detailPassenger ?? undefined}
          currentUserId={user?.id}
          token={token}
          onReviewSent={afterReview}
        />

        {/* ─── ФОРМА ПИЛОТА ─── */}
        {token && (
          <PilotFormModal
            open={showPilotForm}
            onClose={() => setShowPilotForm(false)}
            token={token}
            initial={myPilot ?? undefined}
            onSaved={afterPilotSaved}
          />
        )}

        {/* ─── ФОРМА ПАССАЖИРА ─── */}
        {token && (
          <PassengerFormModal
            open={showPassengerForm}
            onClose={() => setShowPassengerForm(false)}
            token={token}
            initial={myPassenger ?? undefined}
            onSaved={afterPassengerSaved}
          />
        )}

        {/* ─── ПРЕДУПРЕЖДЕНИЕ О ВХОДЕ ─── */}
        <Dialog open={showAuthWarn} onOpenChange={setShowAuthWarn}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white">Требуется авторизация</DialogTitle>
            </DialogHeader>
            <p className="text-gray-400 text-sm">
              Чтобы разместить карточку, войдите в аккаунт.
            </p>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white mt-2"
              onClick={() => setShowAuthWarn(false)}
            >
              Понятно
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default PillionPage;
