import React from 'react';
import './Navigation.css';

interface NavItem {
  label: string;
  href?: string;
  indent?: boolean;
}

interface NavTreeProps {
  items: NavItem[];
}

const NavTreeItem = ({ label, href, indent }: NavItem) => {
  if (!href) {
    return (
      <span className="nav-link">
        {indent ? '└─ ' : ''}{label}
      </span>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <a href={href} className="nav-link" onClick={handleClick}>
      {indent ? '└─ ' : ''}{label}
    </a>
  );
};

const NavTree: React.FC<NavTreeProps> = ({ items }) => (
  <nav className="nav-tree-center">
    {items.map((item, index) => (
      <div key={index} className={`nav-item ${item.indent ? 'nav-indent' : ''}`}>
        <NavTreeItem {...item} />
      </div>
    ))}
  </nav>
);

export default NavTree; 