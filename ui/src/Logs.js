import './Logs.css';
import React from 'react';
import { Accordion, ButtonGroup, Button, ToggleButton } from 'react-bootstrap';


export default class Logs extends React.Component {

  connected;

  constructor(props) {
    super(props);

    this.state = {
      follow: true,
      logs: [],
      level: "full"
    };
  }


  filter = (message) => {
    if (this.state.level === "partial") {
      return this.isIOMessage(message) || this.isErrorLog(message.payload.payload.value);
    } else if (this.state.level === "io") {
      return this.isIOMessage(message);
    } else if (this.state.level === "errors") {
      return this.isErrorLog(message.payload.payload.value);
    } else {
      return true;
    }
  };

  isErrorLog(log) {
    if (log.type === "LogMessage") {
      return log.payload.message.includes("Error")
        || log.payload.message.includes("Invalid")
        || log.payload.message.includes("Fail");
    } else {
      return false;
    }
  }

  isIOMessage(message) {
    if (message.type === "ClientNotification") {
      const source = message.payload.payload.value.source;
      const destination = message.payload.payload.value.destination;
      return !/[a-z]+/g.test(source) || !/[a-z]+/g.test(destination);
    } else {
      return false;
    }
  }

  async componentDidUpdate() {
    if (this.props.client && !this.connected) {
      this.connected = true
      this.setState({ logs: [] });
      
      await this.props.client?.listen("MonWatch", (message) => {
        if (this.state.follow && this.filter(message)) {
          const logs = [...this.state.logs, message];
          this.setState({
            logs: logs
          });
        }
      });
      
      await this.props.client.monwatch("/ddapps/node/logs");
    }
  }

  render() {
    return (
      <div>
        <ToggleButton
          id="toggle-check"
          type="checkbox"
          variant={this.state.follow ? "success" : "danger"}
          checked={this.state.follow}
          value="1"
          onChange={(e) => this.setState({ follow: e.currentTarget.checked })}
        >
          Follow
        </ToggleButton>
        <Button onClick={() => this.setState({ logs: [] })} variant="warning">Flush</Button>
        <ButtonGroup aria-label="Basic example">
          <Button onClick={() => this.setState({ level: "errors" })} variant={this.state.level === "errors" ? "primary" : "secondary"}>Errors</Button>
          <Button onClick={() => this.setState({ level: "io" })} variant={this.state.level === "io" ? "primary" : "secondary"}>I/O</Button>
          <Button onClick={() => this.setState({ level: "partial" })} variant={this.state.level === "partial" ? "primary" : "secondary"}>Partial</Button>
          <Button onClick={() => this.setState({ level: "full" })} variant={this.state.level === "full" ? "primary" : "secondary"}>Full</Button>
        </ButtonGroup>
        <Accordion className="Logs">
          {
            this.state.logs.map((notification, index) => {
              const log = notification.payload.payload.value;
              return (
                <Accordion.Item eventKey={notification.payload.timestamp + index + notification.payload.token} key={index} className="log">
                  <Accordion.Header>
                    <div className="header">
                      <span className="headerlabel" style={{
                        color: /[a-z]+/g.test(log.source) ? 'inherit' : 'rgb(0, 189, 0)'
                      }} >{log.source}</span>
                      <span className="headerlabel" style={{
                        color: /[a-z]+/g.test(log.destination) ? 'inherit' : 'blue'
                      }} >{log.destination}</span>
                      <span className="headerlabel-2" style={{
                        color: log.type === "LogMessage" && this.isErrorLog(log) ? 'red' : 'inherit'
                      }}>
                        {log.type === "LogMessage" ? `${log.payload.message.substring(0, 100)}` : log.type}
                      </span>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                  </Accordion.Body>
                </Accordion.Item>
              );
            })
          }
        </Accordion>
      </div>
    );
  }
}
