import { Route, Routes } from 'react-router';
import { useAuth } from '@/features/auth/use-auth';
import type { AuthController } from '@/features/auth/auth-session';
import {
  CharacterError,
  Screen,
} from '@/features/player-characters/character-ui';
import { NotFoundPage } from '@/routes/not-found-page';
import { PersonalSpacePage } from '@/routes/personal-space-page';
import { backToAccount } from './review-access';
import { StaffQueuePage } from './staff-queue-page';
import { StaffSheetPage } from './staff-sheet-page';

export default function StaffReviewRoutes({
  controller,
}: {
  controller: AuthController;
}) {
  const state = useAuth(controller);
  if (state.kind !== 'ready')
    return <PersonalSpacePage controller={controller} />;
  if (!state.reviewSignal)
    return (
      <Screen title="Accès staff indisponible" back={backToAccount}>
        {state.reviewRefusal ? (
          <CharacterError
            error={state.reviewRefusal}
            message="L’autorisation d’examiner les fiches n’est plus disponible."
          />
        ) : (
          <p role="status">
            Votre compte ne dispose pas de l’autorisation d’examiner les fiches.
          </p>
        )}
      </Screen>
    );

  const session = { controller, scope: state.scope, grant: state.reviewSignal };
  return (
    <Routes key={state.scope.id}>
      <Route index element={<StaffQueuePage session={session} />} />
      <Route
        path="characters/:characterId"
        element={<StaffSheetPage session={session} />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
