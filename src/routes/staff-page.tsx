import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  findHouse,
  houses,
  type HouseId,
  type Review,
  type ReviewStatus,
} from '@/features/demo/data';
import { useDemo } from '@/features/demo/demo-state';
import { DemoHeading, NoResults } from '@/features/demo/demo-ui';
import { DraftSummary } from './character-wizard-page';

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'En attente',
  changes: 'Correction demandée',
  accepted: 'Acceptée',
  rejected: 'Refusée',
};

function ReviewDialog({ record }: { record: Review }) {
  const [open, setOpen] = useState(false);
  const [house, setHouse] = useState<HouseId | ''>(record.house ?? '');
  const [note, setNote] = useState(record.note ?? '');
  const { assignHouse, review } = useDemo();

  function handleOpen(next: boolean) {
    if (next) {
      setHouse(record.house ?? '');
      setNote(record.note ?? '');
    }
    setOpen(next);
  }

  function decide(status: Exclude<ReviewStatus, 'pending'>) {
    review(
      record.id,
      status,
      status === 'accepted' ? house || undefined : record.house,
      note.trim() || undefined,
    );
    setOpen(false);
    toast.success(statusLabels[status]);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Consulter la fiche · ${record.draft.name}`}
        >
          Consulter
        </Button>
      </DialogTrigger>
      <DialogContent className="demo-review-dialog">
        <DialogHeader>
          <DialogTitle>{record.draft.name}</DialogTitle>
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
              <Button type="button" onClick={() => decide('accepted')}>
                Accepter
              </Button>
            </div>
          </div>
        ) : (
          <div className="demo-field">
            <strong>{statusLabels[record.status]}</strong>
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

export function StaffPage() {
  const { reviews } = useDemo();
  const [status, setStatus] = useState('');
  const visible = reviews.filter(
    (record) => !status || record.status === status,
  );
  return (
    <div className="demo-page staff-page">
      <DemoHeading
        title="Espace staff"
        description="Les décisions sont simulées et n’affectent aucun utilisateur réel."
      />
      <div className="demo-filters">
        <div>
          <Label htmlFor="staff-status">État des fiches</Label>
          <select
            id="staff-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Tous les états</option>
            {Object.entries(statusLabels).map(([key, label]) => (
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
                  <h3>{record.draft.name}</h3>
                  <p>
                    {record.draft.profile === 'student'
                      ? 'Étudiant'
                      : 'Non étudiant'}
                    {record.house
                      ? ` · ${findHouse(record.house)?.name} House`
                      : ''}
                  </p>
                </div>
                <span className="staff-status" data-status={record.status}>
                  {statusLabels[record.status]}
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
