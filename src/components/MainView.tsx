import React from 'react';

const MainView: React.FC = () => {
  return (
    <main className="flex-1 overflow-y-auto p-4">
      <div className="relative h-full w-full min-h-[400px] rounded-xl bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCFjk05iSUsT0P10Vp9dH6WlhpDQKhEYuYd4k3ZqsFgB9u1Rz8hiRZFoTlkZPCE1w6FLKHi9CB_vJc9sThRUvheYMno6NuAExc050cmC-U-V_S0RUtWtNLhEoMuIVHybcJS93KSrjzWxye9sLm7oXzPIPFtj1Xa_8w6VWtL5FPgdSxrbiV7Q4SNvbvBopTaLQbHcgJ7-QNPGAk6sBlBIfQSzkq3zCQP_8KrvuWR-vreyMhGoT47rcktPwddA3kXhxB7Ur1oCfyn9ExY")' }}>
        <div className="absolute top-4 left-4 w-full max-w-sm">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-slate-400" fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
            </div>
            <input className="w-full rounded-full border-transparent bg-background-light/80 dark:bg-background-dark/80 py-2 pl-10 pr-4 text-slate-900 dark:text-white backdrop-blur-sm focus:border-primary focus:ring-primary" placeholder="Buscar ubicación..." type="text" />
          </div>
        </div>
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
          <div className="flex flex-col rounded-lg bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm shadow-lg">
            <button className="flex h-10 w-10 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-t-lg">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>
            </button>
            <button className="flex h-10 w-10 items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-b-lg">
              <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M224,128a8,8,0,0,1-8,8H40a8,8,0,0,1,0-16H216A8,8,0,0,1,224,128Z"></path></svg>
            </button>
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-light/80 dark:bg-background-dark/80 text-slate-600 dark:text-slate-300 shadow-lg hover:bg-primary/10 dark:hover:bg-primary/20">
            <svg fill="currentColor" height="24" viewBox="0 0 256 256" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M229.33,98.21,53.41,33l-.16-.05A16,16,0,0,0,32.9,53.25a1,1,0,0,0,.05.16L98.21,229.33A15.77,15.77,0,0,0,113.28,240h.3a15.77,15.77,0,0,0,15-11.29l23.56-76.56,76.56-23.56a16,16,0,0,0,.62-30.38ZM224,113.3l-76.56,23.56a16,16,0,0,0-10.58,10.58L113.3,224h0l-.06-.17L48,48l175.82,65.22.16.06Z"></path></svg>
          </button>
        </div>
      </div>
    </main>
  );
}

export default MainView;
