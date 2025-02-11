const Sidebar = () => {
  return (
    <div className="w-64 h-screen py-4">
      <ul className="pl-10">
        <li className="py-2 hover:font-bold hover:cursor-pointer">Home</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">회고</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">React</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">Vue</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">JS</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">TS</li>
        <li className="py-2 hover:font-bold hover:cursor-pointer">Etc</li>
      </ul>
    </div>
  );
};

export default Sidebar;
