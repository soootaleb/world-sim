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
  port = 8080;

  constructor(props) {
    super(props);

    this.state = {
      tf: 20,
      pong: -1,
      run: false,
      watch: false,
      tick: 0,
      client: null,
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
    await this.state.client.ping()
      .then((response) => {
        this.setState({
          pong: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  run = async () => {
    await this.state.client.run()
      .then((response) => {
        this.setState({
          run: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  tick = async () => {
    await this.state.client.tick(1)
      .then((response) => {
        this.setState({
          tick: response.payload.payload
        });
      }).catch((error) => console.error(error));
  };

  create = async (type) => {
    await this.state.client.create(type, 4)
      .then((response) => {
      }).catch((error) => console.error(error));
  };

  reset = async (type) => {
    await this.state.client.reset()
      .then((response) => {
        this.setState({
          data: {
            avg: {},
            qty: {}
          }
        });
      }).catch((error) => console.error(error));
  };

  watch = async (client) => {
    if (this.state.watch) {
      await (this.state.client || client).unwatch();
      this.setState({ watch: false });
    } else {
      (this.state.client || client).listen("GetState", (message) => {
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

      await (this.state.client || client).watch();

      this.setState({ watch: true });
    }
  };

  stf = async (event) => {
    const tf = parseInt(event.target.value);
    await this.state.client.stfrequency(tf)
      .then((response) => {
        this.setState({ tf: tf });
      }).catch((error) => console.error(error));
  };

  crash = async (event) => {
    await this.state.client.crash()
      .then((_response) => {
        this.setState({ watch: null });
      }).catch((error) => console.error(error));
  };

  show = (entity) => {
    this.setState({
      filters: {
        ...this.state.filters[entity],
        [entity]: !this.state.filters.entity
      }
    });
  };

  async componentDidMount() {

    if (!this.mounted) {
      this.mounted = true
      const client = await new WSClient(this.host, this.port).co;
      client.keepalive();
  
      await client.monget("/ddapps/node/state/ticksPerSecond/_value")
        .then((response) => this.setState({ tf: response.payload.payload.metric.value }));
  
      client.ws.onclose = () => {
  
        setTimeout(() => {
          this.componentDidMount();
        }, 1000);
  
        this.setState({
          client: null,
          data: {
            avg: {},
            qty: {}
          }
        });
      };
  
      await this.watch(client);
      this.setState({ client: client });
  
    }

  }

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
              <Content client={this.state.client} data={this.state.data} filters={this.state.filters}></Content>
            </Tab>
            <Tab eventKey="logs" title="Logs">
              <Logs client={this.state.client} />
            </Tab>
            <Tab eventKey="defaults" title="Defaults">
              <Defaults client={this.state.client} />
            </Tab>
          </Tabs>
        </div>
      </div>
    );
  }
}
