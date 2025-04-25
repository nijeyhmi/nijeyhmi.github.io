import { FaGithub } from 'react-icons/fa';
import { MdOutlineMail } from 'react-icons/md';

const Sidebar = () => {
  const categories = ['전체', 'React', 'Vue', 'JS & TS', '회고'];
  const isOpen = true;

  return (
    <div
      className={`w-64 bg-white shadow-md p-5 h-svh mt-16 fixed top-0 left-0 transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-64'
      }`}
    >
      <ul className="pl-5 flex-grow">
        {categories.map((category) => (
          <li key={category} className="py-2 hover:font-bold hover:cursor-pointer">
            {category}
          </li>
        ))}
      </ul>
      <div className="flex justify-start space-x-4 pl-5 mb-28 border-t pt-5">
        <a href="mailto:nijeyhmi@gmail.com">
          <MdOutlineMail className="w-6 h-6 mr-2 hover:cursor-pointer" />
        </a>
        <a href="https://github.com/nijeyhmi" target="_blank" rel="noopener noreferrer">
          <FaGithub className="w-6 h-6 mr-2 hover:cursor-pointer" />
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
