import React, { createContext, useContext, useState, useCallback } from 'react';

interface DrawerContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DrawerContext = createContext<DrawerContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const DrawerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <DrawerContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = () => useContext(DrawerContext);
