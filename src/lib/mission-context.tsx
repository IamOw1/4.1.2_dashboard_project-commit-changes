import { createContext, useContext, useState, type ReactNode } from "react";
import { initialMissions, type Mission } from "@/lib/mock-data";

interface MissionContextValue {
  missions: Mission[];
  setMissions: (m: Mission[] | ((prev: Mission[]) => Mission[])) => void;
  updateMissionStatus: (missionId: string, status: Mission["status"]) => void;
}

const MissionContext = createContext<MissionContextValue | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const updateMissionStatus = (missionId: string, status: Mission["status"]) => {
    setMissions((prev) => prev.map((mission) => (mission.id === missionId ? { ...mission, status } : mission)));
  };
  return (
    <MissionContext.Provider value={{ missions, setMissions, updateMissionStatus }}>
      {children}
    </MissionContext.Provider>
  );
}

export function useMissions() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMissions must be used within MissionProvider");
  return ctx;
}
