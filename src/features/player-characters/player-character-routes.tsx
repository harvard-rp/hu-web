import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { type AuthController } from '@/features/auth/auth-session';
import { useAuth } from '@/features/auth/use-auth';
import { NotFoundPage } from '@/routes/not-found-page';
import { PersonalSpacePage } from '@/routes/personal-space-page';
import { CharacterDirectory, CreateCharacter } from './character-directory';
import { CharacterSheetRoute } from './character-sheet-page';

const StaffReviewRoutes = lazy(
  () => import('@/features/staff-reviews/staff-review-routes'),
);

export default function PlayerCharacterRoutes({
  controller,
  staffReviewsEnabled,
}: {
  controller: AuthController;
  staffReviewsEnabled: boolean;
}) {
  const state = useAuth(controller);
  if (state.kind !== 'ready')
    return <PersonalSpacePage controller={controller} />;

  const session = { controller, scope: state.scope };
  return (
    <Routes key={state.scope.id}>
      <Route
        index
        element={
          <CharacterDirectory
            session={session}
            player={state.player}
            showStaff={staffReviewsEnabled && !!state.reviewSignal}
          />
        }
      />
      <Route
        path="characters/new"
        element={<CreateCharacter session={session} />}
      />
      <Route
        path="characters/:characterId"
        element={<CharacterSheetRoute session={session} />}
      />
      <Route
        path="characters/:characterId/edit"
        element={<CharacterSheetRoute session={session} editing />}
      />
      {staffReviewsEnabled && (
        <Route
          path="staff/*"
          element={<StaffReviewRoutes controller={controller} />}
        />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
