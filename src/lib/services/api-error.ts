export const apiErrorCodes = [
  'PLAYER_LINK_REQUIRED',
  'INVALID_CHARACTER_REQUEST',
  'UNAUTHENTICATED',
  'CHARACTER_NOT_FOUND',
  'CHARACTER_CAPACITY_REACHED',
  'CHARACTER_LOCKED',
  'CHARACTER_REVISION_CONFLICT',
  'CHARACTER_REQUEST_TOO_LARGE',
  'INVALID_CHARACTER_PROGRAM',
  'CHARACTER_INCOMPLETE',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
  'CHARACTER_REVIEW_FORBIDDEN',
  'CHARACTER_NOT_SUBMITTED',
  'CHARACTER_REVIEW_COMMENT_REQUIRED',
  'CHARACTER_HOUSE_REQUIRED',
  'INVALID_CHARACTER_HOUSE',
] as const;

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
    readonly code?: (typeof apiErrorCodes)[number],
  ) {
    super(messages[kind]);
    this.name = 'ApiError';
  }
}
