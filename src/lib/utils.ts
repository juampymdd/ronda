import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type Result<T, E = string> =
    | { success: true; data: T }
    | { success: false; error: E };

export const success = <T>(data: T): Result<T, never> => ({
    success: true,
    data,
});

export const error = <E>(error: E): Result<never, E> => ({
    success: false,
    error,
});
