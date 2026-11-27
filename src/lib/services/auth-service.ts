export type AuthSession = { userId: string; accessToken: string };
export type SessionEvent =
  'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

export interface AuthService {
  signIn(redirectTo: string): Promise<void>;
  exchange(code: string): Promise<AuthSession>;
  getSession(): Promise<AuthSession | null>;
  subscribe(
    callback: (event: SessionEvent, session: AuthSession | null) => void,
  ): void;
  signOut(): Promise<void>;
}

export class SessionError extends Error {
  constructor(readonly kind: 'unavailable' | 'invalid') {
    super(
      kind === 'unavailable'
        ? 'Authentication service unavailable.'
        : 'Invalid authentication session.',
    );
    this.name = 'SessionError';
  }
}
