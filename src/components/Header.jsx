import { Link } from "react-router-dom";
import { RxHamburgerMenu } from "react-icons/rx";
import { CiLight } from "react-icons/ci";
import { HiHashtag } from "react-icons/hi2";
import { IoIosSearch } from "react-icons/io";
const Header = ({ toggleSidebar }) => {
  return (
    <div className="w-full h-16 flex justify-between items-center px-10 shadow-sm shadow-b fixed top-0 right-0 z-10">
      <div className="flex items-center">
        <RxHamburgerMenu className="w-6 h-6 mr-4 hover:cursor-pointer" onClick={toggleSidebar} />
        <Link to={`/`} className="hover:text-gray-800">
          <h2 className="text-xl font-bold">HYELOG</h2>
        </Link>
      </div>
      <div className="flex items-center">
        <CiLight className="w-7 h-7 mr-2 hover:cursor-pointer" />
        <HiHashtag className="w-6 h-6 mr-2 hover:cursor-pointer" />
        <IoIosSearch className="w-7 h-7  hover:cursor-pointer" />
      </div>
    </div>
  );
};

export default Header;
