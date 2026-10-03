import { type Key, tr } from '../game/i18n';
import { useGame } from '../game/store';

/** Translation hook: const t = useT(); t('play') */
export function useT(): (key: Key) => string {
  const lang = useGame((s) => s.settings.lang);
  return (key) => tr(lang, key);
}
