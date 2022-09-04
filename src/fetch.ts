import { useMemo } from 'react';
import usePromise, { PromiseStateT } from './promise';

export default function useFetch<T>(
	input: RequestInfo | URL,
	init?: RequestInit
): PromiseStateT<T, Error> {
	const promise: (signal: AbortSignal) => Promise<T> = useMemo(
		() => async (signal: AbortSignal) => {
			const res = await window.fetch(input, {
				signal,
				...init,
			});
			const result = await res.json();
			return result;
		},
		[input, init]
	);

	return usePromise<T, Error>(promise);
}
