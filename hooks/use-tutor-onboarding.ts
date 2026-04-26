export interface TutorOnboardingData {
  tutorId: string;
  nombre: string;
  apellido: string;
  bio: string;
}

const DEFAULT: TutorOnboardingData = {
  tutorId: '',
  nombre: '',
  apellido: '',
  bio: '',
};

let _state: TutorOnboardingData = { ...DEFAULT };

export function getTutorOnboarding(): TutorOnboardingData {
  return _state;
}

export function setTutorOnboarding(partial: Partial<TutorOnboardingData>): void {
  _state = { ..._state, ...partial };
}

export function resetTutorOnboarding(): void {
  _state = { ...DEFAULT };
}
