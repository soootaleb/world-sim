import './App.css';
import React from 'react';
import { WSClient } from './client.bundle';
import { Badge, Tabs, Tab, Button, Navbar, NavDropdown, Container } from 'react-bootstrap';
import Content from './Content';
import Cli from './Cli';
import Logs from './Logs';
import Defaults from './Defaults';

export default class App extends React.Component {

  host = "localhost";
  // host = "163.172.140.233";
  port = 8080;

  constructor(props) {
    super(props);

    this.state = {
      tf: 20,
      pong: -1,
      run: false,
      watch: null,
      tick: 0,
      last: {},
      filters: {
        tree: true,
        ws: true,
        jack: true
      },
      data: {
        avg: {},
        qty: {}
      }
    };
  }

  ping = async () => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.ping();
      }).then((response) => {
        this.setState({
          pong: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  run = async () => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.run();
      }).then((response) => {
        this.setState({
          run: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  tick = async () => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.tick(1);
      }).then((response) => {
        this.setState({
          tick: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  create = async (type) => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.create(type, 4);
      }).then((response) => {
        // this.setState({
        //   tick: response.payload.payload
        // });
      }).catch((error) => console.error(error));
  };

  reset = async (type) => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.reset();
      }).then((response) => {
        this.setState({
          data: {
            avg: {},
            qty: {}
          }
        });
      }).catch((error) => console.error(error));
  };

  watch = async () => {
    if (!this.state.watch) {
      await new WSClient(this.host, this.port).co
        .then((client) => {
          client.listen("GetState", (message) => {
            this.setState({
              tick: message.payload.payload.tick,
              last: message.payload.payload.state,
              data: {
                qty: Object.keys(message.payload.payload.state.qty)
                  .reduce((acc, key) => {

                    acc[key] = [...(this.state.data.qty[key] || []), {
                      x: message.payload.payload.tick,
                      y: message.payload.payload.state.qty[key]
                    }].slice((this.state.data.qty[key] || []).length - 200);

                    return acc;
                  }, {}),
                avg: Object.keys(message.payload.payload.state.avg)
                  .reduce((acc, key) => {

                    acc[key] = [...(this.state.data.avg[key] || []), {
                      x: message.payload.payload.tick,
                      y: message.payload.payload.state.avg[key]
                    }].slice((this.state.data.avg[key] || []).length - 200);

                    return acc;
                  }, {})
              }
            });
          });

          this.setState({ watch: client });

          return client.watch();
        }).then((response) => {
          this.state.watch.disconnect();
          this.setState({ watch: null });
        }).catch((error) => console.error(error));
    } else {
      this.state.watch.disconnect();
      this.setState({ watch: null });
    }
  };

  stf = async (event) => {
    const tf = parseInt(event.target.value);
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.stfrequency(tf);
      }).then((response) => {
        this.setState({ tf: tf });
      }).catch((error) => console.error(error));
  };

  crash = async (event) => {
    await new WSClient(this.host, this.port).co
      .then((client) => {
        return client.crash();
      }).then((response) => {
        this.setState({ watch: null });
      }).catch((error) => console.error(error));
  };

  async componentDidMount() {

    new WSClient(this.host, this.port).co
      .then((client) => client.monget("/ddapps/node/state/ticksPerSecond/_value"))
      .then((response) => this.setState({ tf: response.payload.payload.metric.value }));

    await new WSClient(this.host, this.port).co
      .then((client) => {

        client.ws.onclose = () => {
          this.setState({ client: null });
          setTimeout(() => {
            this.componentDidMount();
          }, 1000);
        };

        this.setState({
          client: client,
          data: {
            avg: {},
            qty: {}
          }
        });

        this.watch();
      }).catch((error) => {
        this.setState({ client: null });
        setTimeout(() => {
          this.componentDidMount();
        }, 1000);
      });
  }

  show = (entity) => {
    // this.setState({
    //   filters: {
    //     ...this.state.filters,
    //     [entity]: !this.state.filters[entity]
    //   }
    // })
    this.state.filters[entity] = !this.state.filters[entity];
  };

  render() {
    return (
      <div className="App">
        <Navbar className="controls" bg="light" expand="lg">
          <Container>
            <span className="tf">
              <input className="tfinput" type="range" min="1" max="50" value={this.state.tf} onChange={this.stf} />
              {this.state.tf}
            </span>
            <Navbar.Brand href="#home">WorldSIM</Navbar.Brand>
            <Button onClick={this.crash} variant="danger">
              Crash
            </Button>
            <Button onClick={this.reset} variant="warning">
              Reset
            </Button>
            <Button onClick={this.run} variant={this.state.run ? 'danger' : 'success'}>
              {this.state.run ? 'Stop' : 'Start'}
            </Button>
            <Button onClick={this.watch} variant={this.state.watch ? 'success' : 'danger'}>
              Watch
            </Button>
            <Button onClick={this.tick} variant="primary">
              Tick {this.state.tick}
            </Button>
            <Cli host={this.host} port={this.port} />
            <NavDropdown title="Show/Hide" id="basic-nav-dropdown">
              <NavDropdown.Item>
                <Button onClick={() => this.show('ws')} variant={this.state.filters.ws ? 'success' : 'danger'}>WS</Button>
              </NavDropdown.Item>
              <NavDropdown.Item>
                <Button onClick={() => this.show('tree')} variant={this.state.filters.tree ? 'success' : 'danger'}>Tree</Button>
              </NavDropdown.Item>
              <NavDropdown.Item>
                <Button onClick={() => this.show('jack')} variant={this.state.filters.jack ? 'success' : 'danger'}>Jack</Button>
              </NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Add/Remove" id="basic-nav-dropdown">
              <NavDropdown.Item>
                <Button onClick={() => this.create('ws')} variant="primary">WS</Button>
              </NavDropdown.Item>
              <NavDropdown.Item>
                <Button onClick={() => this.create('tree')} variant="primary">Tree</Button>
              </NavDropdown.Item>
              <NavDropdown.Item>
                <Button onClick={() => this.create('jack')} variant="primary">Jack</Button>
              </NavDropdown.Item>
            </NavDropdown>
            <Badge pill onClick={this.ping} bg={this.state.client ? 'success' : 'danger'}>
              {this.state.client ? 'Connected' : 'Disconnected'}
              {this.state.client && this.state.pong > -1 ? ` ${this.state.pong}ms` : null}
            </Badge>
          </Container>
        </Navbar>
        <div className="tabs">
          <Tabs defaultActiveKey="logs" id="uncontrolled-tab-example" className="mb-3">
            <Tab eventKey="home" title="Home">
              home
            </Tab>
            <Tab eventKey="stats" title="Stats">
              <Content data={this.state.data} filters={this.state.filters}></Content>
            </Tab>
            <Tab eventKey="logs" title="Logs">
              <Logs host={this.host} port={this.port} />
            </Tab>
            <Tab eventKey="defaults" title="Defaults">
              <Defaults host={this.host} port={this.port} />
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}
