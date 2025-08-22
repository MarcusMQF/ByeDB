'use client';

import Chat from "@/components/chat";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  useEffect(() => {
    console.log('Dashboard useEffect running');
    // Read message from localStorage
    const message = localStorage.getItem('byedb_landing_message');
    console.log('Message from localStorage:', message);
    if (message) {
      console.log('Setting initial message:', message);
      setInitialMessage(message);
      // Remove the message from localStorage so it's only sent once
      localStorage.removeItem('byedb_landing_message');
    }
  }, []);

  return <Chat initialMessage={initialMessage} />;
}
