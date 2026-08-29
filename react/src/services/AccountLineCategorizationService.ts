import axios from 'axios';
import BaseService from './BaseService';
import AccountLineRule from '@/interfaces/AccountLineRule';
import type { SaveAccountLineRuleRequest, SearchAccountLineRulePatternRequest, UnmappedAccountLineRuleResponse } from '@chocosous/shared';

export default class AccountLineCategorizationService extends BaseService {
  getAll(): Promise<AccountLineRule[]> {
    return axios.get(`${this.apiUrl}/categorization`).then(r => r.data);
  }

  /**
   * Cherches les règles de catégorisation correspondant au pattern fourni (LIKE).
   * @param pattern 
   * @returns 
   */
  search(pattern: string): Promise<AccountLineRule[]> {

    const payload: SearchAccountLineRulePatternRequest = { pattern }
    return axios.post(`${this.apiUrl}/categorization/search`, payload).then(r => r.data);
  }

  create(
    label: string,
    accountId: number,
    posteId?: number | null,
    natureId?: number | null
  ) {
    const payload: SaveAccountLineRuleRequest = {
      label,
      accountId,
      posteId,
      natureId
    }

    return axios.post(`${this.apiUrl}/categorization`, payload).then(r => r.data);
  }

  /**
   * Update an existing categorization rule.
   * Payload may include any of pattern, posteId or natureId.
   */
  update(
    id: number,
    label: string,
    accountId: number,
    posteId?: number | null,
    natureId?: number | null
  ) {
    const payload: SaveAccountLineRuleRequest = {
      label,
      accountId,
      posteId,
      natureId
    }
    return axios.put(`${this.apiUrl}/categorization/${id}`, payload).then(r => r.data);
  }

  delete(id: number) {
    return axios.delete(`${this.apiUrl}/categorization/${id}`);
  }

  getAllUnmapped(): Promise<UnmappedAccountLineRuleResponse[]> {
    return axios.get(`${this.apiUrl}/categorization/unmapped`).then(r => r.data as UnmappedAccountLineRuleResponse[]);
  }
}
