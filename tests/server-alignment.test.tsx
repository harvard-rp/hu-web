import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router';
import { describe, expect, it } from 'vitest';

import { App } from '@/app/app';
import { clubs, houses, majors } from '@/features/demo/catalogues';

function HistoryBack() {
  const navigate = useNavigate();
  return <button onClick={() => void navigate(-1)}>Retour navigateur</button>;
}

function openRoute(...routes: string[]) {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={routes}>
      <HistoryBack />
      <App />
    </MemoryRouter>,
  );
  return user;
}

function navigation() {
  return within(
    screen.getByRole('navigation', { name: 'Navigation du campus' }),
  );
}

function characterRow(name: string) {
  return within(screen.getByRole('heading', { name }).closest('li')!);
}

describe('Server-aligned catalogues', () => {
  it('contains the complete House, major and club catalogues and confirmed leadership', async () => {
    expect(houses).toHaveLength(12);
    expect(
      houses.every(
        ({ summary, traits }) => summary.length > 0 && traits.length > 0,
      ),
    ).toBe(true);
    expect(majors).toHaveLength(15);
    expect(clubs.filter((club) => !club.provisional)).toHaveLength(32);
    expect(
      clubs.filter((club) => club.provisional).map(({ name }) => name),
    ).toEqual(['Club de droit']);
    expect(
      clubs
        .filter((club) => club.leadership === 'Capitanat')
        .map(({ name }) => name)
        .sort(),
    ).toEqual([
      'Basketball',
      'Cheerleading',
      'Escrime',
      'Football américain',
      'Hockey sur glace',
      'Lacrosse',
      'Patinage artistique',
      'Équitation',
    ]);
    expect(
      clubs
        .filter((club) => club.capacity !== undefined)
        .map(({ name, capacity }) => [name, capacity]),
    ).toEqual([['BDE', 10]]);
    expect(
      clubs
        .filter((club) => club.leadership === 'À confirmer')
        .map(({ name }) => name),
    ).toEqual(['Natation', 'Club de droit']);
    expect(
      clubs.find(({ name }) => name === 'Urbex')?.description,
    ).toBeUndefined();
    // Finish the real lazy import and flush React's Suspense work before
    // asserting the catalogue. The DOM polling budget is not a module timeout.
    await act(async () => {
      await import('@/app/campus-routes');
      openRoute('/preview/clubs');
    });
    expect(
      screen.getByRole('heading', { name: 'Clubs', level: 1 }),
    ).toBeVisible();
    const main = within(screen.getByRole('main'));
    expect(main.getAllByRole('heading', { level: 3 })).toHaveLength(33);
    expect(main.getByText('33 clubs')).toBeVisible();
  });

  it('omits non-students and suspended students from reputation rankings', async () => {
    openRoute('/preview/ranking');
    const table = within(
      await screen.findByRole('table', { name: 'Classement de réputation' }),
    );
    expect(
      table.getByRole('row', { name: /Camille Delorme.*Adams/ }),
    ).toBeVisible();
    expect(table.queryByText('Sam Morel')).not.toBeInTheDocument();
    expect(table.queryByText('Maya Laurent')).not.toBeInTheDocument();
    expect(table.queryByText('Théo Marchand')).not.toBeInTheDocument();
    expect(table.queryByText('Arthur Rivière')).not.toBeInTheDocument();
  });
});

