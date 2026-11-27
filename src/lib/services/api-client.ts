import { z } from 'zod';

import { ApiError, apiErrorCodes } from './api-error';
import {
  characterId,
  characterList,
  characterCapacity,
  characterDetail,
  characterReviews,
  characterCatalog,
  clubCatalog,
  type CharacterKind,
  type EditableFields,
} from './character-contract';
import type { ApiConfig } from './api-config';
import {
  reviewInput,
  reviewResult,
  staffQueue,
  type ReviewInput,
} from './staff-review-contract';
import { playerContextSchema } from './player-context';
import { readPublicUrl } from './public-url';

export { ApiError } from './api-error';

const healthSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('hu-api'),
});

const apiFailure = z.object({
  error: z.object({
    code: z.enum(apiErrorCodes),
    requestId: z.uuid().optional(),
  }),
});

const charactersPath = 'api/v1/characters';
const staffPath = 'api/v1/staff/characters';
function characterPath(id: string, path = charactersPath) {
  if (!characterId.safeParse(id).success)
    throw new ApiError('http', 404, undefined, 'CHARACTER_NOT_FOUND');
  return `${path}/${id}`;
}

export function createApiClient(
  config: ApiConfig,
  transport: typeof fetch = fetch,
) {
  async function request<Output>(
    path: string,
    schema: z.ZodType<Output>,
    externalSignal?: AbortSignal,
    token?: string,
    method = 'GET',
    body?: object,
    expectedStatus?: number,
  ) {
    if (config.kind !== 'ready') throw new ApiError('unavailable');
    const base = readPublicUrl(config.baseUrl);
    if (!base || (path !== 'health' && !token))
      throw new ApiError('unavailable');
    const url = new URL(path, base);
    if (url.origin !== base.origin) throw new ApiError('unavailable');

    const deadline = new AbortController();
    const timer = setTimeout(() => deadline.abort(), config.timeoutMs);
    const signal = externalSignal
      ? AbortSignal.any([externalSignal, deadline.signal])
      : deadline.signal;

    let requestId: string | undefined;
    try {
      signal.throwIfAborted();
      const response = await transport(url, {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          Accept: 'application/json',
          ...(body && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'omit',
        ...(token && { cache: 'no-store', referrerPolicy: 'no-referrer' }),
        redirect: 'error',
        signal,
      });
      requestId = response.headers.get('X-Request-Id') || undefined;
      if (!response.ok) {
        const failure =
          token &&
          apiFailure.safeParse(await response.json().catch(() => undefined));
        if (failure && failure.success) {
          requestId ??= failure.data.error.requestId;
          throw new ApiError(
            'http',
            response.status,
            requestId,
            failure.data.error.code,
          );
        }
        throw new ApiError('http', response.status, requestId);
      }

      if (expectedStatus !== undefined && response.status !== expectedStatus)
        throw new ApiError('response', response.status, requestId);

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        signal.throwIfAborted();
        throw new ApiError('response', response.status, requestId);
      }
      const result = schema.safeParse(payload);
      if (!result.success)
        throw new ApiError('response', response.status, requestId);
      return { data: result.data, requestId };
    } catch (error) {
      if (deadline.signal.aborted)
        throw new ApiError('timeout', undefined, requestId);
      if (externalSignal?.aborted)
        throw new ApiError('aborted', undefined, requestId);
      if (error instanceof ApiError) throw error;
      throw new ApiError('network', undefined, requestId);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    health: (signal?: AbortSignal) => request('health', healthSchema, signal),
    me: (token: string, signal?: AbortSignal) =>
      request('api/v1/me', playerContextSchema, signal, token),
    bootstrap: (token: string, signal?: AbortSignal) =>
      request(
        'api/v1/auth/bootstrap',
        playerContextSchema,
        signal,
        token,
        'POST',
      ),
    staff: {
      queue: async (token: string, signal: AbortSignal, after?: string) => {
        if (after !== undefined && !characterId.safeParse(after).success)
          throw new ApiError(
            'http',
            400,
            undefined,
            'INVALID_CHARACTER_REQUEST',
          );
        return request(
          after ? `${staffPath}?after=${after}` : staffPath,
          staffQueue,
          signal,
          token,
        );
      },
      detail: async (token: string, signal: AbortSignal, id: string) => {
        const result = await request(
          characterPath(id, staffPath),
          characterDetail,
          signal,
          token,
        );
        if (
          result.data.id !== id.toLowerCase() ||
          result.data.validationStatus !== 'submitted'
        )
          throw new ApiError('response', 200, result.requestId);
        return result;
      },
      reviews: async (token: string, signal: AbortSignal, id: string) =>
        request(
          characterPath(id, staffPath) + '/reviews',
          characterReviews,
          signal,
          token,
        ),
      decide: async (
        token: string,
        signal: AbortSignal,
        id: string,
        input: ReviewInput,
      ) => {
        const body = reviewInput.safeParse(input);
        if (!body.success)
          throw new ApiError(
            'http',
            400,
            undefined,
            'INVALID_CHARACTER_REQUEST',
          );
        const result = await request(
          characterPath(id, staffPath) + '/reviews',
          reviewResult,
          signal,
          token,
          'POST',
          body.data,
          201,
        );
        if (
          result.data.characterId !== id.toLowerCase() ||
          result.data.revision === body.data.expectedRevision.toLowerCase() ||
          result.data.review.decision !== body.data.decision ||
          result.data.review.comment !== (body.data.comment ?? null) ||
          result.data.review.assignedHouseId !==
            (body.data.houseId?.toLowerCase() ?? null) ||
          (body.data.houseId &&
            result.data.houseId !== body.data.houseId.toLowerCase())
        )
          throw new ApiError('response', 201, result.requestId);
        return result;
      },
    },
    characters: {
      list: (token: string, signal: AbortSignal) =>
        request(charactersPath, characterList, signal, token),
      capacity: (token: string, signal: AbortSignal) =>
        request(charactersPath + '/capacity', characterCapacity, signal, token),
      detail: async (token: string, signal: AbortSignal, id: string) =>
        request(characterPath(id), characterDetail, signal, token),
      create: (token: string, signal: AbortSignal, kind: CharacterKind) =>
        request(charactersPath, characterDetail, signal, token, 'POST', {
          kind,
        }),
      edit: async (
        token: string,
        signal: AbortSignal,
        id: string,
        expectedRevision: string,
        fields: EditableFields,
      ) =>
        request(characterPath(id), characterDetail, signal, token, 'PATCH', {
          ...fields,
          expectedRevision,
        }),
      submit: async (
        token: string,
        signal: AbortSignal,
        id: string,
        expectedRevision: string,
      ) =>
        request(
          characterPath(id) + '/submit',
          characterDetail,
          signal,
          token,
          'POST',
          { expectedRevision },
        ),
      reviews: async (token: string, signal: AbortSignal, id: string) =>
        request(
          characterPath(id) + '/reviews',
          characterReviews,
          signal,
          token,
        ),
      houses: (token: string, signal: AbortSignal) =>
        request('api/v1/catalogs/houses', characterCatalog, signal, token),
      programs: (token: string, signal: AbortSignal) =>
        request('api/v1/catalogs/programs', characterCatalog, signal, token),
      clubs: (token: string, signal: AbortSignal) =>
        request('api/v1/catalogs/clubs', clubCatalog, signal, token),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
