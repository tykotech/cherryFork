# messageThunk.ts Usage Guide

This file contains core Thunk Action Creators used to manage message flow in the
application, handle assistant interactions, and synchronize Redux state with the
IndexedDB database. It primarily works with `Message` and `MessageBlock`
objects.

## Core Functionality

1. **Send/Receive Messages**: Handles sending user messages, triggering
   assistant responses, and stream-processing returned data into different
   `MessageBlock` types.
2. **State Management**: Ensures consistency between messages and message blocks
   in the Redux store and persisted data in IndexedDB.
3. **Message Operations**: Provides lifecycle management functions for deleting,
   resending, regenerating, editing and resending, appending responses, cloning,
   etc.
4. **Block Processing**: Dynamically creates, updates, and saves various types
   of `MessageBlock` (text, thinking process, tool calls, citations, images,
   errors, translations, etc.).

## Main Thunks

Here are some key Thunk functions and their purposes:

1. **`sendMessage(userMessage, userMessageBlocks, assistant, topicId)`**

   - **Purpose**: Sends a new user message.
   - **Process**:
     - Saves the user message (`userMessage`) and its blocks
       (`userMessageBlocks`) to Redux and DB.
     - Checks for `@mentions` to determine if it's a single-model or multi-model
       response.
     - Creates stub(s) for the assistant message(s).
     - Adds the stubs to Redux and DB.
     - Adds the core processing logic `fetchAndProcessAssistantResponseImpl` to
       the queue for that `topicId` to fetch the actual response.
   - **Block Related**: Mainly handles saving the initial `MessageBlock` for the
     user message.

2. **`fetchAndProcessAssistantResponseImpl(dispatch, getState, topicId, assistant, assistantMessage)`**

   - **Purpose**: (Internal function) Core logic for fetching and processing a
     single assistant response, called by `sendMessage`, `resend...`,
     `regenerate...`, `append...`, etc.
   - **Process**:
     - Sets the Topic loading state.
     - Prepares context messages.
     - Calls the `fetchChatCompletion` API service.
     - Uses `createStreamProcessor` to process streaming responses.
     - Handles different types of events through various callbacks
       (`onTextChunk`, `onThinkingChunk`, `onToolCallComplete`,
       `onImageGenerated`, `onError`, `onComplete`, etc.).
   - **Block Related**:
     - Creates initial `UNKNOWN` blocks based on stream events.
     - Creates and updates `MAIN_TEXT` and `THINKING` blocks in real-time, using
       `throttledBlockUpdate` and `throttledBlockDbUpdate` for throttled
       updates.
     - Creates blocks of type `TOOL`, `CITATION`, `IMAGE`, `ERROR`, etc.
     - Marks block status as `SUCCESS` or `ERROR` when events complete (e.g.,
       `onTextComplete`, `onToolCallComplete`), and saves the final state using
       `saveUpdatedBlockToDB`.
     - Uses `handleBlockTransition` to manage the addition and status updates of
       non-streaming blocks (like `TOOL`, `CITATION`).

3. **`loadTopicMessagesThunk(topicId, forceReload)`**

   - **Purpose**: Loads all messages and their associated `MessageBlock`s for a
     specified topic from the database.
   - **Process**:
     - Fetches the `Topic` and its `messages` list from DB.
     - Fetches all related `MessageBlock`s from DB based on the message ID list.
     - Updates blocks to Redux using `upsertManyBlocks`.
     - Updates messages to Redux.
   - **Block Related**: Responsible for loading persisted `MessageBlock`s into
     the Redux state.

4. **Deletion Thunks**

   - `deleteSingleMessageThunk(topicId, messageId)`: Deletes a single message
     and all its `MessageBlock`s.
   - `deleteMessageGroupThunk(topicId, askId)`: Deletes a user message and all
     its related assistant response messages, along with all their
     `MessageBlock`s.
   - `clearTopicMessagesThunk(topicId)`: Clears all messages and their
     `MessageBlock`s under a topic.
   - **Block Related**: Removes specified `MessageBlock`s from both Redux and
     DB.

