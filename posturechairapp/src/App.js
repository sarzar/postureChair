import logo from './logo.svg';
import './App.css';
import Home from "./components/Home"
import Posture from "./components/Posture"

function App() {
  return (
    <div className="App">
      <header className="App-header">
      <div className="logo-container">
              <img className = "logo" src ="postchairlogo.png"/>
          </div>
          
      <Posture/>
      </header>
    </div>
  );
}

export default App;
