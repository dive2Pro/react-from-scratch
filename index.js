import ReactDOM from "./ReactDOM";
import React from "./React";

// ReactDOM.render(React.createElement("div", {
//     children: "Hello World"
// }), document.body)

class App extends React.Component {
  render() {
    console.log('render')
    return <div>Hello World!</div>;
  }
}

ReactDOM.render(<App aha/>, document.body);
