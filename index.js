import ReactDOM from "./ReactDOM";
import React from "./React";

// ReactDOM.render(React.createElement("div", {
//     children: "Hello World"
// }), document.body)

class Main extends React.Component {
  onClick = event => {
    event.stopPropagation();
    event.persist();
    console.log(event)
  };
  render() {
    return (
      <div onClick={this.onClick} style={{ color: "red" }}>
        Coco
      </div>
    );
  }
}

class Child extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aha: "qwe"
    };
  }
  componentWillMount() {
  }
  render() {
    return <div>I am child - {this.state.aha}</div>;
  }
  componentDidMount() {
    console.log("did mount");
  }
}

class App extends React.Component {

  onClick = evtInApp => {
    console.log(evtInApp, " ------ ------ ");
    evtInApp.stopPropagation();
  };

  render() {
    return [
      <div onClickCapture={this.onClick}>
        Hello World! <Main />
      </div>,
      <Child />
    ];
  }
}

ReactDOM.render(<App aha />, document.getElementById("root"));
