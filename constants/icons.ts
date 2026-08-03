import type { ImageSourcePropType } from 'react-native';

import type { CallCategory, EmtDifficulty } from '@/data/emt/types';

/** Extracted from the EMT icon pack sheet (`scripts/extractIcons.py`). */
export const Icons = {
  appLogo: require('../assets/icons/app-logo.png') as ImageSourcePropType,
  ambulance: require('../assets/icons/ambulance.png') as ImageSourcePropType,
  trainingShield: require('../assets/icons/training-shield.png') as ImageSourcePropType,
  streak: require('../assets/icons/streak.png') as ImageSourcePropType,
  trophy: require('../assets/icons/trophy.png') as ImageSourcePropType,
  badge: require('../assets/icons/badge.png') as ImageSourcePropType,
  challenge: require('../assets/icons/challenge.png') as ImageSourcePropType,
  userAvatar: require('../assets/icons/user-avatar.png') as ImageSourcePropType,
  arrowRight: require('../assets/icons/arrow-right.png') as ImageSourcePropType,
  medicMascot: require('../assets/icons/medic-mascot.png') as ImageSourcePropType,
  coach: require('../assets/icons/coach.png') as ImageSourcePropType,
  standard: require('../assets/icons/standard.png') as ImageSourcePropType,
  exam: require('../assets/icons/exam.png') as ImageSourcePropType,
  time: require('../assets/icons/time.png') as ImageSourcePropType,
  calendar: require('../assets/icons/calendar.png') as ImageSourcePropType,
  info: require('../assets/icons/info.png') as ImageSourcePropType,
  check: require('../assets/icons/check.png') as ImageSourcePropType,
  locked: require('../assets/icons/locked.png') as ImageSourcePropType,
  message: require('../assets/icons/message.png') as ImageSourcePropType,
  scenario: require('../assets/icons/scenario.png') as ImageSourcePropType,
  mode: require('../assets/icons/mode.png') as ImageSourcePropType,
  progress: require('../assets/icons/progress.png') as ImageSourcePropType,
  home: require('../assets/icons/home.png') as ImageSourcePropType,
  back: require('../assets/icons/back.png') as ImageSourcePropType,
  medical: require('../assets/icons/medical.png') as ImageSourcePropType,
  trauma: require('../assets/icons/trauma.png') as ImageSourcePropType,
  peds: require('../assets/icons/peds.png') as ImageSourcePropType,
  ob: require('../assets/icons/ob.png') as ImageSourcePropType,
  mci: require('../assets/icons/mci.png') as ImageSourcePropType,
  random: require('../assets/icons/random.png') as ImageSourcePropType,
  medicalMascot: require('../assets/icons/medical-mascot.png') as ImageSourcePropType,
  traumaMascot: require('../assets/icons/trauma-mascot.png') as ImageSourcePropType,
  pedsMascot: require('../assets/icons/peds-mascot.png') as ImageSourcePropType,
  obMascot: require('../assets/icons/ob-mascot.png') as ImageSourcePropType,
  mciMascot: require('../assets/icons/mci-mascot.png') as ImageSourcePropType,
  randomMascot: require('../assets/icons/random-mascot.png') as ImageSourcePropType,
} as const;

export const DIFFICULTY_ICONS: Record<EmtDifficulty, ImageSourcePropType> = {
  coach: Icons.coach,
  standard: Icons.standard,
  exam: Icons.exam,
};

export const CATEGORY_ICONS: Record<CallCategory, ImageSourcePropType> = {
  medical: Icons.medical,
  trauma: Icons.trauma,
  peds: Icons.peds,
  ob: Icons.ob,
  mci: Icons.mci,
};

export const CATEGORY_MASCOTS: Record<CallCategory | 'random', ImageSourcePropType> = {
  medical: Icons.medicalMascot,
  trauma: Icons.traumaMascot,
  peds: Icons.pedsMascot,
  ob: Icons.obMascot,
  mci: Icons.mciMascot,
  random: Icons.randomMascot,
};

export const HOW_IT_WORKS: Array<{
  n: number;
  color: string;
  title: string;
  body: string;
  icon: ImageSourcePropType;
}> = [
  {
    n: 1,
    color: '#22C55E',
    title: 'Choose Category',
    body: 'Select the type of call you want to run.',
    icon: require('../assets/icons/home.png') as ImageSourcePropType,
  },
  {
    n: 2,
    color: '#3B82F6',
    title: 'Choose Mode',
    body: 'Pick your difficulty — Coach, Standard, or Exam.',
    icon: require('../assets/icons/mode.png') as ImageSourcePropType,
  },
  {
    n: 3,
    color: '#A855F7',
    title: 'Read Scenario',
    body: 'Review patient information and scene details.',
    icon: require('../assets/icons/scenario.png') as ImageSourcePropType,
  },
  {
    n: 4,
    color: '#EF4444',
    title: 'Answer Questions',
    body: 'Apply your knowledge and make decisions.',
    icon: require('../assets/icons/answer.png') as ImageSourcePropType,
  },
  {
    n: 5,
    color: '#F59E0B',
    title: 'Get Feedback',
    body: 'See how you did and what to review.',
    icon: require('../assets/icons/exam.png') as ImageSourcePropType,
  },
  {
    n: 6,
    color: '#14B8A6',
    title: 'Level Up',
    body: 'Earn XP, unlock badges, and climb the leaderboard.',
    icon: require('../assets/icons/progress.png') as ImageSourcePropType,
  },
];

export const DIFFICULTY_CARD_COPY: Record<
  EmtDifficulty,
  { tagline: string; accent: string; glow: string }
> = {
  coach: {
    tagline: 'Hints & explanations',
    accent: '#22F5A8',
    glow: 'rgba(34, 245, 168, 0.22)',
  },
  standard: {
    tagline: 'Realistic scenarios',
    accent: '#00E5FF',
    glow: 'rgba(0, 229, 255, 0.28)',
  },
  exam: {
    tagline: 'No hints, timed',
    accent: '#B36BFF',
    glow: 'rgba(179, 107, 255, 0.28)',
  },
};
