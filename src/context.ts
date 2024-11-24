/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ExtractProperties } from 'utilium';
import { credentials as defaultCredentials, type Credentials } from './credentials.js';
import * as fs from './emulation/index.js';
import type { AbsolutePath } from './emulation/path.js';

type Fn_FS = Omit<ExtractProperties<typeof fs, (...args: any[]) => any>, 'mountObject'>;
type Fn_Promises = ExtractProperties<typeof fs.promises, (...args: any[]) => any>;

/**
 * Binds a this value for all of the functions in an object (not recursive)
 * @internal
 */
function _bindFunctions<T extends Record<string, unknown>>(fns: T, thisValue: any): T {
	return Object.fromEntries(Object.entries(fns).map(([k, v]) => [k, typeof v == 'function' ? v.bind(thisValue) : v])) as T;
}

export interface FSContext {
	readonly root: AbsolutePath;
	readonly credentials: Credentials;
}

export type V_Context = Partial<FSContext> | void | Record<string, unknown>;

/**
 * Allows you to restrict operations to a specific root path and set of credentials.
 * @experimental
 */
export interface BoundContext extends Fn_FS, FSContext {
	promises: Fn_Promises;
}

/**
 * Allows you to restrict operations to a specific root path and set of credentials.
 * @experimental
 */
export function bindContext(root: AbsolutePath, credentials: Credentials = defaultCredentials): BoundContext {
	const ctx = {
		root,
		credentials,
	} satisfies FSContext;

	fs.mkdirSync(root, { recursive: true });

	const fn_fs = _bindFunctions<Fn_FS>(fs, ctx);
	const fn_promises = _bindFunctions<Fn_Promises>(fs.promises, ctx);

	return { ...ctx, ...fn_fs, promises: fn_promises };
}
