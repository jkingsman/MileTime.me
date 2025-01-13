import "./App.css";
import { printFooter, screenFooter } from "./components/footer";
import PaceCalculator from "./components/pace-calculator";

function App() {
  return (
    <div className="w-full max-w-full space-y-4">
      <PaceCalculator />
      {screenFooter}
      {printFooter}
    </div>
  );
}

export default App;
