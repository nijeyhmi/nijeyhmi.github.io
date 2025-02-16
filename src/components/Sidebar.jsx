import { Link } from "react-router-dom";
const Sidebar = () => {
  const categories = ["회고", "React", "Vue", "JS", "TS", "Etc"];
  return (
    <div className="w-64 h-screen py-4 overflow-y-auto">
      <ul className="pl-10">
        {categories.map((category) => (
          <li
            key={category}
            className="py-2 hover:font-bold hover:cursor-pointer"
          >
            <Link
              to={`/category/${category}`}
              className="text-gray-700 hover:text-black"
            >
              {category}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
