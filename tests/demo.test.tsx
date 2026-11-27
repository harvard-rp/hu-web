import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { App } from '@/app/app';

async function openRoute(path: string) {
  const user = userEvent.setup();
  await act(async () => {
    await import('@/app/campus-routes');
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  });
  return user;
}

describe('Campus catalogues', () => {
  it('shows the twelve Houses and follows a detail and fictional character link', async () => {
    const user = await openRoute('/preview/houses');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Houses' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('heading', { level: 3, name: /House$/ }),
    ).toHaveLength(12);
    await user.click(screen.getByRole('link', { name: /Adams House/ }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Adams House' }),
    ).toBeVisible();
    expect(
      screen.getByRole('navigation', { name: 'Fil d’Ariane' }),
    ).toHaveTextContent('Houses');
    expect(screen.getByText('Ouverture d’esprit')).toBeVisible();
    const members = screen.getByRole('region', { name: 'Membres' });
    await user.click(
      within(members).getByRole('link', { name: /Camille Delorme/ }),
    );
    expect(
      await screen.findByRole('heading', { name: 'Camille Delorme' }),
    ).toBeVisible();
  });

  it('filters clubs by category and query, with one swimming entry and the BDE cap', async () => {
    const user = await openRoute('/preview/clubs');
    await screen.findByRole('heading', { name: 'Clubs' });
    const search = screen.getByRole('searchbox', {
      name: 'Rechercher un club',
    });
    await user.type(search, 'natation');
    expect(screen.getAllByRole('heading', { name: 'Natation' })).toHaveLength(
      1,
    );
    expect(screen.getByText(/Type de responsable à confirmer/)).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Catégorie'), 'Académique');
    expect(screen.getByText('Aucun résultat')).toBeVisible();
    await user.clear(search);
    expect(
      screen.getByRole('heading', { name: 'Club de droit' }),
    ).toBeVisible();
    expect(screen.getByText('À confirmer', { selector: 'span' })).toBeVisible();
    await user.selectOptions(
      screen.getByLabelText('Catégorie'),
      'Organisation',
    );
    expect(screen.getByRole('heading', { name: 'BDE' })).toBeVisible();
    expect(screen.getByText('8 / 10')).toBeVisible();
    expect(screen.getByText('Présidence')).toBeVisible();
    await user.selectOptions(screen.getByLabelText('Catégorie'), 'Loisirs');
    expect(screen.getByRole('heading', { name: 'Jeux vidéo' })).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'BDE' }),
    ).not.toBeInTheDocument();
  });

  it('lists the fifteen initial majors and lets the user propose one in a student dossier', async () => {
    const user = await openRoute('/preview/majors');
    await screen.findByRole('heading', { name: 'Filières' });
    expect(
      within(screen.getByRole('main')).getAllByRole('listitem'),
    ).toHaveLength(15);
    await user.click(
      screen.getByRole('link', { name: 'Proposer une filière' }),
    );
    await screen.findByRole('heading', { name: 'Créer un personnage' });
    await user.type(
      screen.getByLabelText('Nom du personnage (obligatoire)'),
      'Juniper Demo',
    );
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByLabelText('Filière')).toHaveValue('other');
    expect(
      screen.getByLabelText('Filière proposée (obligatoire)'),
    ).toBeVisible();
  });

  it('filters the directory by House and orders sample rankings by their stored points', async () => {
    const user = await openRoute('/preview/directory');
    await screen.findByRole('heading', { name: 'Membres' });
    await user.selectOptions(screen.getByLabelText('House'), 'adams');
    expect(screen.getByText('2 personnages')).toBeVisible();
    expect(screen.queryByText('Ambrose Vale')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Classement' }));
    const table = await screen.findByRole('table', {
      name: 'Classement de réputation',
    });
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
      'Ambrose Vale',
    );
    await user.type(
      screen.getByRole('searchbox', { name: 'Rechercher par nom ou House' }),
      'adams',
    );
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    const activeRow = within(table).getByRole('row', {
      name: /Camille Delorme/,
    });
    expect(within(activeRow).getByRole('cell', { name: '4' })).toBeVisible();
    expect(within(activeRow).getByText('Vous')).toBeVisible();
    expect(within(table).queryByText('Ambrose Vale')).not.toBeInTheDocument();
  });
});

