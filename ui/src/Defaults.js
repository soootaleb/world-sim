import './Defaults.css';
import React from 'react';
import { Accordion, Button } from 'react-bootstrap';

export default class Defaults extends React.Component {

  fetched = false

  constructor(props) {
    super(props);

    this.state = {
      defaults: {},
      values: {}
    };
  }

  async componentDidUpdate() {
    if (this.props.client && !this.fetched) {
      await this.props.client?.monget("/ddapps/node/state/defaults")
        .then((response) => {
          this.fetched = true
          this.setState({ defaults: response.payload.payload.metric.value });
          this.setState({ values: response.payload.payload.metric.value });
        }).catch((error) => {
          console.log("ERROR")
          this.setState({ defaults: {} });
          console.error(error);
          setTimeout(() => {
            this.fetched = false
            this.componentDidUpdate();
          }, 1000);
        });
    }
  }

  async commit(type, param) {
    await this.props.client.config(type, param, this.state.values[type][param]._value)
      .then((response) => {
        if (response.payload.payload.success) {
          document.getElementById(`${type}${param}`).style.color = "lightgreen";
        } else {
          document.getElementById(`${type}${param}`).style.color = "red";
        }
        setTimeout(() => {
          document.getElementById(`${type}${param}`).style.color = "inherit";
        }, 1000);
      })
      .catch(console.error);
  }

  config(type, param, value) {
    this.setState({
      values: {
        ...this.state.values,
        [type]: {
          ...this.state.values[type],
          [param]: {
            _value: value
          }
        }
      }
    });
  }

  refresh = async () => {
    await this.props.client?.monget("/ddapps/node/state/defaults")
      .then((response) => {
        this.fetched = true
        this.setState({ defaults: response.payload.payload.metric.value });
        this.setState({ values: response.payload.payload.metric.value });
      })
  };

  render() {
    return (
      <>
        <Button onClick={this.refresh} variant="primary">Refresh</Button>
        <hr/>
        <Accordion defaultActiveKey="0">
          {
            Object.keys(this.state.defaults).map((type) => {
              return (
                <Accordion.Item key={type} eventKey={type}>
                  <Accordion.Header>
                    <h3>{type.substring(0, 1).toUpperCase() + type.substring(1)}</h3>
                  </Accordion.Header>
                  <Accordion.Body>
                    {
                      Object.keys(this.state.defaults[type]).map((param) => {
                        return (
                          <div key={type + param} id={type + param} className="param">
                            <span className="paramlabel">{param}</span>
                            <input className="paramvalue" onChange={(ev) => this.config(type, param, parseFloat(ev.target.value) || 0)} type="number" min="-1" max="1" step="0.1" value={this.state.values[type][param]._value || 0}></input>
                            <Button onClick={() => this.commit(type, param)} >Commit</Button>
                          </div>
                        );

                      })
                    }
                  </Accordion.Body>
                </Accordion.Item>
              );
            })
          }
        </Accordion>
      </>
    );
  }
}
