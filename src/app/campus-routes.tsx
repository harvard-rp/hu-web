import { Route, Routes } from 'react-router';

import { CampusLayout } from '@/components/layout/campus-layout';
import {
  ClubsPage,
  HouseDetailPage,
  HousesPage,
  MajorsPage,
} from '@/routes/catalog-pages';
import { CharacterWizardPage } from '@/routes/character-wizard-page';
import { AgendaPage, SocialPage } from '@/routes/community-pages';
import { NotFoundPage } from '@/routes/not-found-page';
import {
  CharacterPage,
  DirectoryPage,
  RankingPage,
  RelationsPage,
} from '@/routes/people-pages';
import { PreviewPage } from '@/routes/preview-page';
import { StaffPage } from '@/routes/staff-page';

export default function CampusRoutes() {
  return (
    <Routes>
      <Route element={<CampusLayout />}>
        <Route index element={<PreviewPage />} />
        <Route path="houses" element={<HousesPage />} />
        <Route path="houses/:houseId" element={<HouseDetailPage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="majors" element={<MajorsPage />} />
        <Route path="character" element={<CharacterPage own />} />
        <Route path="character/new" element={<CharacterWizardPage />} />
        <Route path="people/:characterId" element={<CharacterPage />} />
        <Route path="directory" element={<DirectoryPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="social" element={<SocialPage />} />
        <Route path="relations" element={<RelationsPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
