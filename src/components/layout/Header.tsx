import React from 'react';
import { FloatingNav, FloatingNavProps } from './FloatingNav';

export interface HeaderProps extends FloatingNavProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = (props) => {
  return <FloatingNav {...props} />;
};

export default Header;
