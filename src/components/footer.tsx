export const screenFooter = (
  <div className="footer mx-auto max-w-2xl p-4 text-center text-sm text-gray-600">
    made with love and{' '}
    <a
      href="https://github.com/jkingsman/MileTime.me"
      target="_blank"
      className="text-blue-600 underline decoration-gray-300 transition-colors duration-200 hover:text-blue-800 hover:decoration-blue-800"
    >
      open source
    </a>{' '}
    by{' '}
    <a
      href="https://jacksbrain.com"
      target="_blank"
      className="text-blue-600 underline decoration-gray-300 transition-colors duration-200 hover:text-blue-800 hover:decoration-blue-800"
    >
      jack kingsman
    </a>
    <br />
    this site is free, and ad-free, forever;{' '}
    <a
      href="https://ko-fi.com/jackkingsman"
      target="_blank"
      className="text-blue-600 underline decoration-gray-300 transition-colors duration-200 hover:text-blue-800 hover:decoration-blue-800"
    >
      donations to help offset server costs
    </a>{' '}
    are much appreciated :)
  </div>
);

export const printFooter = (
  <div className="footer-print-visible mx-auto max-w-2xl p-4 text-center text-sm text-gray-600">
    from MileTime.me, made with love and open source by jack kingsman
  </div>
);
