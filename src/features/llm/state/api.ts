import { baseApi } from '@/app/api/baseApi';
import { TauriCommands } from '@/bindings/commands';
import { logger } from '@/lib/logger';
import type { LLMConnection, LLMModel } from '../types';

// Types matching Rust structs
interface DbLLMConnection {
  id: string;
  name: string;
  base_url: string;
  provider: string;
  api_key: string;
  models_json: string | null;
  default_model: string | null;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

export function dbToFrontendLLMConnection(
  dbConn: DbLLMConnection
): LLMConnection {
  let models: LLMModel[] | undefined;
  if (dbConn.models_json) {
    try {
      models = JSON.parse(dbConn.models_json);
    } catch (e) {
      logger.error('Error parsing models_json in LLM connection API:', e);
      models = undefined;
    }
  }

  // Validate provider type
  const provider =
    dbConn.provider === 'openai' ||
    dbConn.provider === 'ollama' ||
    dbConn.provider === 'vllm' ||
    dbConn.provider === 'litellm' ||
    dbConn.provider === 'fireworks' ||
    dbConn.provider === 'openrouter' ||
    dbConn.provider === 'groq' ||
    dbConn.provider === 'together' ||
    dbConn.provider === 'deepinfra' ||
    dbConn.provider === 'google' ||
    dbConn.provider === 'anthropic' ||
    dbConn.provider === 'deepseek'
      ? (dbConn.provider as LLMConnection['provider'])
      : 'openai';

  return {
    id: dbConn.id,
    name: dbConn.name,
    baseUrl: dbConn.base_url,
    provider,
    apiKey: dbConn.api_key,
    models,
    enabled: dbConn.enabled,
  };
}

export const llmConnectionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLLMConnections: builder.query<LLMConnection[], void>({
      query: () => ({
        command: TauriCommands.GET_LLM_CONNECTIONS,
      }),
      transformResponse: (response: DbLLMConnection[]) =>
        response.map(dbToFrontendLLMConnection),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({
                type: 'LLMConnection' as const,
                id,
              })),
              { type: 'LLMConnection', id: 'LIST' },
            ]
          : [{ type: 'LLMConnection', id: 'LIST' }],
    }),
    createLLMConnection: builder.mutation<
      LLMConnection,
      Omit<LLMConnection, 'id'>
    >({
      query: (connection) => {
        const id = Date.now().toString();
        const modelsJson = connection.models
          ? JSON.stringify(connection.models)
          : null;
        return {
          command: TauriCommands.CREATE_LLM_CONNECTION,
          args: {
            id,
            name: connection.name,
            baseUrl: connection.baseUrl,
            provider: connection.provider,
            apiKey: connection.apiKey,
            modelsJson,
            defaultModel: null,
          },
        };
      },
      // Optimistic update could be added here, but simpler to just invalidate
      invalidatesTags: [{ type: 'LLMConnection', id: 'LIST' }],
    }),
    updateLLMConnection: builder.mutation<
      void,
      { id: string; connection: Partial<LLMConnection> }
    >({
      query: ({ id, connection }) => {
        const modelsJson = connection.models
          ? JSON.stringify(connection.models)
          : null;
        return {
          command: TauriCommands.UPDATE_LLM_CONNECTION,
          args: {
            id,
            name: connection.name ?? null,
            baseUrl: connection.baseUrl ?? null,
            provider: connection.provider ?? null,
            apiKey: connection.apiKey ?? null,
            modelsJson: modelsJson ?? null,
            defaultModel: null,
            enabled: connection.enabled ?? null,
          },
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LLMConnection', id },
        { type: 'LLMConnection', id: 'LIST' },
      ],
    }),
    toggleLLMConnectionEnabled: builder.mutation<
      void,
      { id: string; enabled: boolean }
    >({
      query: ({ id, enabled }) => ({
        command: TauriCommands.UPDATE_LLM_CONNECTION,
        args: {
          id,
          name: null,
          baseUrl: null,
          provider: null,
          apiKey: null,
          modelsJson: null,
          defaultModel: null,
          enabled,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LLMConnection', id },
        { type: 'LLMConnection', id: 'LIST' },
      ],
    }),
    deleteLLMConnection: builder.mutation<void, string>({
      query: (id) => ({
        command: TauriCommands.DELETE_LLM_CONNECTION,
        args: { id },
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'LLMConnection', id },
        { type: 'LLMConnection', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLLMConnectionsQuery,
  useCreateLLMConnectionMutation,
  useUpdateLLMConnectionMutation,
  useDeleteLLMConnectionMutation,
  useToggleLLMConnectionEnabledMutation,
} = llmConnectionsApi;
