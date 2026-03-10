import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RestoreBackup from './RestoreBackup';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';

vi.mock('../../services/itemService');
vi.mock('../../services/inventoryTypeService');
vi.mock('../../contexts/AlertContext', () => ({
  useAlert: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

const mockTypes = [
  { id: 1, name: 'Firearms', icon: 'gun', schema: [], createdAt: '', updatedAt: '' },
  { id: 2, name: 'Ammunition', icon: 'bullet', schema: [], createdAt: '', updatedAt: '' },
];

function createFile(content: string, name: string) {
  const file = new File([content], name, { type: name.endsWith('.json') ? 'application/json' : 'text/csv' });
  file.text = () => Promise.resolve(content);
  return file;
}

describe('RestoreBackup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(inventoryTypeService.getAllTypes).mockResolvedValue(mockTypes);
  });

  it('renders upload form in idle state', () => {
    render(<RestoreBackup />);
    expect(screen.getByText('Restore from Backup')).toBeInTheDocument();
    expect(screen.getByText(/Upload a JSON or CSV backup file/)).toBeInTheDocument();
  });

  it('shows preview after uploading a valid JSON file', async () => {
    render(<RestoreBackup />);
    const jsonContent = JSON.stringify([
      { name: 'Glock 19', quantity: 1, unitValue: 550, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/1 items found/)).toBeInTheDocument();
    });
    expect(screen.getByText('Glock 19')).toBeInTheDocument();
  });

  it('shows preview after uploading a valid CSV file', async () => {
    render(<RestoreBackup />);
    const csv = `Name,Quantity,Unit Value,Category,Inventory Type ID\nAR-15,1,1200,Rifles,1`;
    const file = createFile(csv, 'backup.csv');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/1 items found/)).toBeInTheDocument();
    });
    expect(screen.getByText('AR-15')).toBeInTheDocument();
  });

  it('shows invalid badge for items with validation errors', async () => {
    render(<RestoreBackup />);
    const jsonContent = JSON.stringify([
      { name: '', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
      { name: 'Valid Item', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('1 invalid')).toBeInTheDocument();
    });
  });

  it('shows cancel button to return to idle state', async () => {
    render(<RestoreBackup />);
    const jsonContent = JSON.stringify([
      { name: 'Item', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText(/Upload a JSON or CSV backup file/)).toBeInTheDocument();
  });

  it('shows replace mode warning', async () => {
    render(<RestoreBackup />);
    const jsonContent = JSON.stringify([
      { name: 'Item', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Restore Mode')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'replace' } });
    expect(screen.getByText(/Replace mode will delete all existing items/)).toBeInTheDocument();
  });

  it('restores items and shows results', async () => {
    vi.mocked(itemService.bulkCreateItems).mockResolvedValue({ created: 2, idMapping: {} });
    render(<RestoreBackup />);

    const jsonContent = JSON.stringify([
      { name: 'Item A', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
      { name: 'Item B', quantity: 2, unitValue: 20, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Restore 2 Items')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Restore 2 Items'));

    await waitFor(() => {
      expect(screen.getByText('Restore Complete')).toBeInTheDocument();
    });
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText('Restore Another Backup')).toBeInTheDocument();
  });

  it('disables restore button when no valid items', async () => {
    render(<RestoreBackup />);
    const jsonContent = JSON.stringify([
      { name: '', quantity: 1, unitValue: 10, inventoryTypeId: 1 },
    ]);
    const file = createFile(jsonContent, 'backup.json');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('Restore 0 Items')).toBeInTheDocument();
    });
    expect(screen.getByText('Restore 0 Items')).toBeDisabled();
  });
});
