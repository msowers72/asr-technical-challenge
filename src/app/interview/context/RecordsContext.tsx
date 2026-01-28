'use client';

/*
 * RecordsContext is the single source of truth for all record data in this
 * interview exercise.  It encapsulates data fetching from the mock API,
 * exposes mutation functions for updating records, and maintains a simple
 * history log of status changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { RecordItem, RecordStatus, RecordHistoryEntry } from '../types';
import { fetchRecords, updateRecord as apiUpdateRecord } from '../services/recordsService';


interface RecordsContextValue {
  records: RecordItem[];
  loading: boolean;
  error: string | null;
  /**
   * Update a record’s status and/or note. This function calls the mock API
   * and then updates local state. Errors are set on the context.
   */
  updateRecord: (id: string, updates: { status?: RecordStatus; note?: string }) => Promise<void>;
  /**
   * Refresh the list of records from the API. Useful after a mutation
   * or when you need the latest state.
   */
  refresh: () => Promise<void>;

  /**
   * A log of record updates performed during this session. Each entry
   * records the record id, previous and new status, optional note and a
   * timestamp. This can be used to build an audit log or to teach
   * candidates about derived state.
   */
  history: RecordHistoryEntry[];
  /**
   * Clears the history log.
   */
  clearHistory: () => void;
}

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RecordHistoryEntry[]>([]);

  const loadData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const incoming = await fetchRecords();
    setRecords(incoming);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
  } finally {
    setLoading(false);
  }
}, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

const doUpdate = useCallback(
  async (id: string, updates: { status?: RecordStatus; note?: string }) => {
    setError(null);
    try {
      const updated = await apiUpdateRecord({ id, ...updates });

      setRecords(prev =>
        prev.map(r => (r.id === updated.id ? updated : r))
      );

      const prevRecord = records.find(r => r.id === id);
      if (
        prevRecord &&
        updates.status &&
        prevRecord.status !== updates.status
      ) {
        const entry: RecordHistoryEntry = {
          id,
          previousStatus: prevRecord.status,
          newStatus: updates.status,
          note: updates.note,
          timestamp: new Date().toISOString(),
        };
        setHistory(prevHist => [...prevHist, entry]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  },
  [records]
);


  const reLoad = useCallback(async () => {
    await loadData();
  }, [loadData]);

 const purgeHistory = useCallback(() => {
  setHistory([]);
}, []);

  const value = {
    records: data,
    loading: busy,
    error: err,
    updateRecord: doUpdate,
    refresh: reLoad,
    history: log,
    clearHistory: purgeLog,
  };
  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const ctx = useContext(RecordsContext);
  if (!ctx) throw new Error('useRecords must be used within a RecordsProvider');
  return ctx;
}
