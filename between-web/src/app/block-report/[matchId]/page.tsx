/**
 * BETWEEN - Block/Report Screen (Server Wrapper)
 * 
 * Wraps the client component with Suspense to allow dynamic params
 */

import { Suspense } from "react";
import BlockReportClient from "./BlockReportClient";

export default function BlockReportScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <BlockReportClient />
    </Suspense>
  );
}