const Footer = () => {
  return (
    <footer className="w-full bg-white h-[59px] flex justify-center items-center border-t border-gray-100">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} nijeyhmi's Blog. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
