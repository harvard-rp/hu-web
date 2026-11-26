import { Activity, CircleAlert, CircleCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, createApiClient } from '@/lib/services/api-client';
import { apiConfig, type ApiConfig } from '@/lib/services/api-config';

type Status =
  | { kind: 'idle' | 'loading' }
  | { kind: 'healthy' }
  | { kind: 'error'; error: ApiError };

export function ApiStatus({ config = apiConfig }: { config?: ApiConfig }) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const active = useRef<AbortController | null>(null);

  useEffect(() => () => active.current?.abort(), []);

  function onOpenChange(open: boolean) {
    if (!open) {
      active.current?.abort();
      active.current = null;
      setStatus({ kind: 'idle' });
    }
  }

  async function check() {
    if (active.current || config.kind !== 'ready') return;

    const controller = new AbortController();
    active.current = controller;
    setStatus({ kind: 'loading' });

    try {
      await createApiClient(config).health(controller.signal);
      if (controller.signal.aborted) return;
      setStatus({ kind: 'healthy' });
      toast.success('API connection verified');
    } catch (error) {
      if (controller.signal.aborted) return;
      setStatus({
        kind: 'error',
        error: error instanceof ApiError ? error : new ApiError('network'),
      });
    } finally {
      if (active.current === controller) active.current = null;
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="api-trigger">
          <Activity aria-hidden="true" /> API status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API connection</DialogTitle>
          <DialogDescription>
            Check whether the preview can reach hu-api.
          </DialogDescription>
        </DialogHeader>
        {config.kind === 'disabled' && (
          <p className="text-sm text-muted-foreground">
            The preview is running in standalone mode. An API connection is
            optional.
          </p>
        )}
        {config.kind === 'invalid' && (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>Invalid API configuration</AlertTitle>
            <AlertDescription>
              Review the configured API URL and timeout.
            </AlertDescription>
          </Alert>
        )}
        {config.kind === 'ready' && (
          <div className="grid gap-4">
            {status.kind === 'loading' && (
              <div role="status" className="grid gap-2">
                <span className="sr-only">Checking API connection</span>
                <Skeleton className="h-4 w-3/4" aria-hidden="true" />
                <Skeleton className="h-4 w-1/2" aria-hidden="true" />
              </div>
            )}
            {status.kind === 'healthy' && (
              <p
                className="flex items-center gap-2 text-sm text-success"
                role="status"
              >
                <CircleCheck aria-hidden="true" className="size-4" /> hu-api is
                responding.
              </p>
            )}
            {status.kind === 'error' && (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Connection check failed</AlertTitle>
                <AlertDescription>
                  <p>{status.error.message}</p>
                  {status.error.requestId && (
                    <p>
                      Request ID{' '}
                      <code className="break-all">
                        {status.error.requestId}
                      </code>
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="button"
              onClick={() => void check()}
              disabled={status.kind === 'loading'}
              className="justify-self-start"
            >
              Check connection
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
