export interface Profile {
  id: number;
  name: string;
  gender: 'Male' | 'Female';
  age: string;
  profession: string;
  relationship: string;
  audioUri?: string | null;
  audioName?: string | null;
}
