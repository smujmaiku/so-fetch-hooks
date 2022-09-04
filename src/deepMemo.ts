import { useEffect, useMemo, useState } from 'react';
import deepEqual from 'deep-equal';

/**
 * Use a messy object like value as a memo
 */
export default function useDeepMemo<T>(value: T): T {
	const [state, setState] = useState(value);

	const current = useMemo(
		() => (deepEqual(value, state) ? state : value),
		[value, state]
	);

	useEffect(() => {
		setState(current);
	}, [current]);

	return current;
}
