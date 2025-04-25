import { CiLight } from 'react-icons/ci';
import { HiHashtag } from 'react-icons/hi2';
import { IoIosSearch } from 'react-icons/io';
const Header = () => {
  return (
    <div className="w-[50%] h-16 flex justify-between items-center px-6 fixed top-0 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center">
        <a href="/">
          <h2 className="text-xl font-bold">HYELOG</h2>
        </a>
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
