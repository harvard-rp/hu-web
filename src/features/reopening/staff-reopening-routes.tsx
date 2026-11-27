import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/use-auth';
import type { AuthController } from '@/features/auth/auth-session';
import {
  CharacterError,
  CharacterState,
  Screen,
  characterName,
  charactersDate,
  kindLabel,
} from '@/features/player-characters/character-ui';
import {
  usePlayerQuery,
  type PlayerSession,
} from '@/features/player-characters/player-queries';
import {
  ReviewHistory,
  SheetFields,
} from '@/features/player-characters/sheet-display';
import { ApiError } from '@/lib/services/api-error';
import { characterId } from '@/lib/services/character-contract';
import { ReopeningForm, ReopeningTimeline } from './reopening-ui';
import { NotFoundPage } from '@/routes/not-found-page';

type Session = PlayerSession & { grant: AbortSignal };
const path = '/account/reopening';
const back = { to: path, label: 'Retour aux archives staff' };
const account = { to: '/account', label: 'Retour à mes personnages' };

export default function StaffReopeningRoutes({
  controller,
}: {
  controller: AuthController;
}) {
  const state = useAuth(controller);
  if (state.kind !== 'ready') return null; // The surrounding account route handles authentication.
  if (!state.reopenSignal)
    return (
      <Screen title="Accès aux réouvertures indisponible" back={account}>
        {state.reopenRefusal ? (
          <CharacterError
            error={state.reopenRefusal}
            message="Vous n’avez plus l’autorisation de traiter les réouvertures."
          />
        ) : (
          <p role="status">
            Votre compte ne dispose pas de cette autorisation.
          </p>
        )}
      </Screen>
    );
  const session = { controller, scope: state.scope, grant: state.reopenSignal };
  return (
    <Routes key={state.scope.id}>
      <Route index element={<StaffArchives session={session} />} />
      <Route
        path=":characterId"
        element={<StaffArchiveRoute session={session} />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function StaffArchives({
  session: { controller, scope, grant },
}: {
  session: Session;
}) {
  const [cursors, setCursors] = useState<string[]>([]);
  const cursor = cursors.at(-1);
  const load = useCallback(
    (signal: AbortSignal) =>
      controller.reopeningRequest(
        scope,
        grant,
        ({ reopen }, token, signal) => reopen.archives(token, signal, cursor),
        signal,
      ),
    [controller, scope, grant, cursor],
  );
  const { state, retry } = usePlayerQuery(load);
  const next = state.kind === 'ready' ? state.data.data.nextCursor : null;
  return (
    <Screen title="Réouverture des archives" back={account}>
      <div className="player-section-bar">
        <p className="player-muted">
          Archives staff et demandes de réouverture
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCursors([]);
            retry();
          }}
        >
          Actualiser les archives
        </Button>
      </div>
      {state.kind === 'loading' && (
        <p role="status">Chargement des archives…</p>
      )}
      {state.kind === 'error' && (
        <CharacterError error={state.error} retry={retry} />
      )}
      {state.kind === 'ready' &&
        (state.data.data.items.length ? (
          <ul
            className="player-surface staff-queue"
            aria-label="Personnages archivés"
          >
            {state.data.data.items.map((sheet) => {
              const name =
                [sheet.firstName, sheet.lastName].filter(Boolean).join(' ') ||
                'Personnage sans nom';
              return (
                <li key={sheet.id}>
                  <div>
                    <strong>{name}</strong>
                    <p className="player-muted">
                      {kindLabel[sheet.kind]} · {sheet.refusalCount} refus
                    </p>
                    <span className="player-status">
                      {sheet.pendingRequestId
                        ? 'Demande en attente'
                        : 'Aucune demande en attente'}
                    </span>
                  </div>
                  <div className="player-muted">
                    Archivé le{' '}
                    <time dateTime={sheet.archivedAt}>
                      {charactersDate.format(new Date(sheet.archivedAt))}
                    </time>
                  </div>
                  <Button asChild variant="outline">
                    <Link
                      to={`${path}/${sheet.id}`}
                      aria-label={`Consulter l’archive de ${name}`}
                    >
                      Consulter
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Aucun personnage archivé sur cette page.</p>
        ))}
      {(cursor || next) && (
        <nav className="player-actions" aria-label="Pages des archives">
          <Button
            type="button"
            variant="outline"
            disabled={!cursor || state.kind === 'loading'}
            onClick={() => setCursors(cursors.slice(0, -1))}
          >
            Page précédente
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!next || cursors.includes(next)}
            onClick={() => {
              if (next) setCursors([...cursors, next]);
            }}
          >
            Page suivante
          </Button>
        </nav>
      )}
    </Screen>
  );
}

function StaffArchiveRoute({ session }: { session: Session }) {
  const { characterId: id = '' } = useParams();
  if (!characterId.safeParse(id).success)
    return <Screen title="Archive introuvable" back={back} />;
  return <StaffArchiveDetail key={id} id={id} session={session} />;
}

function StaffArchiveDetail({
  id,
  session: { controller, scope, grant },
}: {
  id: string;
  session: Session;
}) {
  const navigate = useNavigate();
  const loadArchive = useCallback(
    (signal: AbortSignal) =>
      controller.reopeningRequest(
        scope,
        grant,
        ({ reopen }, token, signal) => reopen.detail(token, signal, id),
        signal,
      ),
    [controller, scope, grant, id],
  );
  const loadHistory = useCallback(
    (signal: AbortSignal) =>
      controller.reopeningRequest(
        scope,
        grant,
        ({ reopen }, token, signal) => reopen.history(token, signal, id),
        signal,
      ),
    [controller, scope, grant, id],
  );
  const load = useCallback(
    async (signal: AbortSignal) => {
      const { data: archive } = await loadArchive(signal);
      const [history, houses, programs] = await Promise.all([
        loadHistory(signal),
        controller.reopeningRequest(
          scope,
          grant,
          ({ characters }, token, signal) => characters.houses(token, signal),
          signal,
        ),
        controller.reopeningRequest(
          scope,
          grant,
          ({ characters }, token, signal) => characters.programs(token, signal),
          signal,
        ),
      ]);
      return {
        ...archive,
        history: history.data,
        houses: houses.data,
        programs: programs.data,
      };
    },
    [controller, scope, grant, loadArchive, loadHistory],
  );
  const { state, retry } = usePlayerQuery(load);

  if (state.kind !== 'ready')
    return (
      <Screen title="Examen de l’archive" back={back}>
        {state.kind === 'loading' ? (
          <p role="status">Chargement de la fiche…</p>
        ) : state.error instanceof ApiError && state.error.status === 404 ? (
          <CharacterError
            error={state.error}
            message="Cette fiche n’est plus accessible dans les archives staff."
          />
        ) : (
          <CharacterError error={state.error} retry={retry} />
        )}
      </Screen>
    );

  const { sheet, reviews, history, houses, programs } = state.data;
  const pending = history.findLast((row) => row.decision === null);
  return (
    <Screen title={characterName(sheet)} back={back}>
      <div>
        <p className="player-muted">{kindLabel[sheet.kind]}</p>
        <CharacterState character={sheet} />
      </div>
      <div className="staff-examination">
        <div className="staff-examination-reading">
          <section
            className="player-surface player-panel"
            aria-labelledby="archived-sheet"
          >
            <h2 id="archived-sheet">Fiche archivée</h2>
            <SheetFields
              sheet={sheet}
              houses={houses}
              programs={programs}
              showAll
            />
          </section>
          <ReviewHistory reviews={reviews} houses={houses} />
          <ReopeningTimeline history={history} />
        </div>
        {pending && (
          <ReopeningForm
            key={pending.requestId}
            sheet={sheet}
            signal={grant}
            pendingId={pending.requestId}
            reload={retry}
            finished={() => {
              void navigate(path, { replace: true });
            }}
            send={async (input, signal) => {
              const outcome = await controller.reopeningRequest(
                scope,
                grant,
                ({ reopen }, token, signal) =>
                  reopen.decide(token, signal, id, input),
                signal,
              );
              if (!signal.aborted && !grant.aborted)
                toast.success(
                  outcome.data.decision === 'accepted'
                    ? 'Réouverture acceptée.'
                    : 'Réouverture refusée.',
                );
            }}
            check={async (signal) => {
              const [archive, timeline] = await Promise.all([
                loadArchive(signal).catch((failure: unknown) => {
                  if (failure instanceof ApiError && failure.status === 404)
                    return null;
                  throw failure;
                }),
                loadHistory(signal),
              ]);
              return {
                sheet: archive?.data.sheet ?? null,
                history: timeline.data,
              };
            }}
          />
        )}
      </div>
    </Screen>
  );
}
