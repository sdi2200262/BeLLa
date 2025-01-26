import React from 'react';
import './Navigation.css';

interface BreadcrumbProps {
  items: {
    label: string;
    href?: string;
  }[];
}

const BreadcrumbItem = ({ label, href }: { label: string; href?: string }) => {
  if (!href) {
    return <span className="breadcrumb-item">{label}</span>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use history API for smooth navigation
    window.history.pushState({}, '', href);
    // Dispatch a popstate event to trigger route update
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <a href={href} className="breadcrumb-item" onClick={handleClick}>
      {label}
    </a>
  );
};

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => (
  <nav className="page-breadcrumb">
    {items.map((item, index) => (
      <BreadcrumbItem key={index} label={item.label} href={item.href} />
    ))}
  </nav>
);

export default Breadcrumb;
