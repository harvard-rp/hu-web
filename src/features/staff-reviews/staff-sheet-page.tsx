import { useCallback, useState } from 'react';
import { useParams } from 'react-router';
import {
  CharacterError,
  CharacterState,
  Screen,
  characterName,
  kindLabel,
} from '@/features/player-characters/character-ui';
import { usePlayerQuery } from '@/features/player-characters/player-queries';
import {
  ReviewHistory,
  SheetFields,
} from '@/features/player-characters/sheet-display';
import { characterId } from '@/lib/services/character-contract';
import { ApiError } from '@/lib/services/api-error';
import { backToQueue, type ReviewSession } from './review-access';
import { DecisionForm } from './decision-form';

export function StaffSheetPage({ session }: { session: ReviewSession }) {
  const { characterId: id = '' } = useParams();
  if (!characterId.safeParse(id).success)
    return <Screen title="Fiche introuvable" back={backToQueue} />;
  return <StaffSheet key={id} id={id} session={session} />;
}

function StaffSheet({ id, session }: { id: string; session: ReviewSession }) {
  const { controller, scope, grant } = session;
  const [closed, setClosed] = useState(false);
  const load = useCallback(
    async (signal: AbortSignal) => {
      const { data: sheet } = await controller.staffRequest(
        scope,
        grant,
        ({ staff }, token, signal) => staff.detail(token, signal, id),
        signal,
      );
      const [reviews, houses, programs] = await Promise.all([
        controller.staffRequest(
          scope,
          grant,
          ({ staff }, token, signal) => staff.reviews(token, signal, id),
          signal,
        ),
        controller.staffRequest(
          scope,
          grant,
          ({ characters }, token, signal) => characters.houses(token, signal),
          signal,
        ),
        controller.staffRequest(
          scope,
          grant,
          ({ characters }, token, signal) => characters.programs(token, signal),
          signal,
        ),
      ]);
      return {
        sheet,
        reviews: reviews.data,
        houses: houses.data,
        programs: programs.data,
      };
    },
    [controller, scope, grant, id],
  );
  const { state, retry } = usePlayerQuery(load);
  if (state.kind !== 'ready') {
    const missing =
      state.kind === 'error' &&
      state.error instanceof ApiError &&
      state.error.code === 'CHARACTER_NOT_FOUND';
    return (
      <Screen title="Examen de la fiche" back={backToQueue}>
        {state.kind === 'loading' ? (
          <p role="status">Chargement de la fiche…</p>
        ) : (
          <CharacterError
            error={state.error}
            retry={missing ? undefined : retry}
            message={
              missing
                ? 'Cette fiche est introuvable ou n’est plus en attente.'
                : undefined
            }
          />
        )}
      </Screen>
    );
  }
  const { sheet, reviews, houses, programs } = state.data;

  return (
    <Screen
      title={closed ? 'Examen de la fiche' : characterName(sheet)}
      back={backToQueue}
    >
      {!closed && (
        <div>
          <p className="player-muted">{kindLabel[sheet.kind]}</p>
          <CharacterState character={sheet} />
        </div>
      )}
      <div className={closed ? undefined : 'staff-examination'}>
        {!closed && (
          <div className="staff-examination-reading">
            <section
              className="player-surface player-panel"
              aria-labelledby="staff-sheet-title"
            >
              <h2 id="staff-sheet-title">Fiche du personnage</h2>
              <SheetFields
                sheet={sheet}
                houses={houses}
                programs={programs}
                showAll
              />
            </section>
            <ReviewHistory reviews={reviews} houses={houses} />
          </div>
        )}
        <DecisionForm
          session={session}
          sheet={sheet}
          houses={houses}
          historySize={reviews.length}
          reload={retry}
          onClosed={() => setClosed(true)}
        />
      </div>
    </Screen>
  );
}
