-- Add UPDATE policy for messages table so users can edit their own messages
CREATE POLICY "Users can update messages in their conversations"
ON public.messages
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM conversations
  WHERE conversations.id = messages.conversation_id
  AND conversations.user_id = auth.uid()
));