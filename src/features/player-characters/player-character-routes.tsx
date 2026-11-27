import { OwnerArchives } from '@/features/reopening/owner-reopening-panel';
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

const StaffReopeningRoutes = lazy(
  () => import('@/features/reopening/staff-reopening-routes'),
);

export default function PlayerCharacterRoutes({
  controller,
  staffReviewsEnabled,
  reopeningEnabled,
}: {
  controller: AuthController;
  staffReviewsEnabled: boolean;
  reopeningEnabled: boolean;
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
            showReopeningStaff={reopeningEnabled && !!state.reopenSignal}
          />
        }
      />
      <Route
        path="characters/new"
        element={<CreateCharacter session={session} />}
      />
      <Route
        path="characters/:characterId"
        element={
          <CharacterSheetRoute
            session={session}
            reopeningEnabled={reopeningEnabled}
          />
        }
      />
      <Route
        path="characters/:characterId/edit"
        element={<CharacterSheetRoute session={session} editing />}
      />
      <Route path="archives" element={<OwnerArchives session={session} />} />
      {reopeningEnabled && (
        <Route
          path="reopening/*"
          element={<StaffReopeningRoutes controller={controller} />}
        />
      )}
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
