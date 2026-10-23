import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/helpers';

const UserContext = createContext(null);

const initialState = {
  users: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  stats: null,
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return { ...state, users: [], pagination: initialState.pagination, error: null };
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, users: action.payload.data, pagination: action.payload.pagination };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const lastParams = useRef({});
  const requestId = useRef(0);

  const clearUsers = useCallback(() => dispatch({ type: 'RESET' }), []);

  const fetchUsers = useCallback(async (params = {}) => {
    lastParams.current = params;
    const id = ++requestId.current;
    dispatch({ type: 'FETCH_START' });
    try {
      const query = Object.fromEntries(
        Object.entries({ limit: 10, ...params }).filter(([, v]) => v !== '' && v !== undefined)
      );
      const { data } = await api.get('/users', { params: query });
      if (id === requestId.current) dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      if (id === requestId.current) dispatch({ type: 'FETCH_ERROR', payload: getErrorMessage(err) });
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/users/stats');
      dispatch({ type: 'SET_STATS', payload: data.data });
    } catch {
      dispatch({ type: 'SET_STATS', payload: null });
    }
  }, []);

  const refetch = useCallback(() => fetchUsers(lastParams.current), [fetchUsers]);

  // Every mutation throws on failure (so forms can show the server's message)
  // and resolves with the response body: { data, message }.
  const createUser = useCallback(async (payload) => {
    const { data } = await api.post('/users', payload);
    await refetch();
    return data;
  }, [refetch]);

  const updateUser = useCallback(async (id, payload) => {
    const { data } = await api.put(`/users/${id}`, payload);
    await refetch();
    return data;
  }, [refetch]);

  const setUserStatus = useCallback(async (id, isActive) => {
    const { data } = await api.patch(`/users/${id}/status`, { isActive });
    await refetch();
    return data;
  }, [refetch]);

  const resetPassword = useCallback(async (id, password) => {
    const { data } = await api.post(`/users/${id}/reset-password`, { password });
    return data;
  }, []);

  const deleteUser = useCallback(async (id) => {
    const { data } = await api.delete(`/users/${id}`);
    await refetch();
    return data;
  }, [refetch]);

  const value = useMemo(
    () => ({ ...state, clearUsers, fetchUsers, fetchStats, createUser, updateUser, setUserStatus, resetPassword, deleteUser }),
    [state, clearUsers, fetchUsers, fetchStats, createUser, updateUser, setUserStatus, resetPassword, deleteUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUsers must be used inside <UserProvider>');
  return ctx;
}
