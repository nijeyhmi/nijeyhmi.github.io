import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import PostList from "./pages/PostList";
import PostDetail from "./pages/PostDetail";
import { useState } from "react";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <Router>
      <div className="App">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-col flex-1 h-svh">
          <Sidebar isOpen={isSidebarOpen} />
          <div className="flex-1 overflow-y-auto p-6 mt-16">
            <Routes>
              <Route path="/" element={<PostList />} />
              <Route path="/:categoryName" element={<PostList isSidebarOpen={isSidebarOpen} />} />
              <Route path="/:categoryName/:postId" element={<PostDetail />} />
            </Routes>
          </div>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
