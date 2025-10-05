import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-primary/20 dark:border-primary/30 px-6 py-3">
      <div className="flex items-center gap-4 text-slate-900 dark:text-white">
        <div className="h-8 w-8 text-primary">
          <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor"></path>
          </svg>
        </div>
        <h1 className="text-lg font-bold">City Insights</h1>
      </div>
      <nav className="hidden items-center gap-6 md:flex">
        <button className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary">Inicio</button>
        <button className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary">Explorar</button>
        <button className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary">Acerca de</button>
      </nav>
      <div className="flex items-center gap-4">
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-slate-600 dark:text-slate-300 hover:bg-primary/20 dark:hover:bg-primary/30">
          <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M140,180a12,12,0,1,1-12-12A12,12,0,0,1,140,180ZM128,72c-22.06,0-40,16.15-40,36v4a8,8,0,0,0,16,0v-4c0-11,10.77-20,24-20s24,9,24,20-10.77,20-24,20a8,8,0,0,0-8,8v8a8,8,0,0,0,16,0v-.72c18.24-3.35,32-17.9,32-35.28C168,88.15,150.06,72,128,72Zm104,56A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"></path>
          </svg>
        </button>
        <div className="h-10 w-10 rounded-full bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAw-K9WesDrNK88pfDS28jnu2inDsO3vQNzvZQDwkMkGq8EF_zO0NxlrRE2NBTCY2A5JzCAWHNpyLMAKeI9v80yYM9nX0Tm7pjXq5Vc3Plj2YnIidMjFOD5BbI3zf5beMPhcMSCJfledcV79hpNY8kFwVhRPTidCRq-k_lJ7AcLGjKNg_Zsy6oduj5QrIejScRYgKhm9vpBA71sEZr-JW-AA50yefck0ew9mANTo7V_hZZ5XUWF61c2uIOVR4G6remQnab3HwMEmD63")' }} />
      </div>
    </header>
  );
}

export default Header;
