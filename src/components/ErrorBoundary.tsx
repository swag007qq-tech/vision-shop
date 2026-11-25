import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, message: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {hasError: true, message: error.message || 'Произошла непредвиденная ошибка'};
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-white text-[#141414] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-[28px] border-[2px] border-[#141414] bg-white p-6 text-center shadow-xl space-y-4">
            <h1 className="text-[22px] font-extrabold">Ошибка подключения к базе данных</h1>
            <p className="text-[14px] font-medium text-neutral-600 break-words">
              Проверьте права доступа или перезагрузите страницу.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-full bg-[#141414] text-white text-[14px] font-bold hover:bg-black cursor-pointer"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
