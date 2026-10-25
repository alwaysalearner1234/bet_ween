/**
 * BETWEEN - Connections Screen (Server Wrapper)
 */

import { Suspense } from "react";
import ConnectionsClient from "./ConnectionsClient";

export default function ConnectionsScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ConnectionsClient />
    </Suspense>
  );
}