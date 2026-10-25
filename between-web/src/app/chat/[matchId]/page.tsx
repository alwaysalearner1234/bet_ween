/**
 * BETWEEN - Chat Screen (Server Wrapper)
 */

import { Suspense } from "react";
import ChatClient from "./ChatClient";

export default function ChatScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ChatClient />
    </Suspense>
  );
}