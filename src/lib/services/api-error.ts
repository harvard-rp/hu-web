const messages = {
  unavailable: 'The API connection is unavailable.',
  timeout: 'The API took too long to respond.',
  aborted: 'The API request was cancelled.',
  network: 'The API could not be reached.',
  http: 'The API returned an error.',
  response: 'The API returned an unexpected response.',
};

export class ApiError extends Error {
  constructor(
    readonly kind: keyof typeof messages,
    readonly status?: number,
    readonly requestId?: string,
    readonly code?: 'PLAYER_LINK_REQUIRED',
  ) {
    super(messages[kind]);
    this.name = 'ApiError';
  }
}
