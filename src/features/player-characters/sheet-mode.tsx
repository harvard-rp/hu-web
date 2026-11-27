import type { SheetMode } from '@/lib/services/character-contract';
import { isExternalSheetUrl } from '@/lib/services/external-sheet';

export function SheetModeChoice({
  value,
  change,
}: {
  value: SheetMode;
  change: (mode: SheetMode) => void;
}) {
  return (
    <fieldset className="player-choice">
      <legend>Mode de fiche</legend>
      <label>
        <input
          type="radio"
          name="sheet-mode"
          checked={value === 'inline'}
          onChange={() => change('inline')}
        />
        Rédiger ma fiche sur le site
      </label>
      <label>
        <input
          type="radio"
          name="sheet-mode"
          checked={value === 'external'}
          onChange={() => change('external')}
        />
        Utiliser une fiche externe
      </label>
    </fieldset>
  );
}

export function ExternalSheetLink({
  url,
  label = 'Ouvrir la fiche externe',
}: {
  url: string | null;
  label?: string;
}) {
  return url && isExternalSheetUrl(url) ? (
    <a
      className="text-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label} (nouvel onglet)
    </a>
  ) : (
    <span className="player-muted">Lien de consultation indisponible.</span>
  );
}
