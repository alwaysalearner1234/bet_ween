/**
 * BETWEEN - Waiting Screen (Server Wrapper)
 */

import { Suspense } from "react";
import WaitingClient from "./WaitingClient";

export default function WaitingScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <WaitingClient />
    </Suspense>
  );
}