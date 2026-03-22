import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService, InsuranceReportResponse, InsuranceReportItem } from '../../../core/services/report.service';
import { InventoryTypeService } from '../../../core/services/inventory-type.service';
import { InventoryType } from '../../../types/inventory-type';

@Component({
  selector: 'app-insurance-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Insurance & Compliance Report</h1>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Generated: {{ formatDateTime(data()?.generatedAt) }}
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center space-x-3">
          <button
            (click)="exportToCsv()"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors no-print">
            📊 Export CSV
          </button>
          <button
            (click)="printReport()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors no-print">
            🖨️ Print
          </button>
        </div>
      </div>

      <!-- Filter -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 no-print">
        <div class="flex items-center space-x-4">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Filter by Type:
          </label>
          <select
            [(ngModel)]="selectedTypeId"
            (ngModelChange)="onTypeFilterChange()"
            class="block w-48 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm">
            <option value="">All Types</option>
            @for (type of inventoryTypes(); track type.id) {
              <option [value]="type.id">{{ type.name }}</option>
            }
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        </div>
      }

      @if (data() && !loading()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                  <span class="text-blue-600 dark:text-blue-400 text-sm font-semibold">📦</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total Items</dt>
                  <dd class="text-lg font-medium text-slate-900 dark:text-white">
                    {{ data()!.totalItems }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-md flex items-center justify-center">
                  <span class="text-green-600 dark:text-green-400 text-sm font-semibold">💰</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Total Insured Value</dt>
                  <dd class="text-lg font-medium text-slate-900 dark:text-white">
                    {{ formatCurrency(data()!.totalValue) }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-md flex items-center justify-center">
                  <span class="text-amber-600 dark:text-amber-400 text-sm font-semibold">🏷️</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Items with Serial Numbers</dt>
                  <dd class="text-lg font-medium text-slate-900 dark:text-white">
                    {{ itemsWithSerial() }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-md flex items-center justify-center">
                  <span class="text-red-600 dark:text-red-400 text-sm font-semibold">⚠️</span>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Items Missing Serial</dt>
                  <dd class="text-lg font-medium text-slate-900 dark:text-white">
                    {{ itemsMissingSerial() }}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <!-- Report Table -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 no-print">
            <h2 class="text-lg font-medium text-slate-900 dark:text-white">Items Report</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th 
                    (click)="sort('name')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Item Name
                    @if (sortField() === 'name') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('serialNumber')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Serial Number
                    @if (sortField() === 'serialNumber') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('category')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Category
                    @if (sortField() === 'category') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('manufacturer')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Manufacturer
                    @if (sortField() === 'manufacturer') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('condition')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Condition
                    @if (sortField() === 'condition') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('value')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Value
                    @if (sortField() === 'value') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('location')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Location
                    @if (sortField() === 'location') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                  <th 
                    (click)="sort('createdAt')"
                    class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 select-none">
                    Acquired
                    @if (sortField() === 'createdAt') {
                      <span class="ml-1">{{ sortDirection() === 'asc' ? '↑' : '↓' }}</span>
                    }
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                @for (item of sortedItems(); track item.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {{ item.name }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      @if (item.serialNumber) {
                        {{ item.serialNumber }}
                      } @else {
                        <span class="text-slate-400 dark:text-slate-500 italic">N/A</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ item.category || 'Uncategorized' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      @if (item.manufacturer) {
                        {{ item.manufacturer }}
                      } @else {
                        <span class="text-slate-400 dark:text-slate-500 italic">N/A</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      @if (item.condition) {
                        {{ item.condition }}
                      } @else {
                        <span class="text-slate-400 dark:text-slate-500 italic">N/A</span>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ formatCurrency(item.value) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ item.location || 'Not specified' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ formatDate(item.createdAt) }}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="8" class="px-6 py-4 text-center text-sm text-slate-500 dark:text-slate-400 italic">
                      No items found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class InsuranceReportComponent implements OnInit {
  private reportService = inject(ReportService);
  private inventoryTypeService = inject(InventoryTypeService);

  data = signal<InsuranceReportResponse | null>(null);
  inventoryTypes = signal<InventoryType[]>([]);
  loading = signal(false);
  selectedTypeId = '';
  
  // Sorting
  sortField = signal<keyof InsuranceReportItem>('name');
  sortDirection = signal<'asc' | 'desc'>('asc');

  ngOnInit(): void {
    this.loadInventoryTypes();
    this.loadReport();
  }

  itemsWithSerial = computed(() => {
    const items = this.data()?.items || [];
    return items.filter(item => item.serialNumber).length;
  });

  itemsMissingSerial = computed(() => {
    const items = this.data()?.items || [];
    return items.filter(item => !item.serialNumber).length;
  });

  sortedItems = computed(() => {
    const items = this.data()?.items || [];
    const field = this.sortField();
    const direction = this.sortDirection();

    return [...items].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      // Handle null values
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return direction === 'asc' ? 1 : -1;
      if (bValue === null) return direction === 'asc' ? -1 : 1;

      // Convert to strings for comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  private loadInventoryTypes(): void {
    this.inventoryTypeService.getInventoryTypes().subscribe({
      next: (types) => {
        this.inventoryTypes.set(types);
      },
      error: (error) => {
        console.error('Failed to load inventory types:', error);
      }
    });
  }

  private loadReport(): void {
    this.loading.set(true);
    const typeId = this.selectedTypeId ? parseInt(this.selectedTypeId, 10) : undefined;
    
    this.reportService.getInsuranceReport(typeId).subscribe({
      next: (report) => {
        this.data.set(report);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load insurance report:', error);
        this.loading.set(false);
      }
    });
  }

  onTypeFilterChange(): void {
    this.loadReport();
  }

  sort(field: keyof InsuranceReportItem): void {
    if (this.sortField() === field) {
      this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  printReport(): void {
    window.print();
  }

  exportToCsv(): void {
    const items = this.sortedItems();
    if (!items.length) return;

    const headers = [
      'Item Name',
      'Serial Number',
      'Category',
      'Manufacturer',
      'Condition', 
      'Value',
      'Location',
      'Acquired Date'
    ];

    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        `"${item.name}"`,
        `"${item.serialNumber || 'N/A'}"`,
        `"${item.category || 'Uncategorized'}"`,
        `"${item.manufacturer || 'N/A'}"`,
        `"${item.condition || 'N/A'}"`,
        item.value.toString(),
        `"${item.location || 'Not specified'}"`,
        `"${this.formatDate(item.createdAt)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `insurance-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  }
}