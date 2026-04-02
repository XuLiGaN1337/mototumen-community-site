import React, { useState } from "react";
import UserProfileModal from "@/components/profile/UserProfileModal";

export function useUserProfileModal() {
  const [userId, setUserId] = useState<string | number | null>(null);

  const open = (id: string | number) => setUserId(id);
  const close = () => setUserId(null);

  const modal = (
    <UserProfileModal
      userId={userId}
      open={userId !== null}
      onClose={close}
    />
  );

  return { open, close, modal };
}
