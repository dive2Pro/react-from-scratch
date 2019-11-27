import ReactDOM from "./ReactDOM";
import React from "./React";

// ReactDOM.render(React.createElement("div", {
//     children: "Hello World"
// }), document.body)

class Main extends React.Component {
  render() {
    return <div>Coco</div>
  }
}

class App extends React.Component {
  render() {
    return <div>Hello World! <Main /> </div>;
  }
}

ReactDOM.render(<App aha/>, document.body);
