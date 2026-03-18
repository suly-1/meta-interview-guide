import { useState, useEffect } from "react";

export interface CandidateProfile {
  name: string;
  targetLevel: "IC6" | "IC7" | "";
  currentRole: string;
  strongAreas: string[];
  weakAreas: string[];
  completed: boolean;
}

const DEFAULT_PROFILE: CandidateProfile = {
  name: "",
  targetLevel: "",
  currentRole: "",
  strongAreas: [],
  weakAreas: [],
  completed: false,
};

const STORAGE_KEY = "meta-guide-candidate-profile";

export function useCandidateProfile() {
  const [profile, setProfile] = useState<CandidateProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {}
  }, [profile]);

  const updateProfile = (updates: Partial<CandidateProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const resetProfile = () => setProfile(DEFAULT_PROFILE);

  return { profile, updateProfile, resetProfile };
}
