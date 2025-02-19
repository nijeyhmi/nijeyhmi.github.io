import { Link } from "react-router-dom";
const Header = () => {
  return (
    <div className="w-full h-[44px] flex justify-between items-center px-10">
      <div>
        <Link to={`/`} className="text-gray-700 hover:text-black">
          <h2 className="text-lg font-bold">nijeyhmi</h2>
        </Link>
      </div>
      <div className="flex">
        <div className="pr-2 border-r">portfolio</div>
        <div className="pl-2">github</div>
      </div>
    </div>
  );
};

export default Header;
