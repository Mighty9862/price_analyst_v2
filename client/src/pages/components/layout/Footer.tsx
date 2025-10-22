function Footer() {
  return (
    <footer className="border-t border-blue-100 bg-white/80 py-8 backdrop-blur-md">
      <div className="container mx-auto px-4 text-center">
        {/* Социальные сети */}
        <div className="mb-4 flex justify-center space-x-6">
          {/* Telegram */}
          <a
            href="https://t.me/cleansoul2025"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-gray-600 transition-colors duration-300 hover:text-blue-500"
            aria-label="Telegram"
          >
            <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.99987 15.2L9.84987 18.7C10.1499 18.7 10.2799 18.57 10.4399 18.41L11.8999 17.02L15.3399 19.54C15.9699 19.88 16.4199 19.7 16.5899 18.93L18.9599 7.81999C19.1899 6.87999 18.6199 6.48999 17.9999 6.72999L5.67987 11.4599C4.75987 11.83 4.77987 12.36 5.52987 12.59L8.67987 13.57L16.0399 8.99999C16.3899 8.79 16.7099 8.9 16.4499 9.13L9.99987 15.2Z" />
            </svg>
          </a>

          {/* Email */}
          <a
            href="mailto:info@cn-soul.ru"
            className="flex items-center justify-center text-gray-600 transition-colors duration-300 hover:text-red-500"
            aria-label="Email"
          >
            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </a>
        </div>

        <p className="text-md text-blue-600">
          © 2025 CleanSoul. Все права защищены.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
