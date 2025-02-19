import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostDetail";

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="flex">
          <Sidebar />
          <Routes>
            <Route path="/" element={<PostList />} />
            <Route path="/:categoryName" element={<PostList />} />
            <Route path="/:categoryName/:postId" element={<PostDetail />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