5. **Resend/Regenerate Thunks**

   - `resendMessageThunk(topicId, userMessageToResend, assistant)`: Resends a
     user message. Resets (clears Blocks and marks as PENDING) all assistant
     responses associated with that user message, then requests regeneration.
   - `resendUserMessageWithEditThunk(topicId, originalMessage, mainTextBlockId, editedContent, assistant)`:
     Resends after the user edits message content. First updates the `MAIN_TEXT`
     block content of the user message, then calls `resendMessageThunk`.
   - `regenerateAssistantResponseThunk(topicId, assistantMessageToRegenerate, assistant)`:
     Regenerates a single assistant response. Resets that assistant message
     (clears Blocks and marks as PENDING), then requests regeneration.
   - **Block Related**: Deletes old `MessageBlock`s and creates new ones during
     the regeneration process.

6. **`appendAssistantResponseThunk(topicId, existingAssistantMessageId, newModel, assistant)`**

   - **Purpose**: Appends a new assistant response using a newly selected model
     for the same user question in the existing conversation context.
   - **Process**:
     - Finds the existing assistant message to get the original `askId`.
     - Creates a new assistant message stub using the `newModel` (with the same
       `askId`).
     - Adds the new stub to Redux and DB.
     - Adds `fetchAndProcessAssistantResponseImpl` to the queue to generate the
       new response.
   - **Block Related**: Creates brand new `MessageBlock`s for the new assistant
     response.

7. **`cloneMessagesToNewTopicThunk(sourceTopicId, branchPointIndex, newTopic)`**

   - **Purpose**: Clones a portion of messages (and their Blocks) from the
     source topic to an **already existing** new topic.
   - **Process**:
     - Copies messages up to the specified index.
     - Generates new UUIDs for all cloned messages and Blocks.
     - Correctly maps `askId` relationships between cloned messages.
     - Copies `MessageBlock` content, updating its `messageId` to point to the
       new message ID.
     - Updates file reference counts (if Block is a file or image).
     - Saves cloned messages and Blocks to Redux state and DB for the new topic.
   - **Block Related**: Creates copies of `MessageBlock`s, updating their IDs
     and `messageId`s.

8. **`initiateTranslationThunk(messageId, topicId, targetLanguage, sourceBlockId?, sourceLanguage?)`**
   - **Purpose**: Initiates the translation process for a specified message by
     creating an initial `MessageBlock` of type `TRANSLATION`.
   - **Process**:
     - Creates a `TranslationMessageBlock` with status `STREAMING`.
     - Adds it to Redux and DB.
     - Updates the original message's `blocks` list to include the new
       translation block ID.
   - **Block Related**: Creates and saves a placeholder
     `TranslationMessageBlock`. The actual translation content retrieval and
     filling needs subsequent steps.

## Internal Mechanisms and Considerations

- **Database Interactions**: Interacts with IndexedDB (`db`) through helper
  functions such as `saveMessageAndBlocksToDB`,
  `updateExistingMessageAndBlocksInDB`, `saveUpdatesToDB`,
  `saveUpdatedBlockToDB`, `throttledBlockDbUpdate`, etc., to ensure data
  persistence.
- **State Synchronization**: Thunks are responsible for coordinating data
  consistency between the Redux Store and IndexedDB.
- **Queue (`getTopicQueue`)**: Uses `AsyncQueue` to ensure operations on the
  same topic (especially API requests) are executed sequentially, avoiding race
  conditions.
- **Throttling (`throttle`)**: Uses `lodash.throttle` for frequent Block updates
  (text, thinking) in streaming responses to optimize performance, reducing the
  number of Redux dispatches and DB writes.
- **Error Handling**: Callbacks in `fetchAndProcessAssistantResponseImpl`
  (especially `onError`) handle errors that may occur during stream processing
  and API calls, creating `MessageBlock`s of type `ERROR`.

When using these Thunks, developers typically need to provide `dispatch`,
`getState` (injected by Redux Thunk middleware), as well as parameters such as
`topicId`, `assistant` configuration object, related `Message` or `MessageBlock`
objects/IDs, etc. Understanding each Thunk's responsibilities and how it affects
message and block status is crucial.
