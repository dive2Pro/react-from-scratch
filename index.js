import ReactDOM from "./ReactDOM";
import React from "./React";

// ReactDOM.render(React.createElement("div", {
//     children: "Hello World"
// }), document.body)

class Main extends React.Component {
  constructor() {
    super();
    this.state = {
      count: 1
    };
  }
  onClick = event => {
    event.stopPropagation();
    event.persist();
    this.setState({});
  };

  componentDidMount() {
    setTimeout(() => {
      // this.setState({
      //   count: this.state.count + 1
      // });
    }, 1000);
  }
  render() {
    return (
      <div onClick={this.onClick} style={{ color: "red" }}>
        Coco - {this.state.count}
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
  componentWillMount() {}
  render() {
    return (
      <div>
        <Main />I am child - {this.state.aha}
      </div>
    );
  }
  componentDidMount() {
    console.log("did mount");
  }
}

class App extends React.Component {
  state = {
    text: 1
  };

  onClick = evtInApp => {
    evtInApp.stopPropagation();
    this.setState({
      text: this.state.text + 1
    });
  };

  render() {
    return (
      <div onClickCapture={this.onClick}>
        {/*<Child />*/}
        {this.state.text}
        {/*<Child />*/}
      </div>
    );
  }
}

ReactDOM.render(<App aha />, document.getElementById("root"));
