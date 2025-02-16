import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Main from "./pages/Main";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import PostList from "./pages/PostList";
function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="flex">
          <Sidebar />
          <Main />
        </div>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/category/:categoryName" element={<PostList />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
