import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa";
import { MdOutlineMail } from "react-icons/md";

const Sidebar = ({ isOpen }) => {
  const categories = ["전체", "React", "Vue", "JS & TS", "회고"];

  return (
    <div
      className={`w-64 bg-white shadow-md p-5 h-svh mt-16 fixed top-0 left-0 transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? "translate-x-0" : "-translate-x-64"
      }`}
    >
      <ul className="pl-5 flex-grow">
        {categories.map((category) => (
          <li key={category} className="py-2 hover:font-bold hover:cursor-pointer">
            <Link to={`/${category}`} className="text-gray-700 hover:text-black">
              {category}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex justify-start space-x-4 pl-5 mb-28 border-t pt-5">
        <MdOutlineMail className="w-6 h-6 mr-2 hover:cursor-pointer" />
        <FaGithub className="w-6 h-6 mr-2 hover:cursor-pointer" />
      </div>
    </div>
  );
};

export default Sidebar;
