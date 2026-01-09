import { baseApi } from '@/app/api/baseApi';
import { TauriCommands } from '@/bindings/commands';
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
  created_at: number;
  updated_at: number;
}

function dbToFrontendLLMConnection(dbConn: DbLLMConnection): LLMConnection {
  let models: LLMModel[] | undefined;
  if (dbConn.models_json) {
    try {
      models = JSON.parse(dbConn.models_json);
    } catch (e) {
      console.error('Error parsing models_json:', e);
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
    dbConn.provider === 'google'
      ? (dbConn.provider as LLMConnection['provider'])
      : 'openai';

  return {
    id: dbConn.id,
    name: dbConn.name,
    baseUrl: dbConn.base_url,
    provider,
    apiKey: dbConn.api_key,
    models,
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
            // defaultModel is no longer used in LLM connection
          },
        };
      },
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
} = llmConnectionsApi;
