export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="py-4 px-6 border-t border-[#DDD6CC] bg-white">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-text-muted text-center sm:text-left">
          &copy; {year} Danholmen Badstuer — Vestfold Båt og Utleie AS
        </p>
        <p className="text-[11px] text-text-muted">
          Org.nr: 927 033 062
        </p>
      </div>
    </footer>
  );
}