describe('Demo account and character state', () => {
  it('switches active characters and adapts navigation and direct access', async () => {
    const user = openRoute('/preview/ranking', '/preview/characters');
    await screen.findByRole('heading', { name: 'Mes personnages' });
    expect(
      navigation().getByRole('link', { name: 'Classement' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Activer Sam Morel' }));
    expect(
      screen.getByRole('button', { name: 'Sam Morel · Personnage actif' }),
    ).toBeVisible();
    expect(characterRow('Sam Morel').getByText('Actif')).toBeVisible();
    expect(
      navigation().getByRole('link', { name: 'Publications' }),
    ).toBeVisible();
    expect(
      navigation().queryByRole('link', { name: 'Classement' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retour navigateur' }));
    expect(
      await screen.findByRole('heading', { name: 'Rubrique indisponible' }),
    ).toBeVisible();
    await user.click(
      navigation().getByRole('link', { name: 'Mes personnages' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Quitter le personnage' }),
    );
    expect(
      navigation().queryByRole('link', { name: 'Publications' }),
    ).not.toBeInTheDocument();
    expect(
      navigation().getByRole('link', { name: 'Créer un personnage' }),
    ).toBeVisible();
    expect(characterRow('Alma Verdier').getByText('En attente')).toBeVisible();
  });

  it('shows active boosts and keeps all fiches and the active character when boosts are lost', async () => {
    const user = openRoute('/preview/staff');
    const boosts = await screen.findByRole('spinbutton', {
      name: 'Boosts confirmés',
    });
    expect(screen.getByText('8 / 9 emplacements utilisés')).toBeVisible();
    await user.clear(boosts);
    await user.type(boosts, '0');
    await user.click(
      screen.getByRole('button', { name: 'Enregistrer les boosts' }),
    );
    await user.click(
      navigation().getByRole('link', { name: 'Mes personnages' }),
    );
    const capacity = within(
      await screen.findByRole('region', { name: 'Emplacements' }),
    );
    expect(capacity.getByText('8 / 5 utilisés')).toBeVisible();
    expect(capacity.getByText('0 disponibles')).toBeVisible();
    expect(capacity.getByText(/3 en trop/)).toBeVisible();
    expect(
      within(
        screen.getByRole('region', { name: 'Personnages et suivi' }),
      ).getAllByRole('listitem'),
    ).toHaveLength(8);
    expect(characterRow('Camille Delorme').getByText('Actif')).toBeVisible();
    expect(
      navigation().queryByRole('link', { name: 'Créer un personnage' }),
    ).not.toBeInTheDocument();
  });

  it('shows suspended characters to staff and never offers their activation', async () => {
    const user = openRoute('/preview/characters');
    await screen.findByRole('heading', { name: 'Mes personnages' });
    expect(characterRow('Arthur Rivière').getByText('Suspendue')).toBeVisible();
    expect(
      characterRow('Arthur Rivière').queryByRole('button', { name: /Activer/ }),
    ).not.toBeInTheDocument();
    await user.click(navigation().getByRole('link', { name: 'Espace staff' }));
    await user.selectOptions(
      await screen.findByLabelText('État des fiches'),
      'suspended',
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Consulter la fiche · Arthur Rivière',
      }),
    );
    const dialog = within(
      screen.getByRole('dialog', { name: 'Arthur Rivière' }),
    );
    expect(dialog.getByText('Suspendue')).toBeVisible();
    expect(
      dialog.queryByRole('button', { name: 'Accepter' }),
    ).not.toBeInTheDocument();
  });

  it('attributes posts and reactions to the active character', async () => {
    const user = openRoute('/preview/characters');
    await user.click(
      await screen.findByRole('button', { name: 'Activer Sam Morel' }),
    );
    await user.click(navigation().getByRole('link', { name: 'Publications' }));
    const iris = within(
      await screen.findByRole('article', {
        name: 'Publication de Iris Bellamy',
      }),
    );
    await user.click(iris.getByRole('button', { name: /J’aime/ }));
    await user.type(
      screen.getByLabelText('Publication RP'),
      'La librairie ouvre à dix heures.',
    );
    await user.click(screen.getByRole('button', { name: 'Publier' }));
    expect(
      screen.getByRole('article', { name: 'Publication de Sam Morel' }),
    ).toBeVisible();
    await user.click(
      navigation().getByRole('link', { name: 'Mes personnages' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Activer Camille Delorme' }),
    );
    await user.click(navigation().getByRole('link', { name: 'Publications' }));
    const otherReaction = within(
      await screen.findByRole('article', {
        name: 'Publication de Iris Bellamy',
      }),
    ).getByRole('button', { name: /J’aime/ });
    expect(otherReaction).toHaveAttribute('aria-pressed', 'false');
    expect(otherReaction).toHaveTextContent('19');
  });
});

describe('Character creation and review', () => {
  it('offers four character types and two distinct club selections in a student fiche', async () => {
    const user = openRoute('/preview/character/new');
    const types = within(
      await screen.findByLabelText('Type de profil'),
    ).getAllByRole('option');
    expect(types.map((option) => option.textContent)).toEqual([
      'Étudiant',
      'Professeur',
      'Personnel universitaire',
      'Citoyen',
    ]);
    await user.type(
      screen.getByLabelText('Nom du personnage (obligatoire)'),
      'Arden',
    );
    await user.type(screen.getByLabelText('Prénom'), 'Béa');
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByLabelText('Personnalité')).toHaveAccessibleDescription(
      /cinq lignes/,
    );
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    const clubsField = within(
      screen.getByRole('group', { name: 'Clubs, deux au maximum' }),
    );
    expect(clubsField.getAllByRole('combobox')).toHaveLength(2);
    await user.selectOptions(clubsField.getByLabelText('Club 1'), 'BDE');
    expect(
      within(clubsField.getByLabelText('Club 2')).queryByRole('option', {
        name: 'BDE',
      }),
    ).not.toBeInTheDocument();
    await user.selectOptions(
      clubsField.getByLabelText('Club 2'),
      'Photographie',
    );
    expect(
      screen.queryByRole('option', { name: 'Club de droit' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Attribuer une House'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByLabelText('Histoire')).toHaveAccessibleDescription(
      /dix lignes/,
    );
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText('Béa Arden')).toBeVisible();
    expect(screen.getByText('BDE, Photographie')).toBeVisible();
  });

  it('requires a staff-assigned House to approve a student but not a citizen', async () => {
    const user = openRoute('/preview/staff');
    await user.click(
      await screen.findByRole('button', {
        name: 'Consulter la fiche · Alma Verdier',
      }),
    );
    let dialog = within(screen.getByRole('dialog', { name: 'Alma Verdier' }));
    expect(dialog.getByRole('button', { name: 'Accepter' })).toBeDisabled();
    await user.selectOptions(
      dialog.getByLabelText('Attribuer une House'),
      'lowell',
    );
    await user.click(dialog.getByRole('button', { name: 'Accepter' }));
    expect(
      characterRow('Alma Verdier').getByText('Étudiant · Lowell House'),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Consulter la fiche · Soren Finch' }),
    );
    dialog = within(screen.getByRole('dialog', { name: 'Soren Finch' }));
    expect(
      dialog.queryByLabelText('Attribuer une House'),
    ).not.toBeInTheDocument();
    await user.click(dialog.getByRole('button', { name: 'Accepter' }));
    expect(characterRow('Soren Finch').getByText('Acceptée')).toBeVisible();
  });

  it('resubmits a requested correction without creating another record', async () => {
    const user = openRoute('/preview/characters');
    await user.click(
      await screen.findByRole('link', {
        name: /Corriger la fiche · Lina Lenoir/,
      }),
    );
    expect(
      await screen.findByText('Préciser pourquoi Lina a changé de filière.'),
    ).toBeVisible();
    expect(
      screen.getByLabelText('Nom du personnage (obligatoire)'),
    ).toHaveValue('Lenoir');
    for (let step = 0; step < 4; step++) {
      await user.click(screen.getByRole('button', { name: 'Suivant' }));
    }
    await user.click(
      screen.getByRole('button', { name: 'Soumettre ma fiche' }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Mes personnages' }),
    ).toBeVisible();
    expect(characterRow('Lina Lenoir').getByText('En attente')).toBeVisible();
    expect(screen.getByText('8 / 9 utilisés')).toBeVisible();
  });
});
