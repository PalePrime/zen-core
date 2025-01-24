/* Logging utilities. The things in this file are named to work nicely when you import as a namespace. */

import { List } from 'utilium';

export const enum Level {
	/** Emergency */
	EMERG,
	/** Alert */
	ALERT,
	/** Critical */
	CRIT,
	/** Error */
	ERR,
	/** Warning */
	WARN,
	/** Notice */
	NOTICE,
	/** Informational */
	INFO,
	/** Debug */
	DEBUG,
}

/** An object mapping log levels to a textual representation of them */
export const levels = {
	[Level.EMERG]: 'emergency',
	[Level.ALERT]: 'alert',
	[Level.CRIT]: 'critical',
	[Level.ERR]: 'error',
	[Level.WARN]: 'warning',
	[Level.NOTICE]: 'notice',
	[Level.INFO]: 'info',
	[Level.DEBUG]: 'debug',
} as const satisfies Record<Level, string>;

function levelOf(value: (typeof levels)[Level]): Level {
	return +Object.keys(levels)[Object.values(levels).indexOf(value)];
}

/** A log entry */
export interface Entry {
	level: Level;
	timestamp: Date;
	elapsedMs: number;
	message: string;
}

/** The list of log entries */
export const entries = new List<Entry>();

export function log(level: Level, message: string) {
	if (!isEnabled) return;
	const entry: Entry = {
		level,
		message,
		timestamp: new Date(),
		elapsedMs: performance.now(),
	};
	entries.add(entry);
	output(entry);
}

function _shortcut(level: Level) {
	return function <const T extends { toString(): string }>(message: T): T {
		log(level, message.toString());
		return message;
	};
}

// Shortcuts

/** Shortcut for logging emergencies */
export const emerg = _shortcut(Level.EMERG);
/** Shortcut for logging alerts */
export const alert = _shortcut(Level.ALERT);
/** Shortcut for logging critical errors */
export const crit = _shortcut(Level.CRIT);
/** Shortcut for logging non-critical errors */
export const err = _shortcut(Level.ERR);
/** Shortcut for logging warnings */
export const warn = _shortcut(Level.WARN);
/** Shortcut for logging notices */
export const notice = _shortcut(Level.NOTICE);
/** Shortcut for logging informational messages */
export const info = _shortcut(Level.INFO);
/** Shortcut for logging debug messages */
export const debug = _shortcut(Level.DEBUG);

/**
 * Shortcut for logging usage of deprecated functions at runtime
 * @param symbol The thing that is deprecated
 * @internal @hidden
 */
export function log_deprecated(symbol: string): void {
	log(Level.WARN, symbol + ' is deprecated and should not be used.');
}

// Formatting and output

let _format: (entry: Entry) => string = (entry: Entry) => {
	return `[${(entry.elapsedMs / 1000).toFixed(3).padStart(10)}] ${entry.message}`;
};

export function format(entry: Entry) {
	return _format(entry);
}

let _output: (message: string) => unknown = console.error;

function output(entry: Entry) {
	if (typeof minLevel == 'number' && entry.level > minLevel) return;
	_output(format(entry));
}

let minLevel: Level = Level.ALERT;

// Configuration

/** Whether log entries are being recorded */
export let isEnabled: boolean = false;

export interface LogConfiguration {
	/**
	 * If false, log messages will not be recorded or outputted
	 * @default false
	 */
	enabled?: boolean;

	/**
	 * The minimum level needed to output a message
	 * @default Level.ALERT
	 */
	level?: Level | (typeof levels)[Level];

	/**
	 * Formats a log entry into a string
	 * @default `[${ms / 1000}] ${message}`
	 */
	format?(this: void, entry: Entry): string;

	/**
	 * Outputs a log message
	 * @default console.error()
	 */
	output?(this: void, message: string): unknown;

	/**
	 * If set, output() all current entries after `configure` is done
	 * @default false
	 */
	dumpBacklog?: boolean;
}

/** Configure logging behavior */
export function configure(options: LogConfiguration): void {
	_format = options.format ?? _format;
	_output = options.output ?? _output;
	minLevel = typeof options.level == 'string' ? levelOf(options.level) : options.level ?? minLevel;
	isEnabled = options.enabled ?? isEnabled;

	if (!options.dumpBacklog) return;

	for (const entry of entries) {
		output(entry);
	}
}
