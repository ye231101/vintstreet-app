export interface SearchParams {
  query: string;
  queryBy?: string;
  filterBy?: string;
  sortBy?: string;
  perPage?: number;
  page?: number;
  facetBy?: string[];
  facetSize?: number;
}
