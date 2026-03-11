import { Link } from 'react-router-dom';
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react';
import { FaHome } from 'react-icons/fa';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <CBreadcrumb className="mb-3">
      <CBreadcrumbItem>
        <Link to="/">
          <FaHome className="me-1" aria-hidden="true" />
          <span className="visually-hidden">Home</span>
        </Link>
      </CBreadcrumbItem>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <CBreadcrumbItem key={index} active={isLast}>
            {!isLast && item.path ? (
              <Link to={item.path}>{item.label}</Link>
            ) : (
              item.label
            )}
          </CBreadcrumbItem>
        );
      })}
    </CBreadcrumb>
  );
}
