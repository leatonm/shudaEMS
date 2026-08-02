import type { ImageSourcePropType } from 'react-native';

export const Characters = {
  lauren: {
    id: 'lauren',
    name: 'Lauren',
    title: 'Medical Director',
    shortRole: 'MD',
    image: require('../assets/characters/md.png') as ImageSourcePropType,
    /** Skills-sheet fail / rough call debrief. */
    imageDisappointed: require('../assets/characters/md_dispointed.png') as ImageSourcePropType,
  },
  lee: {
    id: 'lee',
    name: 'Lee',
    title: 'Paramedic',
    shortRole: 'ALS',
    image: require('../assets/characters/medic.png') as ImageSourcePropType,
  },
  // Fire + Law: add images under assets/characters, then wire ResourceFlash
  // the same way as AlsFlash (enroute / cancel radio lines already stubbed).
} as const;
