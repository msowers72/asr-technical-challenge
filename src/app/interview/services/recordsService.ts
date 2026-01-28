import type { RecordItem, RecordStatus } from '../types';


const API_URL = '/api/mock/records';


export async function fetchRecords(): Promise<RecordItem[]> {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Failed to load records: ${response.statusText}`);
  }
  return response.json();
}
