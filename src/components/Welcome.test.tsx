import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Welcome from './Welcome';

describe('Welcome', () => {
  it('renders the logo text', () => {
    render(<Welcome />);
    expect(screen.getByText('AC')).toBeInTheDocument();
  });

  it('renders the project title', () => {
    render(<Welcome />);
    expect(screen.getByText('Armory Core')).toBeInTheDocument();
  });

  it('renders the GitHub link', () => {
    render(<Welcome />);
    const link = screen.getByRole('link', { name: /view on github/i });
    expect(link).toHaveAttribute('href', 'https://github.com/DamageLabs/armory-core');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders the project status section', () => {
    render(<Welcome />);
    expect(screen.getByText('Project Status')).toBeInTheDocument();
  });
});
