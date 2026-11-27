import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/services/api-error';
import type { CharacterSummary } from '@/lib/services/character-contract';

export const kindLabel = {
  student: 'Étudiant',
  teacher: 'Professeur',
  staff_member: 'Personnel de l’université',
  citizen: 'Citoyen',
} satisfies Record<CharacterSummary['kind'], string>;

export const validationLabel = {
  draft: 'Brouillon',
  submitted: 'En attente de validation',
  changes_requested: 'Corrections demandées',
  approved: 'Validé',
  rejected: 'Refusé',
} satisfies Record<CharacterSummary['validationStatus'], string>;

export const useLabel = {
  active: 'Actif',
  suspended: 'Suspendu',
} satisfies Record<CharacterSummary['useStatus'], string>;

export function canEdit(character: CharacterSummary) {
  return !character.archivedAt && character.actions.canEdit;
}

export function characterName(character: CharacterSummary) {
  return (
    [character.firstName, character.lastName].filter(Boolean).join(' ') ||
    character.nickname ||
    'Personnage sans nom'
  );
}

export const charactersDate = new Intl.DateTimeFormat('fr', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const errorMessages: Partial<Record<NonNullable<ApiError['code']>, string>> = {
  INVALID_CHARACTER_REQUEST:
    'La fiche contient une valeur invalide. Vérifiez les champs indiqués.',
  UNAUTHENTICATED: 'Votre session a expiré. Reconnectez-vous.',
  PLAYER_LINK_REQUIRED:
    'Votre compte Discord doit être lié à un compte joueur.',
  CHARACTER_NOT_FOUND: 'Personnage introuvable.',
  CHARACTER_CAPACITY_REACHED: 'Tous vos emplacements sont occupés.',
  CHARACTER_LOCKED: 'Cette fiche est verrouillée. Consultez son état actuel.',
  CHARACTER_REVISION_CONFLICT:
    'Cette fiche a changé depuis son ouverture. Vos modifications locales sont conservées.',
  CHARACTER_REOPENING_CONFLICT:
    'Une demande est déjà en attente ou a été traitée. Consultez l’état actuel.',
  INVALID_EXTERNAL_ATTESTATION:
    'La consultation manuelle de la fiche externe doit être attestée.',
  CHARACTER_INCOMPLETE:
    'Complétez les champs requis avant de soumettre la fiche.',
  INVALID_CHARACTER_PROGRAM:
    'Sélectionnez une filière active et adaptée au type du personnage.',
  CHARACTER_REQUEST_TOO_LARGE:
    'La fiche dépasse la taille maximale de 96 Kio. Raccourcissez les textes.',
};

export function isUncertain(error: unknown) {
  return (
    !(error instanceof ApiError) ||
    error.status === undefined ||
    error.status >= 500 ||
    error.kind === 'response'
  );
}

export function CharacterError({
  error,
  retry,
  message,
}: {
  error: unknown;
  retry?: () => void;
  message?: string;
}) {
  const failure = error instanceof ApiError ? error : undefined;
  const detail = failure?.code && errorMessages[failure.code];
  const fallback =
    failure?.status === 401
      ? 'Votre session a expiré. Reconnectez-vous.'
      : failure?.status === 404
        ? 'Personnage introuvable.'
        : 'L’espace personnages est momentanément indisponible.';
  const requestId = failure?.requestId;
  return (
    <div className="player-notice">
      <div role="alert">
        <p>{message ?? detail ?? fallback}</p>
        {requestId && (
          <p className="player-muted player-request-id">
            Référence de la demande <code>{requestId}</code>
          </p>
        )}
      </div>
      {retry && (
        <Button type="button" variant="outline" onClick={retry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function Screen({
  title,
  back,
  children,
}: {
  title: string;
  back?: { to: string; label: string };
  children?: ReactNode;
}) {
  return (
    <div className="player-workspace content-shell">
      {back && (
        <Link className="text-link" to={back.to}>
          {back.label}
        </Link>
      )}
      <header className="player-heading">
        <h1>{title}</h1>
      </header>
      {children}
    </div>
  );
}

export function CharacterState({ character }: { character: CharacterSummary }) {
  return (
    <div className="player-statuses">
      {character.refusalCount > 0 && (
        <span className="player-status">{character.refusalCount} refus</span>
      )}
      <span className="player-status">
        {character.archivedAt
          ? 'Archivé'
          : validationLabel[character.validationStatus]}
      </span>
      <span
        className="player-status"
        data-suspended={character.useStatus === 'suspended' || undefined}
      >
        {useLabel[character.useStatus]}
      </span>
    </div>
  );
}
