import { baseApi } from '@/store/api/baseApi';
import { TauriCommands } from '@/bindings/commands';
import type { Workspace } from '../types';

interface DbWorkspace {
  id: string;
  name: string;
  created_at: number;
}

export const workspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkspaces: builder.query<Workspace[], void>({
      query: () => ({
        command: TauriCommands.GET_WORKSPACES,
      }),
      transformResponse: (response: DbWorkspace[]) => {
        return response.map((w) => ({
          id: w.id,
          name: w.name,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Workspace' as const, id })),
              { type: 'Workspace', id: 'LIST' },
            ]
          : [{ type: 'Workspace', id: 'LIST' }],
    }),
    createWorkspace: builder.mutation<Workspace, string>({
      query: (name) => ({
        command: TauriCommands.CREATE_WORKSPACE,
        args: {
          id: crypto.randomUUID(),
          name,
        },
      }),
      transformResponse: (response: DbWorkspace) => ({
        id: response.id,
        name: response.name,
      }),
      invalidatesTags: [{ type: 'Workspace', id: 'LIST' }],
    }),
    updateWorkspace: builder.mutation<Workspace, { id: string; name: string }>({
      queryFn: async ({ id, name }, _api, _extraOptions, baseQuery) => {
        const result = await baseQuery({
          command: TauriCommands.UPDATE_WORKSPACE,
          args: { id, name },
        });
        if (result.error) return { error: result.error };
        return { data: { id, name } };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Workspace', id },
        { type: 'Workspace', id: 'LIST' },
      ],
    }),
    deleteWorkspace: builder.mutation<string, string>({
      query: (id) => ({
        command: TauriCommands.DELETE_WORKSPACE,
        args: { id },
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Workspace', id },
        { type: 'Workspace', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetWorkspacesQuery,
  useCreateWorkspaceMutation,
  useUpdateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} = workspacesApi;
