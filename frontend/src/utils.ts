import { Dispatch, SetStateAction, useEffect, useState, useRef } from 'react';

type Callback<T> = (arg: T) => void;
type SetStateFunction<T> = Dispatch<SetStateAction<T>>;
type SetStateCallbackFunction<T> = (newState: T, callback: Callback<T>) => void;

export function useStateCallback<T>(
	initialState: T | (() => T),
): [T, SetStateFunction<T>, SetStateCallbackFunction<T>] {
	const [state, setState] = useState(initialState);
	// create a ref to store the callback function
	const callbackRef = useRef<Callback<T> | null>(null);

	const setStateCallback = (newState: T, callback: Callback<T>) => {
		// store the callback function in the ref
		callbackRef.current = callback;
		setState(newState);
	};

	useEffect(() => {
		if (callbackRef.current) {
			// call the callback function with the current state value
			console.log('callbackRef.current', state);
			callbackRef.current(state);
			callbackRef.current = null;
		}
	}, [state]);

	return [state, setState, setStateCallback];
}

export function usePrevious<T>(value: T) {
	const ref = useRef<T>();
	useEffect(() => {
		ref.current = value;
	});
	return ref.current;
}

export function useDebounce<T extends (...args: any[]) => any>(callback: T, delay: number): [T, () => void] {
	// A ref object to store the timeout id
	const timeoutRef = useRef<NodeJS.Timeout>();
	// A function that clears the timeout
	function clear() {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
	}
	// A function that returns a debounced version of the callback
	function debouncedCallback(...args: Parameters<T>) {
		console.log('debouncedCallback', args);
		// Clear the previous timeout
		clear();
		// Set a new timeout with the delay
		timeoutRef.current = setTimeout(() => {
			// Call the callback with the arguments
			callback(...args);
		}, delay);
	}
	// Return the debounced function and the clear function
	return [debouncedCallback as T, clear];
}

export function throttle<T extends (...args: any[]) => any>(callback: T, limit: number): T {
	let lastCall = 0;
	return ((...args: Parameters<T>) => {
		const now = new Date().getTime();
		if (now - lastCall < limit) {
			return;
		}
		lastCall = now;
		return callback(...args);
	}) as T;
}

export function capitalize(s: string): string {
	return s[0].toUpperCase() + s.slice(1);
}
