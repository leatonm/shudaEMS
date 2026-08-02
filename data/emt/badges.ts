import type { ImageSourcePropType } from 'react-native';

import type { CallCategory } from '@/data/emt/types';

export type BadgeId =
  | 'first_call'
  | 'streak_3'
  | 'streak_7'
  | 'five_star'
  | 'exam_pass'
  | 'daily_done'
  | 'category_tour'
  | 'centurion';

export interface BadgeDef {
  id: BadgeId;
  title: string;
  description: string;
  icon: ImageSourcePropType;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_call',
    title: 'First Response',
    description: 'Complete your first training call.',
    icon: require('../../assets/icons/ambulance.png'),
  },
  {
    id: 'streak_3',
    title: 'On a Roll',
    description: 'Play on 3 days in a row.',
    icon: require('../../assets/icons/streak.png'),
  },
  {
    id: 'streak_7',
    title: 'Week on Shift',
    description: 'Play on 7 days in a row.',
    icon: require('../../assets/icons/streak.png'),
  },
  {
    id: 'five_star',
    title: 'Textbook Call',
    description: 'Earn 5 stars on a single run.',
    icon: require('../../assets/icons/level-up.png'),
  },
  {
    id: 'exam_pass',
    title: 'Exam Ready',
    description: 'Pass a skills sheet on Exam difficulty.',
    icon: require('../../assets/icons/exam.png'),
  },
  {
    id: 'daily_done',
    title: 'Daily Responder',
    description: 'Finish today’s daily challenge.',
    icon: require('../../assets/icons/challenge.png'),
  },
  {
    id: 'category_tour',
    title: 'Full Board',
    description: 'Complete a call in every category.',
    icon: require('../../assets/icons/badge.png'),
  },
  {
    id: 'centurion',
    title: 'Centurion',
    description: 'Reach 1,000 total XP.',
    icon: require('../../assets/icons/trophy.png'),
  },
];

export function getBadge(id: BadgeId): BadgeDef {
  const found = BADGES.find((b) => b.id === id);
  if (!found) throw new Error(`Unknown badge ${id}`);
  return found;
}

export const ALL_CATEGORIES: CallCategory[] = ['medical', 'trauma', 'peds', 'ob', 'mci'];
