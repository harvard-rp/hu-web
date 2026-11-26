import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { findHouse, houses, type HouseId } from '@/features/demo/catalogues';
import {
  characterTypes,
  draftName,
  reviewStatusLabels,
  type Review,
  type ReviewDecision,
} from '@/features/demo/characters';
import { useDemo, validBoostCount } from '@/features/demo/demo-state';
import { DemoHeading, NoResults } from '@/features/demo/demo-ui';
import { DraftSummary } from './character-wizard-page';

function ReviewDialog({ record }: { record: Review }) {
  const [open, setOpen] = useState(false);
  const [house, setHouse] = useState<HouseId | ''>(record.house ?? '');
  const [note, setNote] = useState(record.note ?? '');
  const { assignHouse, review } = useDemo();
  const name = draftName(record.draft);
  const needsHouse = record.draft.profile === 'student' && !house;

  function handleOpen(next: boolean) {
    if (next) {
      setHouse(record.house ?? '');
      setNote(record.note ?? '');
    }
    setOpen(next);
  }

  function decide(status: ReviewDecision) {
    review(
      record.id,
      status,
      status === 'accepted' ? house || undefined : record.house,
      note.trim() || undefined,
    );
    setOpen(false);
    toast.success(reviewStatusLabels[status]);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" aria-label={`Consulter la fiche · ${name}`}>
          Consulter
        </Button>
      </DialogTrigger>
      <DialogContent className="demo-review-dialog">
        <DialogHeader>
          <DialogTitle>{name}</DialogTitle>
          <DialogDescription>
            Les décisions restent dans cette session.
          </DialogDescription>
        </DialogHeader>
        <DraftSummary draft={record.draft} />
        {record.status === 'pending' ? (
          <div className="demo-form-grid">
            {record.draft.profile === 'student' && (
              <div className="demo-field">
                <Label htmlFor="staff-house">Attribuer une House</Label>
                <select
                  id="staff-house"
                  value={house}
                  onChange={(event) =>
                    setHouse(findHouse(event.target.value)?.id ?? '')
                  }
                >
                  <option value="">Sans attribution</option>
                  {houses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} House
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (house) {
                      assignHouse(record.id, house);
                      toast.success('House attribuée');
                    }
                  }}
                  disabled={!house}
                >
                  Enregistrer la House
                </Button>
              </div>
            )}
            <div className="demo-field">
              <Label htmlFor="staff-note">
                Note de correction ou de décision
              </Label>
              <textarea
                id="staff-note"
                rows={3}
                value={note}
                maxLength={600}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            {needsHouse && (
              <p className="demo-aside">
                Attribuez une House pour valider la fiche étudiante.
              </p>
            )}
            <div className="staff-actions">
              <Button
                type="button"
                variant="outline"
                onClick={() => decide('changes')}
              >
                Demander une correction
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => decide('rejected')}
              >
                Refuser
              </Button>
              <Button
                type="button"
                onClick={() => decide('accepted')}
                disabled={needsHouse}
              >
                Accepter
              </Button>
            </div>
          </div>
        ) : (
          <div className="demo-field">
            <strong>{reviewStatusLabels[record.status]}</strong>
            {record.house && (
              <p>House attribuée : {findHouse(record.house)?.name}</p>
            )}
            {record.note && <p>{record.note}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BoostControls() {
  const { boosts, setBoosts, capacity } = useDemo();
  const [input, setInput] = useState(String(boosts));
  const value = Number(input);
  const valid = input.trim() !== '' && validBoostCount(value);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid) return;
    setBoosts(value);
    toast.success('Boosts confirmés mis à jour');
  }

  return (
    <section className="demo-panel" aria-labelledby="staff-boosts">
      <header className="demo-panel-header">
        <h2 id="staff-boosts">Boosts du compte fictif</h2>
      </header>
      <div className="demo-panel-copy boost-controls">
        <form onSubmit={save}>
          <div className="demo-field">
            <Label htmlFor="confirmed-boosts">Boosts confirmés</Label>
            <Input
              type="number"
              id="confirmed-boosts"
              min={0}
              step={1}
              required
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={!valid || value === boosts}
          >
            Enregistrer les boosts
          </Button>
        </form>
        <p className="demo-aside" role="status">
          {capacity.used} / {capacity.total} emplacements utilisés
          {capacity.over > 0 &&
            ` · ${capacity.over} en trop, fiches conservées`}
        </p>
      </div>
    </section>
  );
}

export function StaffPage() {
  const { reviews } = useDemo();
  const [status, setStatus] = useState('');
  const visible = reviews
    .filter((record) => !status || record.status === status)
    .sort(
      (a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'),
    );
  return (
    <div className="demo-page staff-page">
      <DemoHeading
        title="Espace staff"
        description="Simulation HRP. Les décisions restent dans cette session."
      />
      <BoostControls />
      <div className="demo-filters">
        <div>
          <Label htmlFor="staff-status">État des fiches</Label>
          <select
            id="staff-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tous les états</option>
            {Object.entries(reviewStatusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {visible.length ? (
        <section className="demo-panel" aria-labelledby="staff-queue">
          <header className="demo-panel-header">
            <h2 id="staff-queue">File de validation</h2>
            <span className="demo-aside" role="status">
              {visible.length} {visible.length === 1 ? 'fiche' : 'fiches'}
            </span>
          </header>
          <div className="staff-columns" aria-hidden="true">
            <span>Personnage</span>
            <span>Statut</span>
            <span>Fiche</span>
          </div>
          <ul className="staff-list">
            {visible.map((record) => (
              <li key={record.id}>
                <div>
                  <h3>{draftName(record.draft)}</h3>
                  <p>
                    {characterTypes[record.draft.profile]}
                    {record.house
                      ? ` · ${findHouse(record.house)?.name} House`
                      : ''}
                  </p>
                </div>
                <span className="staff-status" data-status={record.status}>
                  {reviewStatusLabels[record.status]}
                </span>
                <ReviewDialog record={record} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <NoResults description="Aucune fiche dans cet état." />
      )}
    </div>
  );
}
