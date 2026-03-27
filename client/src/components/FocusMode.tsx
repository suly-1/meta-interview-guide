/**
 * FocusMode — Context/hook that hides non-essential UI when active
 * Provides a toggle button and a context for other components to check.
 */
import { createContext, useContext, useState, useEffect } from "react";
import { Focus, Minimize2 } from "lucide-react";

interface FocusModeContextType {
  isFocused: boolean;
  toggleFocus: () => void;
}

const FocusModeContext = createContext<FocusModeContextType>({
  isFocused: false,
  toggleFocus: () => {},
});

export function FocusModeProvider({ children }: { children: React.ReactNode }) {
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) {
      document.body.classList.add("focus-mode");
    } else {
      document.body.classList.remove("focus-mode");
    }
    return () => document.body.classList.remove("focus-mode");
  }, [isFocused]);

  const toggleFocus = () => setIsFocused(prev => !prev);

  return (
    <FocusModeContext.Provider value={{ isFocused, toggleFocus }}>
      {children}
    </FocusModeContext.Provider>
  );
}

export function useFocusMode() {
  return useContext(FocusModeContext);
}

export function FocusModeToggle() {
  const { isFocused, toggleFocus } = useFocusMode();

  return (
    <button
      onClick={toggleFocus}
      title={isFocused ? "Exit Focus Mode" : "Enter Focus Mode (hides non-essential UI)"}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
        isFocused
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
      }`}
    >
      {isFocused ? <Minimize2 size={14} /> : <Focus size={14} />}
      {isFocused ? "Exit Focus" : "Focus Mode"}
    </button>
  );
}

/**
 * Wrap any element with this to hide it in focus mode
 */
export function HideInFocusMode({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { isFocused } = useFocusMode();
  if (isFocused) return null;
  return <div className={className}>{children}</div>;
}

export default FocusModeToggle;
