import "./App.css";
import { printFooter, screenFooter } from "./components/footer";
import PaceCalculator from "./components/pace-calculator";

function App() {
  return (
    <div className="screen:m-2">
      <PaceCalculator />
      {screenFooter}
      {printFooter}
    </div>
  );
}

export default App;
