import React, { useMemo, useReducer } from 'react';

export enum DeferStatus {
	BUSY = 0,
	RESULT = 1,
	REJECT = 2,
	CACHE = 3,
}

export type DeferBusyT = [result: undefined, status: DeferStatus.BUSY];
export type DeferResultT<T> = [result: T, status: DeferStatus.RESULT];
export type DeferRejectT<E> = [result: E, status: DeferStatus.REJECT];
export type DeferCacheT<T> = [result: T, status: DeferStatus.CACHE];
export type DeferStateT<T, E> =
	| DeferBusyT
	| DeferResultT<T>
	| DeferRejectT<E>
	| DeferCacheT<T>;

export type DeferActionInitFn = () => void;
export type DeferActionResetFn = () => void;
export type DeferActionResolveFn<T> = (result: T) => void;
export type DeferActionRejectFn<E> = (reject: E) => void;
export interface DeferActionsI<T, E> {
	init: DeferActionInitFn;
	reset: DeferActionResetFn;
	resolve: DeferActionResolveFn<React.SetStateAction<T>>;
	reject: DeferActionRejectFn<E>;
}

export type DeferReducerActionInitT = [type: 'START'];
export type DeferReducerActionResetT = [type: 'RESET'];
export type DeferReducerActionResolveT<T> = [
	type: 'RESOLVE',
	result: React.SetStateAction<T>
];
export type DeferReducerActionRejectT<E> = [type: 'REJECT', error: E];
export type DeferReducerAction<T, E> =
	| DeferReducerActionInitT
	| DeferReducerActionResetT
	| DeferReducerActionResolveT<T>
	| DeferReducerActionRejectT<E>;

export function isBusy<T, E>(
	state: DeferStateT<T, E>
): state is DeferBusyT | DeferCacheT<T> {
	const [, status] = state;
	return status === DeferStatus.BUSY || status === DeferStatus.CACHE;
}

export function isResult<T, E>(
	state: DeferStateT<T, E>
): state is DeferResultT<T> {
	const [, status] = state;
	return status === DeferStatus.RESULT;
}

export function isReject<T, E>(
	state: DeferStateT<T, E>
): state is DeferRejectT<E> {
	const [, status] = state;
	return status === DeferStatus.REJECT;
}

export function isCache<T, E>(
	state: DeferStateT<T, E>
): state is DeferCacheT<T> {
	const [, status] = state;
	return status === DeferStatus.CACHE;
}

export function deferReducer<T, E>(
	state: DeferStateT<T, E>,
	action: DeferReducerAction<T, E>
): DeferStateT<T, E> {
	const [type, payload] = action;

	switch (type) {
		case 'START':
			if (isReject(state)) return [undefined, DeferStatus.BUSY];
			if (isResult(state)) return [state[0], DeferStatus.CACHE];
			return state;
		case 'RESET':
			return [undefined, DeferStatus.BUSY];
		case 'RESOLVE':
			if (payload instanceof Function)
				return [payload(state[0] as T), DeferStatus.RESULT];
			return [payload, DeferStatus.RESULT];
		case 'REJECT':
			return [payload, DeferStatus.REJECT];
		default:
	}
	return state;
}

export type UseDeferT<T, E> = [...DeferStateT<T, E>, DeferActionsI<T, E>];

export default function useDefer<T, E>(
	initialState?: DeferStateT<T, E>
): UseDeferT<T, E> {
	const [state, dispatch] = useReducer<
		React.Reducer<DeferStateT<T, E>, DeferReducerAction<T, E>>
	>(deferReducer, initialState || [undefined, DeferStatus.BUSY]);

	const actions = useMemo<DeferActionsI<T, E>>(
		() => ({
			init: () => {
				dispatch(['START']);
			},
			reset: () => {
				dispatch(['RESET']);
			},
			resolve: (value: React.SetStateAction<T>) => {
				dispatch(['RESOLVE', value]);
			},
			reject: (error: E) => {
				dispatch(['REJECT', error]);
			},
		}),
		[]
	);

	return [...state, actions];
}

/* TODO: Revisit typing later
export function all<T extends readonly any[], E extends readonly any[]>(
	list: readonly [...{ [I in keyof T]: DeferStateT<T[I], E[I]> }]
): DeferStateT<T[], E[]> {
	const failed = list.some((row) => isReject(row));
	if (failed) {
		const rejects = list.map((row) => (isReject(row) ? row[0] : undefined));
		return [rejects, DeferStatus.REJECT];
	}

	const loading = list.some(isBusy);
	if (loading) {
		return [undefined, DeferStatus.BUSY];
	}

	const results = list.map(([value]) => value);
	return [results, DeferStatus.RESULT];
}
*/
