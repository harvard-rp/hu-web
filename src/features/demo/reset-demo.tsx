import { RotateCcw } from 'lucide-react';
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
import { useDemo } from './demo-state';

export function ResetDemo() {
  const [open, setOpen] = useState(false);
  const { reset } = useDemo();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="api-trigger">
          <RotateCcw aria-hidden="true" /> Réinitialiser la démo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser la démonstration ?</DialogTitle>
          <DialogDescription>
            Les fiches, publications, réactions et inscriptions simulées de
            cette session seront supprimées.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => {
              reset();
              setOpen(false);
              toast.success('Démonstration réinitialisée');
            }}
          >
            Réinitialiser
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
