// Deshabilitar Console Ninja durante las pruebas
process.env.CONSOLE_NINJA = 'disabled';

// Disable Console Ninja for tests to avoid SIGABRT/OOM
process.env.CONSOLE_NINJA_IGNORE = 'true';

// Silenciar warnings de Console Ninja
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('Console Ninja') ||
      message.includes('console-ninja') ||
      message.includes('wallabyjs'))
  ) {
    return; // Ignorar warnings de Console Ninja
  }
  originalConsoleWarn(...args);
};
