import './Content.css';
import React from 'react';
import { XYPlot, ChartLabel, LineSeries, XAxis, YAxis, HorizontalGridLines } from 'react-vis';

export default class Content extends React.Component {

  render() {
    return (
      <div className="Content">
        {
          Object.entries(this.props.data.avg)
            .filter(([key, _value]) => {
              switch (true) {
                case key.includes('water'):
                  return this.props.filters.ws;
                case key.includes('tree'):
                  return this.props.filters.tree;
                case key.includes('jack'):
                  return this.props.filters.jack;
                case key.includes('exchange'):
                  return this.props.filters.exchange;
                default:
                  return true;
              }
            }).map(([key, values]) => {
              const max = Math.max(...values.map(v => v.y)) * 1.1;
              const min = Math.min(...values.map(v => v.y)) * 0.9;
              const delta = values[values.length - 1] - values[values.length - 2];
              const arr = [...values];
              const tail = arr.slice(arr.length * 0.9).reduce((acc, curr) => acc + curr.y, 0) / (arr.length * 0.1);
              const pretail = arr.slice(arr.length * 0.8, arr.length * 0.9).reduce((acc, curr) => acc + curr.y, 0) / (arr.length * 0.1);
              const diff = tail - pretail;
              return (
                <XYPlot key={`avg-${key}`} title={key} className="plot" yDomain={[min, max]} height={200} width={document.body.clientWidth * 0.20}>
                  <ChartLabel text={`${key} (${values[values.length-1].y})`} className="alt-x-label" includeMargin={false} xPercent={0.025} yPercent={1.01} />
                  <HorizontalGridLines />
                  <XAxis/>
                  <YAxis/>
                  <LineSeries color={Math.abs(diff) > 5 ? diff < 0 ? 'red' : 'lightgreen' : 'grey'} data={values} />
                </XYPlot>
              );
            })
        }
        <hr/>
        {
          Object.entries(this.props.data.qty)
            .filter(([key, _value]) => {
              switch (true) {
                case key.includes('water'):
                  return this.props.filters.ws;
                case key.includes('tree'):
                  return this.props.filters.tree;
                case key.includes('jack'):
                  return this.props.filters.jack;
                case key.includes('exchange'):
                  return this.props.filters.exchange;
                default:
                  return true;
              }
            }).map(([key, values]) => {
              const max = Math.max(...values.map(v => v.y)) * 1.1;
              const min = Math.min(...values.map(v => v.y)) * 0.9;
              return (
                <XYPlot key={`qty-${key}`} title={key} className="plot" yDomain={[min, max]} height={200} width={document.body.clientWidth * 0.20}>
                  <HorizontalGridLines />
                  <XAxis/>
                  <YAxis/>
                  <LineSeries data={values} />
                  <ChartLabel text={`${key} (${values[values.length-1].y})`} className="alt-x-label" includeMargin={false} xPercent={0.025} yPercent={1.01} />
                </XYPlot>
              );
            })
        }
      </div>
    );
  }
}
