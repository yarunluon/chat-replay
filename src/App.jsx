import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { Container, Grid, Message, Segment } from 'semantic-ui-react';

import './App.css';
import * as api from './api';
import ChatReplay from './ChatReplay';

class App extends Component {
  constructor() {
    super();

    this.state = {
      errorMessage: '',
      isLoading: false,
      transcript: [],
      url: '',
      validationMessage: '',
    };

    this.fetchLocalTranscript = this.fetchLocalTranscript.bind(this);
    this.fetchRemoteTranscript = this.fetchRemoteTranscript.bind(this);
    this.onUrlChange = this.onUrlChange.bind(this);
  }

  onUrlChange(event) {
    const {
      value: url,
      validationMessage: urlValidationMessage = '',
    } = event.target;
    this.setState({ url, urlValidationMessage });
  }

  fetchLocalTranscript() {
    this.fetchTranscript(`${process.env.PUBLIC_URL}/data/test.json`);
  }

  fetchRemoteTranscript() {
    const { url, urlValidationMessage } = this.state;
    if (urlValidationMessage || !url) {
      this.setState({
        errorMessage: urlValidationMessage || 'Please enter a url',
        isLoading: false,
        transcript: [],
      });
    } else {
      this.fetchTranscript(url);
    }
  }

  fetchTranscript(url) {
    this.setState({ isLoading: true });
    api.getTranscript(url)
      .then(
        (json = []) => {
          this.setState({
            errorMessage: '',
            isLoading: false,
            transcript: json,
          });
        },
      )
      .catch(() => {
        this.setState({
          errorMessage: 'Problem retrieving JSON transcript',
          isLoading: false,
          transcript: [],
        });
      });
  }

  render() {
    const {
      errorMessage,
      isLoading,
      transcript,
      url,
    } = this.state;

    return (
      <Container>
        <Grid>
          <Grid.Row>
            <Grid.Column textAlign="center">
              <h1 className="page title">Chat replay simulator</h1>
              <Segment basic>
                <div className="form field">
                  <input
                    className="url input"
                    onChange={this.onUrlChange}
                    placeholder="http://example.com/path/to/chat"
                    type="url"
                    value={url}
                  />
                  <button
                    className="cta button"
                    onClick={this.fetchRemoteTranscript}
                    type="button"
                  >
                    Get chat to replay
                  </button>
                </div>
                <div className="form field">
                  <h3>or</h3>
                </div>
                <div className="form field">
                  <button
                    className="cta button"
                    onClick={this.fetchLocalTranscript}
                    type="button"
                  >
                    Replay a secretly recorded conversation
                  </button>
                </div>
              </Segment>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              {
                isEmpty(errorMessage)
                  ? null
                  : (
                    <Message negative>
                      {errorMessage}
                    </Message>
                  )
              }
              <Segment>
                <ChatReplay
                  transcript={transcript}
                  isLoading={isLoading}
                />
              </Segment>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column>
              <a
                href="https://github.com/yarunluon"
                rel="noopener noreferrer"
                target="_blank"
              >
                Yarun Luon
              </a>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container>
    );
  }
}

export default App;
