import { Component, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../../core/services/item.service';
import { AuthService } from '../../../core/services/auth.service';
import { Item } from '../../../types/item';

interface ImportRow {
  name: string;
  description: string;
  quantity: number;
  unitValue: number;
  category: string;
  location: string;
  inventoryType: string;
  customFields: Record<string, any>;
  valid: boolean;
  errors: string[];
}

interface BackupData {
  version: string;
  exportedAt: string;
  totalItems: number;
  items: Item[];
}

interface ImportProgress {
  current: number;
  total: number;
  isImporting: boolean;
}

@Component({
  selector: 'app-data-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Data Management</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Import, export, and manage your inventory data</p>
      </div>

      <!-- Export Section -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm">📤</span>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Export Data</h2>
            <p class="text-slate-500 dark:text-slate-400">Download your inventory data</p>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-3">
          <button
            (click)="exportCSV()"
            [disabled]="isExporting()"
            class="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
            @if (isExporting()) {
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            } @else {
              <span>📄</span>
            }
            <span>{{ isExporting() ? 'Exporting...' : 'Export as CSV' }}</span>
          </button>
          
          <button
            (click)="exportJSON()"
            [disabled]="isExporting()"
            class="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
            @if (isExporting()) {
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            } @else {
              <span>💾</span>
            }
            <span>{{ isExporting() ? 'Exporting...' : 'Export as JSON' }}</span>
          </button>
        </div>
      </div>

      <!-- Import CSV Section -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span class="text-slate-900 text-sm">📥</span>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Import CSV</h2>
            <p class="text-slate-500 dark:text-slate-400">Upload CSV file to import items</p>
          </div>
        </div>

        <!-- File input -->
        <div class="mb-4">
          <input
            #csvFileInput
            type="file"
            accept=".csv"
            (change)="onCsvFileSelected($event)"
            class="block w-full text-sm text-slate-500 dark:text-slate-400
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-amber-50 file:text-amber-700
                   dark:file:bg-amber-900/20 dark:file:text-amber-400
                   hover:file:bg-amber-100 dark:hover:file:bg-amber-900/30"
          />
        </div>

        <!-- CSV Preview -->
        @if (csvData().length > 0) {
          <div class="mb-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100">Preview</h3>
              <div class="flex items-center space-x-3">
                @if (validCsvCount() > 0) {
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    ✓ {{ validCsvCount() }} valid
                  </span>
                }
                @if (invalidCsvCount() > 0) {
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    ✗ {{ invalidCsvCount() }} invalid
                  </span>
                }
              </div>
            </div>

            <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <div class="max-h-64 overflow-y-auto">
                <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead class="bg-slate-50 dark:bg-slate-750">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Name</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Qty</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Value</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Errors</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    @for (row of csvData(); track $index) {
                      <tr [class]="row.valid ? '' : 'bg-red-50 dark:bg-red-900/20'">
                        <td class="px-3 py-2 text-center">
                          @if (row.valid) {
                            <span class="text-green-600 dark:text-green-400">✓</span>
                          } @else {
                            <span class="text-red-600 dark:text-red-400">✗</span>
                          }
                        </td>
                        <td class="px-3 py-2 text-sm text-slate-900 dark:text-slate-100">
                          {{ row.name || '-' }}
                        </td>
                        <td class="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                          {{ row.quantity }}
                        </td>
                        <td class="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                          {{ formatCurrency(row.unitValue) }}
                        </td>
                        <td class="px-3 py-2">
                          @for (error of row.errors; track error) {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 mr-1">
                              {{ error }}
                            </span>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            @if (validCsvCount() > 0) {
              <div class="mt-4">
                <button
                  (click)="importCSV()"
                  [disabled]="importProgress().isImporting"
                  class="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  @if (importProgress().isImporting) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Importing {{ importProgress().current }}/{{ importProgress().total }}...</span>
                  } @else {
                    <span>📤</span>
                    <span>Import {{ validCsvCount() }} Items</span>
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Restore Backup Section -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm">🔄</span>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Restore Backup</h2>
            <p class="text-slate-500 dark:text-slate-400">Restore from JSON backup file</p>
          </div>
        </div>

        <!-- File input -->
        <div class="mb-4">
          <input
            #jsonFileInput
            type="file"
            accept=".json"
            (change)="onJsonFileSelected($event)"
            class="block w-full text-sm text-slate-500 dark:text-slate-400
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0
                   file:text-sm file:font-semibold
                   file:bg-purple-50 file:text-purple-700
                   dark:file:bg-purple-900/20 dark:file:text-purple-400
                   hover:file:bg-purple-100 dark:hover:file:bg-purple-900/30"
          />
        </div>

        <!-- JSON Preview -->
        @if (backupData()) {
          <div class="mb-4">
            <div class="bg-slate-50 dark:bg-slate-750 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Backup Details</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Items:</span>
                  <span class="text-slate-900 dark:text-slate-100 font-medium">{{ backupData()!.totalItems | number }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Exported:</span>
                  <span class="text-slate-900 dark:text-slate-100 font-medium">{{ formatDate(backupData()!.exportedAt) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Version:</span>
                  <span class="text-slate-900 dark:text-slate-100 font-medium">{{ backupData()!.version }}</span>
                </div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-3">
              <button
                (click)="restoreBackup(false)"
                [disabled]="importProgress().isImporting"
                class="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                @if (importProgress().isImporting) {
                  <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Restoring...</span>
                } @else {
                  <span>🔄</span>
                  <span>Merge Restore</span>
                }
              </button>

              @if (isAdmin()) {
                <button
                  (click)="restoreBackup(true)"
                  [disabled]="importProgress().isImporting"
                  class="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200">
                  @if (importProgress().isImporting) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Clearing & Restoring...</span>
                  } @else {
                    <span>⚠️</span>
                    <span>Clear & Restore</span>
                  }
                </button>
              }
            </div>

            @if (isAdmin()) {
              <div class="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p class="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Warning:</strong> Clear & Restore will delete all existing items before restoring the backup.
                </p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Success/Error Messages -->
      @if (message()) {
        <div [class]="messageClass()" class="p-4 rounded-lg border">
          <p>{{ message() }}</p>
        </div>
      }
    </div>
  `
})
export class DataManagementComponent {
  private itemService = inject(ItemService);
  private authService = inject(AuthService);

  @ViewChild('csvFileInput') csvFileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('jsonFileInput') jsonFileInput!: ElementRef<HTMLInputElement>;

  isExporting = signal(false);
  csvData = signal<ImportRow[]>([]);
  backupData = signal<BackupData | null>(null);
  importProgress = signal<ImportProgress>({ current: 0, total: 0, isImporting: false });
  message = signal<string>('');
  messageType = signal<'success' | 'error'>('success');

  validCsvCount(): number {
    return this.csvData().filter(row => row.valid).length;
  }

  invalidCsvCount(): number {
    return this.csvData().length - this.validCsvCount();
  }

  messageClass(): string {
    const type = this.messageType();
    return type === 'success' 
      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }

  async exportCSV(): Promise<void> {
    this.isExporting.set(true);
    this.clearMessage();

    try {
      // Fetch all items
      const response = await this.itemService.getItems({ pageSize: 1000 }).toPromise();
      if (!response?.data) {
        throw new Error('No data received');
      }

      const items = response.data;
      
      // Generate CSV headers
      const baseHeaders = [
        'Name', 'Description', 'Quantity', 'Unit Value', 'Category', 
        'Location', 'Inventory Type', 'Barcode', 'Reorder Point'
      ];
      
      // Collect all custom field keys
      const customFieldKeys = new Set<string>();
      items.forEach(item => {
        if (item.customFields) {
          Object.keys(item.customFields).forEach(key => customFieldKeys.add(key));
        }
      });
      
      const headers = [...baseHeaders, ...Array.from(customFieldKeys)];
      
      // Generate CSV rows
      const rows = items.map(item => {
        const baseRow = [
          this.escapeCsv(item.name),
          this.escapeCsv(item.description || ''),
          item.quantity.toString(),
          item.unitValue.toString(),
          this.escapeCsv(item.category || ''),
          this.escapeCsv(item.location || ''),
          item.inventoryTypeId.toString(),
          this.escapeCsv(item.barcode || ''),
          (item.reorderPoint || 0).toString()
        ];
        
        // Add custom field values
        customFieldKeys.forEach(key => {
          const value = item.customFields?.[key];
          baseRow.push(this.escapeCsv(value ? String(value) : ''));
        });
        
        return baseRow;
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download file
      this.downloadFile(csvContent, `armory-core-export-${this.getDateString()}.csv`, 'text/csv');
      
      this.showMessage(`Successfully exported ${items.length} items to CSV`, 'success');
    } catch (error) {
      console.error('Export CSV failed:', error);
      this.showMessage('Failed to export CSV. Please try again.', 'error');
    } finally {
      this.isExporting.set(false);
    }
  }

  async exportJSON(): Promise<void> {
    this.isExporting.set(true);
    this.clearMessage();

    try {
      // Fetch all items
      const response = await this.itemService.getItems({ pageSize: 1000 }).toPromise();
      if (!response?.data) {
        throw new Error('No data received');
      }

      const items = response.data;
      
      const backupData: BackupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalItems: items.length,
        items: items
      };
      
      const jsonContent = JSON.stringify(backupData, null, 2);
      
      // Download file
      this.downloadFile(jsonContent, `armory-core-backup-${this.getDateString()}.json`, 'application/json');
      
      this.showMessage(`Successfully exported ${items.length} items to JSON backup`, 'success');
    } catch (error) {
      console.error('Export JSON failed:', error);
      this.showMessage('Failed to export JSON backup. Please try again.', 'error');
    } finally {
      this.isExporting.set(false);
    }
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.parseCsv(content);
    };
    reader.readAsText(file);
  }

  onJsonFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.parseBackupJson(content);
    };
    reader.readAsText(file);
  }

  private parseCsv(content: string): void {
    try {
      const parsed = this.parseCSV(content);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        this.showMessage('CSV file appears to be empty', 'error');
        return;
      }

      const mappedRows = parsed.rows.map(row => this.mapCsvRow(parsed.headers, row));
      this.csvData.set(mappedRows);
      this.clearMessage();
    } catch (error) {
      console.error('CSV parsing failed:', error);
      this.showMessage('Failed to parse CSV file', 'error');
    }
  }

  private parseCSV(text: string): { headers: string[], rows: string[][] } {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return { headers: [], rows: [] };
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      // Handle quoted fields with commas
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          fields.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      fields.push(current.trim().replace(/^"|"$/g, ''));
      return fields;
    });
    return { headers, rows };
  }

  private mapCsvRow(headers: string[], row: string[]): ImportRow {
    const mapped: Partial<ImportRow> = {
      customFields: {}
    };

    // Column mapping
    const columnMappings: Record<string, string> = {
      'name': 'name',
      'item': 'name',
      'item name': 'name',
      'description': 'description',
      'desc': 'description',
      'quantity': 'quantity',
      'qty': 'quantity',
      'stock': 'quantity',
      'unit value': 'unitValue',
      'unit price': 'unitValue',
      'price': 'unitValue',
      'cost': 'unitValue',
      'category': 'category',
      'cat': 'category',
      'location': 'location',
      'loc': 'location',
      'bin': 'location',
      'inventory type': 'inventoryType'
    };

    headers.forEach((header, index) => {
      const value = row[index] || '';
      const normalizedHeader = header.toLowerCase().trim();
      const mappedField = columnMappings[normalizedHeader];

      if (mappedField) {
        (mapped as any)[mappedField] = value;
      } else {
        // Unmapped columns go to custom fields
        mapped.customFields![header] = value;
      }
    });

    return this.validateImportRow(mapped);
  }

  private validateImportRow(row: Partial<ImportRow>): ImportRow {
    const errors: string[] = [];

    const name = String(row.name || '').trim();
    if (!name) {
      errors.push('Name is required');
    }

    const quantity = Math.max(0, Number(row.quantity) || 0);
    const unitValue = Math.max(0, Number(row.unitValue) || 0);

    return {
      name,
      description: String(row.description || '').trim(),
      quantity,
      unitValue,
      category: String(row.category || '').trim(),
      location: String(row.location || '').trim(),
      inventoryType: String(row.inventoryType || '1').trim(),
      customFields: row.customFields || {},
      valid: errors.length === 0,
      errors
    };
  }

  private parseBackupJson(content: string): void {
    try {
      const data = JSON.parse(content);
      
      if (!data.items || !Array.isArray(data.items)) {
        this.showMessage('Invalid backup file format', 'error');
        return;
      }

      this.backupData.set({
        version: data.version || 'unknown',
        exportedAt: data.exportedAt || new Date().toISOString(),
        totalItems: data.totalItems || data.items.length,
        items: data.items
      });
      
      this.clearMessage();
    } catch (error) {
      console.error('JSON parsing failed:', error);
      this.showMessage('Failed to parse backup file', 'error');
    }
  }

  async importCSV(): Promise<void> {
    const validRows = this.csvData().filter(row => row.valid);
    if (validRows.length === 0) {
      this.showMessage('No valid rows to import', 'error');
      return;
    }

    this.importProgress.set({ current: 0, total: validRows.length, isImporting: true });
    this.clearMessage();

    try {
      const items = validRows.map(row => ({
        name: row.name,
        description: row.description,
        quantity: row.quantity,
        unitValue: row.unitValue,
        category: row.category,
        location: row.location,
        barcode: '',
        reorderPoint: 0,
        inventoryTypeId: Number(row.inventoryType) || 1,
        customFields: row.customFields,
        parentItemId: null,
        picture: null
      }));

      const response = await fetch('/api/items/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      this.showMessage(`Successfully imported ${result.created || validRows.length} items`, 'success');
      
      // Clear the form
      this.csvData.set([]);
      this.csvFileInput.nativeElement.value = '';
      
    } catch (error) {
      console.error('Import failed:', error);
      this.showMessage('Failed to import CSV data. Please try again.', 'error');
    } finally {
      this.importProgress.set({ current: 0, total: 0, isImporting: false });
    }
  }

  async restoreBackup(clearFirst: boolean): Promise<void> {
    const backup = this.backupData();
    if (!backup) return;

    this.importProgress.set({ current: 0, total: backup.items.length, isImporting: true });
    this.clearMessage();

    try {
      // Clear existing items if requested
      if (clearFirst) {
        const deleteResponse = await fetch('/api/items/all', {
          method: 'DELETE'
        });
        
        if (!deleteResponse.ok) {
          throw new Error(`Failed to clear existing items: HTTP ${deleteResponse.status}`);
        }
      }

      // Import items from backup
      const response = await fetch('/api/items/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: backup.items })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      const action = clearFirst ? 'restored (after clearing)' : 'imported';
      this.showMessage(`Successfully ${action} ${result.created || backup.items.length} items`, 'success');
      
      // Clear the form
      this.backupData.set(null);
      this.jsonFileInput.nativeElement.value = '';
      
    } catch (error) {
      console.error('Restore failed:', error);
      this.showMessage('Failed to restore backup. Please try again.', 'error');
    } finally {
      this.importProgress.set({ current: 0, total: 0, isImporting: false });
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private getDateString(): string {
    return new Date().toISOString().split('T')[0];
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message.set(message);
    this.messageType.set(type);
    
    // Auto-clear success messages
    if (type === 'success') {
      setTimeout(() => this.clearMessage(), 5000);
    }
  }

  private clearMessage(): void {
    this.message.set('');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString();
  }
}