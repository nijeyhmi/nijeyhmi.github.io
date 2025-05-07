import { CiLight } from "react-icons/ci";

const Header = () => {
  return (
    <nav className="w-full h-[60px] sticky top-0 left-0 bg-white">
      <div className="max-w-[1140px] w-full h-full m-auto">
        <div className="w-[92%] h-full flex mx-auto">
          <div className="m-r-[24px] flex items-center">
            <a href="/">
              <h2 className="text-xl font-bold">NHYELOG</h2>
            </a>
          </div>
          <div className="flex flex-1 max-h-full justify-end">
            <ul className="flex items-center p-0 m-0">
              <li className="hover:cursor-pointer py-0 px-[8px] h-full flex items-center">
                <CiLight className="w-7 h-7 hover:cursor-pointer" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
