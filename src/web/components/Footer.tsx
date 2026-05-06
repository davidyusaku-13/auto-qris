export function Footer() {
  return (
    <footer className="border-t-3 border-black dark:border-white bg-brutal-yellow dark:bg-brutal-dark mt-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 text-center space-y-1">
        <p className="text-sm font-bold text-black dark:text-white">
          Made by{" "}
          <a
            href="https://github.com/verssache"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-3 underline-offset-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-1 transition-colors"
          >
            Gidhan
          </a>
        </p>
        <p className="text-xs font-medium text-black/70 dark:text-white/70">
          QRIS is a standardized QR Code payment system by Bank Indonesia
        </p>
      </div>
    </footer>
  );
}
