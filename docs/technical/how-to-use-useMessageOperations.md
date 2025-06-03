# useMessageOperations.ts Usage Guide

This file defines a custom React Hook called `useMessageOperations`. The main
purpose of this Hook is to provide React components with a convenient interface
for performing various message operations related to a specific topic. It
encapsulates the logic for calling Redux Thunks (`messageThunk.ts`) and Actions
(`newMessage.ts`, `messageBlock.ts`), simplifying the code for component
interaction with message data.

## Core Goals

- **Encapsulation**: Encapsulate complex message operation logic (such as
  delete, resend, regenerate, edit, translate, etc.) into easy-to-use functions.
- **Simplification**: Allow components to directly call these operation
  functions without directly interacting with Redux `dispatch` or Thunks.
- **Context Association**: All operations are associated with the passed-in
  `topic` object to ensure that operations are performed on the correct topic.

## How to Use

In your React function component, import and call the `useMessageOperations`
Hook, passing in the currently active `Topic` object.

```typescript
import React from "react";
import { useMessageOperations } from "@renderer/hooks/useMessageOperations";
import type { Assistant, Message, Model, Topic } from "@renderer/types";

interface MyComponentProps {
  currentTopic: Topic;
  currentAssistant: Assistant;
}

function MyComponent({ currentTopic, currentAssistant }: MyComponentProps) {
  const {
    deleteMessage,
    resendMessage,
    regenerateAssistantMessage,
    appendAssistantResponse,
    getTranslationUpdater,
    createTopicBranch,
    // ... other operation functions
  } = useMessageOperations(currentTopic);

  const handleDelete = (messageId: string) => {
    deleteMessage(messageId);
  };

  const handleResend = (message: Message) => {
    resendMessage(message, currentAssistant);
  };

  const handleAppend = (existingMsg: Message, newModel: Model) => {
    appendAssistantResponse(existingMsg, newModel, currentAssistant);
  };

  // ... Use other operation functions in the component

  return (
    <div>
      {/* Component UI */}
      <button onClick={() => handleDelete("some-message-id")}>
        Delete Message
      </button>
      {/* ... */}
    </div>
  );
}
```

## Return Value

The `useMessageOperations(topic)` Hook returns an object containing the
following functions and values:

- **`deleteMessage(id: string)`**:
  - Delete a single message with the specified `id`.
  - Internally calls `deleteSingleMessageThunk`.

- **`deleteGroupMessages(askId: string)`**:
  - Delete a group of messages associated with the specified `askId` (usually a
    user question and all assistant responses).
  - Internally calls `deleteMessageGroupThunk`.

- **`editMessage(messageId: string, updates: Partial<Message>)`**:
  - Update partial properties of the message with the specified `messageId`.
  - **Note**: Currently mainly used to update Redux state
  - Internally calls `newMessagesActions.updateMessage`.

- **`resendMessage(message: Message, assistant: Assistant)`**:
  - Resend the specified user message (`message`), which will trigger the
    regeneration of all associated assistant responses.
  - Internally calls `resendMessageThunk`.

- **`resendUserMessageWithEdit(message: Message, editedContent: string, assistant: Assistant)`**:
  - Resend the message after the main text block of the user message has been
    edited.
  - It will first find the `MAIN_TEXT` block ID of the message, then call
    `resendUserMessageWithEditThunk`.

- **`clearTopicMessages(_topicId?: string)`**:
  - Clear all messages under the current topic (or optionally the specified
    `_topicId`).
  - Internally calls `clearTopicMessagesThunk`.

- **`createNewContext()`**:
  - Emit a global event (`EVENT_NAMES.NEW_CONTEXT`), usually used to notify the
    UI to clear the display and prepare for new context. Does not directly
    modify Redux state.

- **`displayCount`**:
  - (Non-operation function) Gets the current `displayCount` value from the
    Redux store.

- **`pauseMessages()`**:
  - Attempt to abort message generation in progress in the current topic (status
    is `processing` or `pending`).
  - Achieved by finding the relevant `askId` and calling `abortCompletion`.
  - Also dispatches the `setTopicLoading` action to set the loading state to
    `false`.

- **`resumeMessage(message: Message, assistant: Assistant)`**:
  - Resume/resend a user message. Currently implemented as a direct call to
    `resendMessage`.

- **`regenerateAssistantMessage(message: Message, assistant: Assistant)`**:
  - Regenerate the response for the specified **assistant** message (`message`).
  - Internally calls `regenerateAssistantResponseThunk`.

- **`appendAssistantResponse(existingAssistantMessage: Message, newModel: Model, assistant: Assistant)`**:
  - For the **same user question** replied to by `existingAssistantMessage`, use
    `newModel` to append a new assistant response.
  - Internally calls `appendAssistantResponseThunk`.

- **`getTranslationUpdater(messageId: string, targetLanguage: string, sourceBlockId?: string, sourceLanguage?: string)`**:
  - **Purpose**: Get a function for incrementally updating the content of a
    translation block.
  - **Process**:
    1. Internally call `initiateTranslationThunk` to create or get a
       `TRANSLATION` type `MessageBlock` and obtain its `blockId`.
    2. Return an **async update function**.
  - **Returned update function
    `(accumulatedText: string, isComplete?: boolean) => void`**:
    - Receives the accumulated translation text and completion status.
    - Calls `updateOneBlock` to update the translation block content and status
      (`STREAMING` or `SUCCESS`) in Redux.
    - Calls `throttledBlockDbUpdate` to save the update (throttled) to the
      database.
  - If initialization fails (Thunk returns `undefined`), this function returns
    `null`.

- **`createTopicBranch(sourceTopicId: string, branchPointIndex: number, newTopic: Topic)`**:
  - Create a topic branch, cloning messages before the `branchPointIndex` in the
    `sourceTopicId` topic into `newTopic`.
  - **Note**: The `newTopic` object must be created and added to Redux and the
    database **before** calling this function.
  - Internally calls `cloneMessagesToNewTopicThunk`.

## Dependencies

- **`topic: Topic`**: The current context topic object must be passed in. The
  operation functions returned by the Hook will always act on this topic's
  `topic.id`.
- Redux `dispatch`: The Hook internally uses `useAppDispatch` to get the
  `dispatch` function to call actions and thunks.

## Related Hooks

Two auxiliary Hooks are also defined in the same file:

- **`useTopicMessages(topic: Topic)`**:
  - Uses the `selectMessagesForTopic` selector to get and return the message
    list for the specified topic.

- **`useTopicLoading(topic: Topic)`**:
  - Uses the `selectNewTopicLoading` selector to get and return the loading
    state for the specified topic.

These Hooks can be used together with `useMessageOperations` to conveniently get
message data, loading state, and perform related operations in components.
