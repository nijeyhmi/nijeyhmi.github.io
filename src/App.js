import Main from "./pages/Main";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
function App() {
  return (
    <div className="App">
      <Header />
      <Sidebar />
      <Main />
      <Footer />
    </div>
  );
}

export default App;
