import type { CoachId } from '../types';

export interface Coach {
  id: CoachId;
  name: string;
  look: {
    bg: string;
    skin: string;
    hair: string;
    top: string;
    style: 'long' | 'short' | 'bun';
    beard?: boolean;
    glasses?: boolean;
  };
}

export const coaches: Coach[] = [
  {
    id: 'lea',
    name: 'Léa',
    look: { bg: '#E6E0FA', skin: '#F1C7A5', hair: '#5B3A2E', top: '#8B7FD1', style: 'long' },
  },
  {
    id: 'malik',
    name: 'Malik',
    look: { bg: '#FCE3D6', skin: '#8D5B3E', hair: '#1F1A1A', top: '#E98E6B', style: 'short', beard: true },
  },
  {
    id: 'sofia',
    name: 'Sofia',
    look: { bg: '#DCEDE1', skin: '#D9A47E', hair: '#2B2230', top: '#5E8C6A', style: 'bun', glasses: true },
  },
];

export const getCoach = (id: CoachId | null | undefined) => coaches.find((c) => c.id === id) ?? coaches[0];
