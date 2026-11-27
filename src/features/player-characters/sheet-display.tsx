import { ExternalSheetLink } from './sheet-mode';
import type {
  CharacterCatalog,
  CharacterDetail,
  CharacterReviews,
} from '@/lib/services/character-contract';
import { charactersDate, validationLabel } from './character-ui';
import { catalogName, fieldsFor, sheetSections } from './sheet-fields';

export function ReviewHistory({
  reviews,
  houses,
}: {
  reviews: CharacterReviews;
  houses: CharacterCatalog;
}) {
  return (
    <section
      className="player-surface player-panel"
      aria-labelledby="review-history"
    >
      <h2 id="review-history">Décisions du staff</h2>
      {reviews.length ? (
        <ol className="player-reviews">
          {reviews.map((review, index) => (
            <li key={index}>
              <div className="player-section-bar">
                <strong>{validationLabel[review.decision]}</strong>
                <time className="player-muted" dateTime={review.reviewedAt}>
                  {charactersDate.format(new Date(review.reviewedAt))}
                </time>
              </div>
              {review.archivedCharacter && (
                <p>Fiche archivée à la suite de ce refus.</p>
              )}
              {review.externalEvidence && (
                <p>
                  {review.externalEvidence.attested
                    ? 'Consultation attestée'
                    : 'Référence externe sans consultation attestée'}
                  {' · '}
                  <ExternalSheetLink
                    url={review.externalEvidence.url}
                    label="Ouvrir le document référencé"
                  />
                </p>
              )}
              {review.comment && (
                <p className="player-prose">{review.comment}</p>
              )}
              {review.assignedHouseId && (
                <p>
                  House attribuée ·{' '}
                  {catalogName(
                    houses,
                    review.assignedHouseId,
                    'House hors catalogue',
                  )}
                </p>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="player-muted">Aucune décision pour cette fiche.</p>
      )}
    </section>
  );
}

export function SheetFields({
  sheet,
  houses,
  programs,
  showAll = false,
}: {
  sheet: CharacterDetail;
  houses: CharacterCatalog;
  programs: CharacterCatalog;
  showAll?: boolean;
}) {
  return (
    <div className="player-sheet-display">
      {sheetSections.map(({ title, fields }) => {
        const values: { label: string; value: React.ReactNode }[] = (
          showAll ? fields : fieldsFor(sheet.kind, fields)
        ).flatMap<{ label: string; value: React.ReactNode }>(
          ({ field, label }) => {
            if (field === 'sheetMode')
              return [
                {
                  label,
                  value:
                    sheet.sheetMode === 'external'
                      ? 'Fiche externe'
                      : 'Rédaction sur le site',
                },
              ];
            if (field === 'externalUrl')
              return sheet.sheetMode === 'external'
                ? [
                    {
                      label,
                      value: <ExternalSheetLink url={sheet.externalUrl} />,
                    },
                  ]
                : [];
            const value = sheet[field];
            if (value === null || (Array.isArray(value) && !value.length))
              return [];
            if (field === 'programId')
              return [
                {
                  label,
                  value: catalogName(
                    programs,
                    sheet.programId,
                    'Filière hors catalogue',
                  ),
                },
              ];
            if (typeof value === 'boolean')
              return [{ label, value: value ? 'Oui' : 'Non' }];
            return [
              {
                label,
                value: Array.isArray(value)
                  ? value.filter(Boolean).join('\n')
                  : String(value),
              },
            ];
          },
        );
        if (
          title === 'Université' &&
          (sheet.kind === 'student' || sheet.houseId)
        ) {
          values.push({
            label: 'House',
            value: catalogName(houses, sheet.houseId, 'House hors catalogue'),
          });
        }
        return (
          values.length > 0 && (
            <section key={title}>
              <h3>{title}</h3>
              <dl>
                {values.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd className="player-prose">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )
        );
      })}
    </div>
  );
}
