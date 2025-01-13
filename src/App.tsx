import "./App.css";
import { printFooter, screenFooter } from "./components/footer";
import PaceCalculator from "./components/pace-calculator";

function App() {
  return (
    <>
      <a className="hidden md:block github-fork-ribbon" target="_blank" href="https://github.com/jkingsman/MileTime.me" data-ribbon="Fork me on GitHub" title="Fork me on GitHub">Fork me on GitHub</a>
      <PaceCalculator />
      {screenFooter}
      {printFooter}
    </>
  );
}

export default App;
