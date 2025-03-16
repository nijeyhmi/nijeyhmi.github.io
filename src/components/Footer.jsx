const Footer = () => {
  const scrollToTop = () => {
    const postListContainer = document.querySelector(".overflow-y-auto");
    if (postListContainer) {
      postListContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-white shadow-md px-6 fixed bottom-0 right-0 z-10 bg-gray-100 py-2">
      <div className="container mx-auto flex flex-col items-center">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} nijeyhmi's Blog. All rights
          reserved.
        </p>
        <button
          onClick={scrollToTop}
          className="absolute right-4 bottom-[3rem] w-10 h-10 border text-gray-300 rounded-full shadow-md flex items-center justify-center focus:outline-none"
        >
          ⬆
        </button>
      </div>
    </div>
  );
};

export default Footer;
