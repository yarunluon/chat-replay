/* eslint-disable react/no-array-index-key */

import isEmpty from 'lodash/isEmpty';
import MDReactComponent from 'markdown-react-js';
import MDEmoji from 'markdown-it-emoji';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Comment, Dimmer, Header, Loader } from 'semantic-ui-react';
import { reducer } from './reducer';
import './ChatReplay.css';

class ChatReplay extends Component {
  static getEmptyConversationJsx() {
    return (
      <div>
        No chat transcript to replay. Enter a chat transcript URL or use the prefetched transcript.
      </div>
    );
  }

  static getLoadingConversationJsx() {
    return (
      <Dimmer active inverted>
        <Loader inverted>Loading transcript</Loader>
      </Dimmer>
    );
  }

  static getDefaultState() {
    return ({
      conversation: [],
      messages: {},
      replayState: 'unplayed',
      timeoutIds: [],
      users: [],
    });
  }

  constructor(props) {
    super(props);
    this.state = ChatReplay.getDefaultState();
  }

  componentWillReceiveProps() {
    const { timeoutIds } = this.state;

    timeoutIds.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.setState(ChatReplay.getDefaultState());
  }

  componentDidUpdate() {
    this.startReplay();
  }

  /**
   * Get the JSX for a single conversation line
   * @param {Object} - Information about the log item
   * @returns {JSX} - A JSX representation of the log item
   **/
  getLogItemJsx(logItem) {
    const { users } = this.state;
    const { text, type, userId } = logItem;
    const user = users[userId] || {};
    const { displayName, username } = user;

    switch (type) {
      case 'connect': {
        const connectText = `${displayName} (@${username}) has joined the chat.`;
        return (
          <MDReactComponent
            className="join chat"
            markdownOptions={{
              linkify: true,
            }}
            plugins={[
              MDEmoji,
            ]}
            text={connectText}
          />
        );
      }

      case 'disconnect':
        return (
          <div className="exit chat">{`${displayName} has left the chat.`}</div>
        );

      case 'finished':
        return (
          <div>
            <hr />
            <h2>Chat replay finished</h2>
          </div>
        );

      case 'message':
        return (
          <div>
            <Comment.Author>{displayName}</Comment.Author>
            <Comment.Text>
              <MDReactComponent
                markdownOptions={{
                  linkify: true,
                }}
                plugins={[
                  MDEmoji,
                ]}
                text={text}
              />
            </Comment.Text>
          </div>
        );

      case 'update-message': {
        const updatedText = `${text}`;
        return (
          <div>
            <Comment.Author>{displayName}</Comment.Author>
            <Comment.Text>
              <MDReactComponent
                markdownOptions={{
                  linkify: true,
                }}
                plugins={[
                  MDEmoji,
                ]}
                text={updatedText}
              />
              <div className="edited">Edited</div>
            </Comment.Text>
          </div>
        );
      }

      case 'update-user': {
        const { oldUsername, oldDisplayName, nextUsername, nextDisplayName } = logItem;
        const updateUserText =
          `${oldDisplayName} (@${oldUsername}) is now ${nextDisplayName} (@${nextUsername})`;

        return (
          <MDReactComponent
            className="update name"
            markdownOptions={{
              linkify: true,
            }}
            plugins={[
              MDEmoji,
            ]}
            text={updateUserText}
          />
        );
      }

      case 'delete':
      default:
        return null;
    }
  }

  /**
   * Get the JSX for the conversation that has been published thus far
   * @returns {JSX} Stateless representation of the active conversation
   * */
  getConversationJsx() {
    const { conversation } = this.state;
    const conversationJsx = conversation.map((logItem, index) => {
      const logItemJsx = this.getLogItemJsx(logItem);
      return isEmpty(logItemJsx)
        ? null
        : (
          <Comment key={`message-${index}`}>
            {logItemJsx}
          </Comment>
        );
    });

    return conversationJsx;
  }

  /**
   * Get the JSX representating the conversation state (E.g., loading, missing, playing)
   * @returns {JSX} JSX of the conversation state
   * */
  getConversationStateJsx() {
    const { isLoading, transcript } = this.props;

    if (isLoading) {
      return ChatReplay.getLoadingConversationJsx();
    }

    if (isEmpty(transcript)) {
      return ChatReplay.getEmptyConversationJsx();
    }

    return this.getConversationJsx();
  }

  /**
  * Play the log item to the conversation after the correct time has pssed
  * @param {Object} logItem - Information about the logItem
  **/
  queueLogItem(logItem) {
    const { delta, payload } = logItem;
    const { timeoutIds = [] } = this.state;

    // Conversation will be added after the timeout
    const timeoutId = setTimeout(() => {
      const { conversation = [], users = [], messages = [] } = this.state;
      const nextState = reducer({ conversation, users, messages }, payload);
      this.setState(nextState);
    }, delta);

    // Keep track of the ids so we can kill the conversation in the future
    timeoutIds.push(timeoutId);

    this.setState({ timeoutIds });
  }

  /**
   * Start playing the transcript
   * */
  startReplay() {
    const { replayState } = this.state;
    const { transcript = [] } = this.props;

    if (replayState === 'unplayed' && !isEmpty(transcript)) {
      this.setState({ replayState: 'playing' });

      // Add a log item to signal the conversation is finished
      const lastLogItem = transcript.slice(-1)[0];
      const { delta } = lastLogItem;
      const chatReplayFinished = {
        delta: delta + 1000,
        payload: { type: 'finished' },
      };

      // As a best practice, make a copy of the array instead of modifying the props
      transcript.concat(chatReplayFinished).forEach((logItem) => {
        this.queueLogItem(logItem);
      });
    }
  }

  render() {
    return (
      <div>
        <Comment.Group>
          <Header as="h2" dividing>Chat replay</Header>
          {this.getConversationStateJsx()}
        </Comment.Group>
      </div>
    );
  }
}

ChatReplay.propTypes = {
  isLoading: PropTypes.bool,
  transcript: PropTypes.arrayOf(PropTypes.shape({
    delta: PropTypes.number,
    payload: PropTypes.shape({}),
  })),
};

ChatReplay.defaultProps = {
  isLoading: false,
  transcript: [],
};

export default ChatReplay;