describe('Fictional interactions', () => {
  it('submits an original dossier, assigns a House as staff, then resets the changes', async () => {
    const user = await openRoute('/preview/character/new');
    const name = await screen.findByLabelText(
      'Nom du personnage (obligatoire)',
    );
    await user.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Saisissez un nom');
    await user.type(name, 'Épure Fictive');
    for (let step = 0; step < 4; step++) {
      await user.click(screen.getByRole('button', { name: 'Suivant' }));
      expect(
        screen.queryByLabelText('Attribuer une House'),
      ).not.toBeInTheDocument();
    }

    expect(screen.getByText('Épure Fictive')).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Soumettre ma fiche' }),
    );
    await user.click(
      screen.getByRole('link', { name: 'Voir la file de validation' }),
    );
    await user.click(
      await screen.findByRole('button', {
        name: 'Consulter la fiche · Épure Fictive',
      }),
    );
    const review = screen.getByRole('dialog', { name: 'Épure Fictive' });
    await user.selectOptions(
      within(review).getByLabelText('Attribuer une House'),
      'cabot',
    );
    await user.click(
      within(review).getByRole('button', { name: 'Enregistrer la House' }),
    );
    await user.click(within(review).getByRole('button', { name: 'Accepter' }));
    const accepted = screen
      .getByRole('heading', { name: 'Épure Fictive' })
      .closest('li')!;
    expect(within(accepted).getByText('Acceptée')).toBeVisible();
    expect(within(accepted).getByText('Étudiant · Cabot House')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Réinitialiser la démo' }),
    );
    const reset = screen.getByRole('dialog', {
      name: 'Réinitialiser la démonstration ?',
    });
    await user.click(
      within(reset).getByRole('button', { name: 'Réinitialiser' }),
    );
    expect(screen.queryByText('Épure Fictive')).not.toBeInTheDocument();
    expect(screen.getByText('Alma Verdier')).toBeVisible();
  });

  it('requests a correction and rejects a non-student dossier without exposing House selection', async () => {
    const user = await openRoute('/preview/staff');
    await user.click(
      await screen.findByRole('button', {
        name: 'Consulter la fiche · Alma Verdier',
      }),
    );
    await user.type(
      screen.getByLabelText('Note de correction ou de décision'),
      'Préciser son parcours fictif.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Demander une correction' }),
    );
    const corrected = screen
      .getByRole('heading', { name: 'Alma Verdier' })
      .closest('li')!;
    expect(within(corrected).getByText('Correction demandée')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Consulter la fiche · Soren Finch' }),
    );
    expect(
      screen.queryByLabelText('Attribuer une House'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(screen.getByText('Refusée', { selector: 'span' })).toBeVisible();
  });

  it('publishes, reacts and comments locally without making requests', async () => {
    const transport = vi.fn();
    vi.stubGlobal('fetch', transport);
    const user = await openRoute('/preview/social');
    await user.type(
      await screen.findByLabelText('Publication RP'),
      'Un chapitre fictif au Quad.',
    );
    await user.click(screen.getByRole('button', { name: 'Publier' }));
    const article = screen.getByRole('article', {
      name: 'Publication de Camille Delorme',
    });
    expect(
      within(article).getByText('Un chapitre fictif au Quad.'),
    ).toBeVisible();
    await user.click(within(article).getByRole('button', { name: /J’aime/ }));
    expect(
      within(article).getByRole('button', { name: /J’aime/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    await user.click(
      within(article).getByRole('button', { name: /Commentaires/ }),
    );
    await user.type(
      within(article).getByLabelText('Commentaire RP'),
      'Je garde mon carnet.',
    );
    await user.click(within(article).getByRole('button', { name: 'Envoyer' }));
    expect(within(article).getByText('Je garde mon carnet.')).toBeVisible();
    expect(transport).not.toHaveBeenCalled();
  });

  it('filters the agenda to local registrations', async () => {
    const user = await openRoute('/preview/agenda');
    await user.click(
      await screen.findByRole('button', {
        name: 'S’inscrire · Veillée de lecture',
      }),
    );
    expect(
      screen.getByRole('button', {
        name: 'Inscrit · Veillée de lecture',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
    await user.click(
      screen.getByRole('checkbox', { name: 'Mes inscriptions' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Veillée de lecture' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Promenade argentique' }),
    ).not.toBeInTheDocument();
  });
});
