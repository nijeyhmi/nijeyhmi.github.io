const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-gray-100 py-6 mt-10">
      <div className="container mx-auto flex flex-col items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} nijeyhmi's Blog. All rights
          reserved.
        </p>
        <button
          onClick={scrollToTop}
          className="absolute right-4 bottom-[-6rem] w-10 h-10 border text-slate-300 rounded-full shadow-md flex items-center justify-center focus:outline-none"
        >
          ⬆
        </button>
      </div>
    </div>
  );
};

export default Footer;
