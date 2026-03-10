import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders application name', () => {
    render(<Footer />);

    expect(screen.getByText('Armory Core - Firearms Inventory Management System')).toBeInTheDocument();
  });

  it('renders GitHub link with correct attributes', () => {
    render(<Footer />);

    const githubLink = screen.getByText('View on GitHub');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/DamageLabs/armory-core');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
