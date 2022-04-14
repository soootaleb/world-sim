import './Cli.css';
import React from 'react';
import { WSClient } from './client.bundle';

export default class Cli extends React.Component {

  keypress = async (ev) => {
    if (ev.code === "Enter") {
      const args = ev.target.value.split(" ");
      await new WSClient(this.props.host, this.props.port).co
        .then((client) => {
          return client[args[0]](...args.slice(1));
        }).then((response) => {
          console.log(response)
          ev.target.value = "";
        }).catch((error) => {
          ev.target.value = "Failed";
          console.error(error);
        });
    }
  };

  render() {
    return (
      <div className="Cli">
        <input onKeyDown={this.keypress} className="input" placeholder="Type CLI commands" />
      </div>
    );
  }
}
