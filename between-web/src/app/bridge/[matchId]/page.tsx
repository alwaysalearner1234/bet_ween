/**
 * BETWEEN - Bridge Screen (Server Wrapper)
 * 
 * Wraps the client component with Suspense to allow dynamic params
 */

import { Suspense } from "react";
import BridgeClient from "./BridgeClient";

export default function BridgeScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <BridgeClient />
    </Suspense>
  );
}