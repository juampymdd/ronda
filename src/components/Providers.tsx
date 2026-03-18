"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { useState } from "react";

// gcTime debe ser >= maxAge del persister para que los datos no desaparezcan antes de tiempo
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 horas

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Con internet lento muestra datos cacheados hasta 30s sin refetch
                        staleTime: 30 * 1000,
                        // Mantiene los datos en cache 24hs para que el persister los pueda guardar
                        gcTime: MAX_CACHE_AGE,
                        // Reintenta 1 vez si falla (no 3, para no spamear en offline)
                        retry: 1,
                        // Cuando vuelve la conexión, revalida automáticamente
                        refetchOnReconnect: true,
                        // No refetch al enfocar la ventana en producción (muy agresivo para un bar)
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    const [persister] = useState(() =>
        createSyncStoragePersister({
            storage: typeof window !== "undefined" ? window.localStorage : undefined,
            key: "ronda-query-cache",
            throttleTime: 1000, // escribe en localStorage máximo 1 vez por segundo
        })
    );

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister,
                maxAge: MAX_CACHE_AGE,
                // Solo persiste queries que no tienen errores
                dehydrateOptions: {
                    shouldDehydrateQuery: (query) =>
                        query.state.status === "success",
                },
            }}
        >
            <SessionProvider>{children}</SessionProvider>
            {process.env.NODE_ENV === "development" && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </PersistQueryClientProvider>
    );
}
