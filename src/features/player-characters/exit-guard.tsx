import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function useExitGuard(protect: boolean, signal: AbortSignal) {
  const bypass = useRef(false);
  const blocker = useBlocker(
    () => protect && !bypass.current && !signal.aborted,
  );

  useEffect(() => {
    if (!protect) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!bypass.current && !signal.aborted) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [protect, signal]);

  return {
    blocker,
    allowExit: () => {
      bypass.current = true;
    },
  };
}

export function ExitDialog({
  blocker,
  working = false,
}: {
  blocker: ReturnType<typeof useBlocker>;
  working?: boolean;
}) {
  return (
    <Dialog
      open={blocker.state === 'blocked'}
      onOpenChange={(open) => {
        if (!open && blocker.state === 'blocked') blocker.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quitter cette page ?</DialogTitle>
          <DialogDescription>
            {working
              ? 'Une demande est en cours. Vérifiez le résultat dans votre espace avant de la renvoyer.'
              : 'Les modifications non enregistrées seront perdues.'}
          </DialogDescription>
        </DialogHeader>
        <div className="player-actions">
          <Button
            type="button"
            variant="outline"
            onClick={() => blocker.reset?.()}
          >
            Rester sur la page
          </Button>
          <Button type="button" onClick={() => blocker.proceed?.()}>
            Quitter la page
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
