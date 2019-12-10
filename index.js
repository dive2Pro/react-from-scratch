import ReactDOM from "./ReactDOM";
import React from "./React";

// ReactDOM.render(React.createElement("div", {
//     children: "Hello World"
// }), document.body)

class Main extends React.Component {
  render() {
    return <div style={{color: 'red'}}>Coco</div>;
  }
}

class Child extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aha: 'qwe'
    }
  }
  componentWillMount() {
    console.log("will Mount");
  }
  render() {
  return <div>I am child - {this.state.aha}</div>
  }
  componentDidMount() {
    console.log('did mount');
  }
}

class App extends React.Component {
  render() {
    return [
      <div>
        Hello World! <Main />{" "}
      </div>,
      <Child />
    ];
  }
}

ReactDOM.render(<App aha />, document.body);
