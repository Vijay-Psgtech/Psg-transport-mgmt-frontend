import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/helpers';

const VehicleContext = createContext(null);

const initialState = {
  vehicles: [],
  pagination: { page: 1, limit: 10, total: 0, pages: 1 },
  stats: null,
  drivers: [],
  loading: false,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, vehicles: action.payload.data, pagination: action.payload.pagination };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'SET_DRIVERS':
      return { ...state, drivers: action.payload };
    default:
      return state;
  }
}

export function VehicleProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const lastParams = useRef({}); // lets mutations refresh the list with the same filters
  const requestId = useRef(0); // ignores out-of-order responses

  const fetchVehicles = useCallback(async (params = {}) => {
    lastParams.current = params;
    const id = ++requestId.current;
    dispatch({ type: 'FETCH_START' });
    try {
      const query = Object.fromEntries(
        Object.entries({ limit: 10, ...params }).filter(([, v]) => v !== '' && v !== undefined)
      );
      const { data } = await api.get('/vehicles', { params: query });
      if (id === requestId.current) dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      if (id === requestId.current) dispatch({ type: 'FETCH_ERROR', payload: getErrorMessage(err) });
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/vehicles/stats');
      dispatch({ type: 'SET_STATS', payload: data.data });
    } catch {
      dispatch({ type: 'SET_STATS', payload: null });
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const { data } = await api.get('/users', { params: { role: 'driver' } });
      dispatch({ type: 'SET_DRIVERS', payload: data.data });
    } catch {
      dispatch({ type: 'SET_DRIVERS', payload: [] });
    }
  }, []);

  // Mutations throw on failure so the form can show the server's message
  const createVehicle = useCallback(async (payload) => {
    const { data } = await api.post('/vehicles', payload);
    await fetchVehicles(lastParams.current);
    return data.data;
  }, [fetchVehicles]);

  const updateVehicle = useCallback(async (id, payload) => {
    const { data } = await api.put(`/vehicles/${id}`, payload);
    await fetchVehicles(lastParams.current);
    return data.data;
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id) => {
    await api.delete(`/vehicles/${id}`);
    await fetchVehicles(lastParams.current);
  }, [fetchVehicles]);

  const value = useMemo(
    () => ({ ...state, fetchVehicles, fetchStats, fetchDrivers, createVehicle, updateVehicle, deleteVehicle }),
    [state, fetchVehicles, fetchStats, fetchDrivers, createVehicle, updateVehicle, deleteVehicle]
  );

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicles() {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicles must be used inside <VehicleProvider>');
  return ctx;
}
