import { useCallback, useEffect } from 'react';
import useDefer, { DeferStateT, isBusy } from './defer';

export type PromiseReloadFn = (reset?: boolean) => void;
export type PromiseStateT<T, E> = [...DeferStateT<T, E>, PromiseReloadFn];

const noop = () => {
	/* noop */
};

export default function usePromise<T, E>(
	promise: (signal: AbortSignal) => Promise<T>
): PromiseStateT<T, E> {
	const [value, status, actions] = useDefer<T, E>();
	const defer = [value, status] as DeferStateT<T, E>;

	const busy = isBusy(defer);

	useEffect(() => {
		if (!busy) return noop;

		actions.reset();

		const controller = new AbortController();
		const { signal } = controller;

		(async () => {
			const result = await promise(signal);
			if (signal.aborted) return;
			actions.resolve(result);
		})().catch((error) => {
			if (signal.aborted) return;
			actions.reject(error);
		});

		return () => {
			controller.abort();
		};
	}, [busy, promise, actions]);

	const reload: PromiseReloadFn = useCallback(
		(reset = false) => {
			if (reset) {
				actions.reset();
			} else {
				actions.init();
			}
		},
		[actions]
	);

	return [...defer, reload];
}
