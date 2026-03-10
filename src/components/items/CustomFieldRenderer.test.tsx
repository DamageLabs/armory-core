import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomFieldRenderer from './CustomFieldRenderer';
import type { FieldDefinition } from '../../types/InventoryType';

const textField: FieldDefinition = {
  key: 'modelNumber',
  label: 'Model Number',
  type: 'text',
  required: false,
  placeholder: 'e.g., R3',
};

const selectField: FieldDefinition = {
  key: 'action',
  label: 'Action',
  type: 'select',
  required: false,
  options: ['Semi-Automatic', 'Bolt Action', 'Revolver'],
};

const booleanField: FieldDefinition = {
  key: 'fflRequired',
  label: 'FFL Required',
  type: 'boolean',
  required: false,
};

const numberField: FieldDefinition = {
  key: 'grainWeight',
  label: 'Grain Weight',
  type: 'number',
  required: false,
  placeholder: 'e.g., 115',
};

const requiredField: FieldDefinition = {
  key: 'serialNumber',
  label: 'Serial Number',
  type: 'text',
  required: true,
};

describe('CustomFieldRenderer', () => {
  it('returns null when schema is empty', () => {
    const { container } = render(
      <CustomFieldRenderer schema={[]} values={{}} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders fieldset legend', () => {
    render(
      <CustomFieldRenderer schema={[textField]} values={{}} onChange={vi.fn()} />
    );
    expect(screen.getByText('Type-Specific Fields')).toBeInTheDocument();
  });

  it('renders text input with placeholder', () => {
    render(
      <CustomFieldRenderer schema={[textField]} values={{}} onChange={vi.fn()} />
    );
    expect(screen.getByPlaceholderText('e.g., R3')).toBeInTheDocument();
  });

  it('calls onChange for text field', () => {
    const onChange = vi.fn();
    render(
      <CustomFieldRenderer schema={[textField]} values={{}} onChange={onChange} />
    );
    fireEvent.change(screen.getByPlaceholderText('e.g., R3'), { target: { value: 'V3' } });
    expect(onChange).toHaveBeenCalledWith('modelNumber', 'V3');
  });

  it('renders select with options', () => {
    render(
      <CustomFieldRenderer schema={[selectField]} values={{}} onChange={vi.fn()} />
    );
    expect(screen.getByText('-- Select --')).toBeInTheDocument();
    expect(screen.getByText('Semi-Automatic')).toBeInTheDocument();
    expect(screen.getByText('Bolt Action')).toBeInTheDocument();
  });

  it('renders boolean as checkbox', () => {
    render(
      <CustomFieldRenderer schema={[booleanField]} values={{ fflRequired: true }} onChange={vi.fn()} />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('renders number input', () => {
    render(
      <CustomFieldRenderer schema={[numberField]} values={{}} onChange={vi.fn()} />
    );
    expect(screen.getByPlaceholderText('e.g., 115')).toBeInTheDocument();
  });

  it('shows required indicator for required fields', () => {
    render(
      <CustomFieldRenderer schema={[requiredField]} values={{}} onChange={vi.fn()} />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables fields when readOnly', () => {
    render(
      <CustomFieldRenderer schema={[textField]} values={{}} onChange={vi.fn()} readOnly />
    );
    expect(screen.getByPlaceholderText('e.g., R3')).toBeDisabled();
  });
});
