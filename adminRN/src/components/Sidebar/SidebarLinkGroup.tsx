import { ReactNode, useState, useCallback } from 'react';

interface SidebarLinkGroupProps {
  children: (handleClick: () => void, open: boolean) => ReactNode;
  activeCondition: boolean;
}

const SidebarLinkGroup = ({ children, activeCondition }: SidebarLinkGroupProps) => {
  const [open, setOpen] = useState(activeCondition);

  const handleClick = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return <li className="group">{children(handleClick, open)}</li>;
};

export default SidebarLinkGroup;
