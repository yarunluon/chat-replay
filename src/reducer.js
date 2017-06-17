import isEmpty from 'lodash/isEmpty';

/**
* Redux-like reducer to generate stateless conversation records
* @param {Object} state - Chat replay state
* @param {Object} payload - Instructions to generate the conversation
* @returns {Object} A new conversation state
**/
export const reducer = (state = {}, payload = {}) => {
  const { conversation = [], users = [], messages = {} } = state;
  const { type } = payload;

  switch (type) {
    case 'connect': {
      const {
        user: { id: userId, user_name: username, display_name: displayName },
      } = payload;

      // To practice immutability, we make a copy before we modify it.
      const nextUsers = users.slice();
      nextUsers[userId] = { username, displayName };

      // Add new converstaion record by copying the array. Avoid mutating state directly.
      const nextConversation = conversation.concat({
        text: '',
        type,
        userId,
      });

      return { conversation: nextConversation, users: nextUsers };
    }

    case 'delete': {
      const { message: { id: messageId } } = payload;
      const index = messages[messageId] || 0;

      // Copy the array before changing it
      const nextConversation = conversation.slice();
      nextConversation[index] = {
        type,
        userId: conversation[index].userId,
      };

      return { conversation: nextConversation };
    }

    case 'disconnect': {
      const { user: { id: userId } } = payload;
      const nextConversation = conversation.concat({
        type,
        userId,
      });

      return { conversation: nextConversation };
    }

    case 'finished': {
      // Chat replay is over
      return { conversation: conversation.concat({ type }) };
    }

    case 'message': {
      const {
        user: { id: userId, user_name: userName, username, display_name: displayName },
        message: { id: messageId, text },
      } = payload;

      // Add new record to conversation
      const nextConversation = conversation.concat({ userId, text, type });

      // Index the message incase it needs to be updated later
      const nextMessages = Object.assign(
        {},
        messages,
        { [messageId]: nextConversation.length - 1 },
      );

      // Index the users in case they change their name
      const nextUsers = users.slice();
      nextUsers[userId] = { username: userName || username, displayName };

      return { conversation: nextConversation, users: nextUsers, messages: nextMessages };
    }

    case 'update': {
      const { user = {}, message = {} } = payload;

      if (!isEmpty(user)) {
        // Update the user and all the conversations that had the user in it
        const { id: userId, username: nextUsername, display_name: nextDisplayName } = user;
        const { username, displayName } = users[userId];

        // Copy the array to immutability reasons
        const nextUsers = users.slice();
        nextUsers[userId] = { username: nextUsername, displayName: nextDisplayName };

        // Generate a stateless record of the update event
        const nextConversation = conversation.concat({
          userId,
          type: 'update-user',
          oldUsername: username,
          oldDisplayName: displayName,
          nextUsername,
          nextDisplayName,
        });

        return { conversation: nextConversation, users: nextUsers };
      }

      if (!isEmpty(message)) {
        // A message was updated
        const { id: messageId, text } = message;
        const index = messages[messageId];

        // Copy and then modify
        const nextConversation = conversation.slice();
        nextConversation[index] = {
          userId: conversation[index].userId,
          text,
          type: 'update-message',
        };

        return { conversation: nextConversation };
      }

      return state;
    }

    default:
      return state;
  }
};

export default reducer;
