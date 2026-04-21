import type { QueryKey, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { HealthStatus, PopularSearch, SearchBooksParams, SearchResults, SearchStats } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Search Islamic books on Archive.org
 */
export declare const getSearchBooksUrl: (params: SearchBooksParams) => string;
export declare const searchBooks: (params: SearchBooksParams, options?: RequestInit) => Promise<SearchResults>;
export declare const getSearchBooksQueryKey: (params?: SearchBooksParams) => readonly ["/api/books/search", ...SearchBooksParams[]];
export declare const getSearchBooksQueryOptions: <TData = Awaited<ReturnType<typeof searchBooks>>, TError = ErrorType<unknown>>(params: SearchBooksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchBooks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof searchBooks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type SearchBooksQueryResult = NonNullable<Awaited<ReturnType<typeof searchBooks>>>;
export type SearchBooksQueryError = ErrorType<unknown>;
/**
 * @summary Search Islamic books on Archive.org
 */
export declare function useSearchBooks<TData = Awaited<ReturnType<typeof searchBooks>>, TError = ErrorType<unknown>>(params: SearchBooksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchBooks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Recently popular searches
 */
export declare const getPopularSearchesUrl: () => string;
export declare const popularSearches: (options?: RequestInit) => Promise<PopularSearch[]>;
export declare const getPopularSearchesQueryKey: () => readonly ["/api/books/popular"];
export declare const getPopularSearchesQueryOptions: <TData = Awaited<ReturnType<typeof popularSearches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof popularSearches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof popularSearches>>, TError, TData> & {
    queryKey: QueryKey;
};
export type PopularSearchesQueryResult = NonNullable<Awaited<ReturnType<typeof popularSearches>>>;
export type PopularSearchesQueryError = ErrorType<unknown>;
/**
 * @summary Recently popular searches
 */
export declare function usePopularSearches<TData = Awaited<ReturnType<typeof popularSearches>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof popularSearches>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Aggregate search statistics
 */
export declare const getSearchStatsUrl: () => string;
export declare const searchStats: (options?: RequestInit) => Promise<SearchStats>;
export declare const getSearchStatsQueryKey: () => readonly ["/api/books/stats"];
export declare const getSearchStatsQueryOptions: <TData = Awaited<ReturnType<typeof searchStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof searchStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type SearchStatsQueryResult = NonNullable<Awaited<ReturnType<typeof searchStats>>>;
export type SearchStatsQueryError = ErrorType<unknown>;
/**
 * @summary Aggregate search statistics
 */
export declare function useSearchStats<TData = Awaited<ReturnType<typeof searchStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof searchStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map