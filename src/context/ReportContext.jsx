import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/helpers';

const ReportContext = createContext(null);

const initialState = { report: null, loading: false, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { report: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function ReportProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchReport = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const { data } = await api.get('/reports/dashboard');
      dispatch({ type: 'FETCH_SUCCESS', payload: data.data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: getErrorMessage(err) });
    }
  }, []);

  const value = useMemo(() => ({ ...state, fetchReport }), [state, fetchReport]);
  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReports() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReports must be used inside <ReportProvider>');
  return ctx;
}
