import Constants from "expo-constants";

const apiUrl = Constants.expoConfig?.extra?.apiUrl || "http://localhost:3001";
const API_BASE = `${apiUrl}/api`;

export const getMessages = async (conversationId: string) => {
  const res = await fetch(`${API_BASE}/messages?conversation_id=${conversationId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch messages");
  return data.messages;
};

export const sendMessage = async ({
  sender_id,
  receiver_id,
  conversation_id,
  content,
  attachment_url,
}: {
  sender_id: string;
  receiver_id: string;
  conversation_id: string;
  content: string;
  attachment_url?: string;
}) => {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sender_id, receiver_id, conversation_id, content, attachment_url }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to send message");
  return data.message;
};
