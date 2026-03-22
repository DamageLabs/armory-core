import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Welcome from './Welcome';

describe('Welcome', () => {
  it('renders the SVG logo', () => {
    render(<Welcome />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(screen.getByText('Armory')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Welcome />);
    const link = screen.getByRole('link', { name: /view on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/DamageLabs/armory-core');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders the description text', () => {
    render(<Welcome />);
    expect(screen.getByText(/complete firearm management system/)).toBeInTheDocument();
    expect(screen.getByText(/accountability engine/)).toBeInTheDocument();
  });
});
