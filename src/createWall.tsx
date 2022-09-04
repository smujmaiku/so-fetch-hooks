import React, { createContext, useContext } from 'react';
import { DeferStateT, DeferStatus, isBusy, isCache, isReject } from './defer';

export interface WallPropsI<T, E> {
	children?: React.ReactNode;
	state: DeferStateT<T, E>;
	busyComponent?: React.ReactNode;
	failedComponent?: React.ReactNode;
	validate?: (value: T) => boolean;
	hideCached?: boolean;
}

export type WallFn<T, E> = (props: WallPropsI<T, E>) => JSX.Element;

/**
 * Make a defer wall to validate loading data
 * @example
 * const [Wall, useData] = createWall();
 * // ...
 * return <Wall state={someDefer}>...</Wall>
 * // ...
 * const [state] = useData();
 */
export default function createWall<T, E>(): [
	Wall: WallFn<T, E>,
	useWall: () => DeferStateT<T, E>,
	context: React.Context<DeferStateT<T, E>>
] {
	const context = createContext<DeferStateT<T, E>>([
		undefined,
		DeferStatus.BUSY,
	]);

	function useWall() {
		return useContext(context);
	}

	function Wall(props: WallPropsI<T, E>) {
		const {
			state,
			children = null,
			busyComponent = null,
			failedComponent = null,
			validate = () => true,
			hideCached = false,
		} = props;

		const [value] = state;

		let element: React.ReactNode = children;

		if (isReject(state) || !validate(value as T)) {
			element = failedComponent;
		}

		if (isBusy(state) && hideCached === isCache(state)) {
			element = busyComponent;
		}

		return (
			<context.Provider value={state as DeferStateT<T, E>}>
				{element}
			</context.Provider>
		);
	}

	return [Wall, useWall, context];
}
