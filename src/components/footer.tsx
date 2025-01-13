export const screenFooter = (
  <div className="text-center text-sm text-gray-600 mx-auto max-w-2xl p-4 footer">
    made with love and{" "}
    <a
      href="https://github.com/jkingsman/MileTime.me"
      target="_blank"
      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
    >
      open source
    </a>{" "}
    by{" "}
    <a
      href="https://jacksbrain.com"
      target="_blank"
      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
    >
      Jack Kingsman
    </a>
    .
    <br />
    this site is free, and ad-free, forever;{" "}
    <a
      href="https://ko-fi.com/jackkingsman"
      target="_blank"
      className="text-blue-600 hover:text-blue-800 transition-colors duration-200 underline decoration-gray-300 hover:decoration-blue-800"
    >
      donations to help offset server costs
    </a>{" "}
    are much appreciated :)
  </div>
);

export const printFooter = (
  <div className="text-center text-sm text-gray-600 mx-auto max-w-2xl p-4 footer-print-visible">
    from MileTime.me, made with love and open source by Jack Kingsman
  </div>
);
