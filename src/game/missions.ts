// Mission definitions. To add a mission, push a new object to MISSIONS - no other code needs to change
// (as long as it uses one of the supported types).

import type { V2 } from './constants';
import { HOME_TARGET, TOWN_SQUARE } from './constants';

export type MissionType = 'goto' | 'drive' | 'collect' | 'defeat' | 'deliver' | 'help';

export interface Bi {
  km: string;
  en: string;
}

export interface MissionDef {
  id: string;
  type: MissionType;
  title: Bi;
  objective: Bi;
  intro: Bi; // what the NPC says when giving the mission
  hint: Bi; // what the NPC says if asked again
  done: Bi;
  target?: V2;
  radius?: number;
  count?: number;
  reward: number;
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'town-trip',
    type: 'drive',
    title: { km: 'ដំណើរទៅទីប្រជុំជន', en: 'Trip to Town' },
    objective: { km: 'បើកឡានទៅកាន់ចំណុចភ្លឺនៅទីប្រជុំជន', en: 'Drive the car to the glowing spot in town' },
    intro: {
      km: 'សួស្ដី! ខ្ញុំឈ្មោះសុខ។ សូមជួយបើកឡានទៅទីប្រជុំជនឱ្យខ្ញុំបន្តិច។',
      en: "Hi! I'm Sok. Could you drive the car to town for me?",
    },
    hint: { km: 'ឡានរបស់អ្នកចតនៅក្បែរផ្ទះ។ ចុចប៊ូតុងឡើងឡាន។', en: 'Your car is parked near the house. Press the enter button.' },
    done: { km: 'ល្អណាស់! អ្នកមកដល់ហើយ។', en: 'Great! You made it.' },
    target: TOWN_SQUARE,
    radius: 5,
    reward: 30,
  },
  {
    id: 'collect-coins',
    type: 'collect',
    title: { km: 'ប្រមូលកាក់', en: 'Collect Coins' },
    objective: { km: 'ប្រមូលកាក់ឱ្យបាន ៤', en: 'Collect 4 coins' },
    intro: {
      km: 'មានកាក់ជាច្រើនតាមផ្លូវនិងវាលស្រែ។ ជួយប្រមូលវាផង!',
      en: 'There are coins lying around the roads and fields. Help me collect them!',
    },
    hint: { km: 'រកមើលរង្វង់មាសភ្លឺៗ នៅតាមផ្លូវ។', en: 'Look for shiny gold discs along the roads.' },
    done: { km: 'អរគុណ! កាក់ទាំងនោះមានប្រយោជន៍ណាស់។', en: 'Thanks! Those coins will be very useful.' },
    count: 4,
    reward: 20,
  },
  {
    id: 'clear-enemies',
    type: 'defeat',
    title: { km: 'កម្ចាត់សត្រូវ', en: 'Clear the Enemies' },
    objective: { km: 'យកឈ្នះសត្រូវ ៣នាក់ នៅខាងជើងទន្លេ', en: 'Defeat 3 enemies north of the river' },
    intro: {
      km: 'មានសត្រូវនៅខាងជើងទន្លេ។ ឆ្លងស្ពាន ហើយបណ្តេញវាចេញទៅ!',
      en: 'Enemies are roaming north of the river. Cross the bridge and drive them off!',
    },
    hint: { km: 'ឆ្លងស្ពាន ហើយចុចប៊ូតុងវាយ។ អាចបើកឡានបុកវាបានដែរ។', en: 'Cross the bridge and press attack. You can also ram them with the car.' },
    done: { km: 'អ្នកក្លាហានណាស់!', en: 'You are brave!' },
    count: 3,
    reward: 50,
  },
  {
    id: 'back-home',
    type: 'goto',
    title: { km: 'ត្រឡប់ទៅផ្ទះ', en: 'Back Home' },
    objective: { km: 'ត្រឡប់ទៅផ្ទះរបស់អ្នក', en: 'Return to your home' },
    intro: { km: 'ល្អណាស់ ឥឡូវត្រឡប់ទៅផ្ទះសម្រាកទៅ។', en: 'Well done. Now head back home and rest.' },
    hint: { km: 'ផ្ទះរបស់អ្នកនៅភាគនិរតី។', en: 'Your home is in the south-west.' },
    done: {
      km: 'បេសកកម្ម Version 1 បានបញ្ចប់! តំបន់ថ្មីនឹងមកក្នុងការអាប់ដេតបន្ទាប់។',
      en: 'Version 1 missions complete! New areas are coming in the next update.',
    },
    target: HOME_TARGET,
    radius: 4,
    reward: 40,
  },
];

export interface ProgressInput {
  coinsCollected: number;
  kills: number;
  flag: boolean;
}

/** Progress is derived from totals, so a mission can never get "stuck" because of things done earlier. */
export function missionProgress(m: MissionDef, p: ProgressInput): { cur: number; max: number } {
  if (m.type === 'collect') return { cur: Math.min(m.count ?? 1, p.coinsCollected), max: m.count ?? 1 };
  if (m.type === 'defeat') return { cur: Math.min(m.count ?? 1, p.kills), max: m.count ?? 1 };
  return { cur: p.flag ? 1 : 0, max: 1 };
}
