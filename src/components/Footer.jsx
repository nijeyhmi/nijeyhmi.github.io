const Footer = () => {
  return (
    <div className="w-full bg-white overflow-hidden h-[59px] flex justify-center items-center">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} nijeyhmi's Blog. All rights reserved.
      </p>
    </div>
  );
};

export default Footer;
