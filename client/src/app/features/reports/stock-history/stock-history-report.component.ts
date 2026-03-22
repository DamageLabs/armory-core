import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StockHistoryService, StockHistoryEntry, StockHistoryStats } from '../../../core/services/stock-history.service';

@Component({
  selector: 'app-stock-history-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white">Stock History Report</h1>
        <p class="text-slate-600 dark:text-slate-400 mt-2">Complete history of inventory changes across all items</p>
      </div>

      <!-- Summary Stats -->
      @if (stats()) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div class="flex items-center">
              <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span class="text-blue-600 dark:text-blue-400 text-xl">📊</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Changes</p>
                <p class="text-xl font-semibold text-slate-900 dark:text-white">{{ stats()?.totalChanges || 0 | number }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div class="flex items-center">
              <div class="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <span class="text-amber-600 dark:text-amber-400 text-xl">📦</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Items Affected</p>
                <p class="text-xl font-semibold text-slate-900 dark:text-white">{{ uniqueItemsCount() | number }}</p>
              </div>
            </div>
          </div>
          
          <div class="bg-white dark:bg-slate-800 rounded-lg p-4 shadow">
            <div class="flex items-center">
              <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <span class="text-green-600 dark:text-green-400 text-xl">💰</span>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-slate-600 dark:text-slate-400">Value Changes</p>
                <p class="text-xl font-semibold text-slate-900 dark:text-white">{{ valueChangesTotal() | currency }}</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">Filters</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Change Type Filter -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Change Type</label>
            <select 
              [(ngModel)]="filters.changeType"
              (ngModelChange)="loadHistory()"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-700 dark:text-white">
              <option value="all">All Changes</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="quantity_change">Quantity Change</option>
              <option value="value_change">Value Change</option>
              <option value="category_change">Category Change</option>
            </select>
          </div>
          
          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date From</label>
            <input 
              type="date"
              [(ngModel)]="filters.dateFrom"
              (ngModelChange)="loadHistory()"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-700 dark:text-white">
          </div>
          
          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date To</label>
            <input 
              type="date"
              [(ngModel)]="filters.dateTo"
              (ngModelChange)="loadHistory()"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-700 dark:text-white">
          </div>
          
          <!-- Item Name Search -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Item Name</label>
            <input 
              type="text"
              [(ngModel)]="filters.itemName"
              (ngModelChange)="loadHistory()"
              placeholder="Search by item name..."
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-amber-500 focus:border-amber-500 dark:bg-slate-700 dark:text-white">
          </div>
        </div>
        
        <div class="flex justify-end mt-4">
          <button 
            (click)="clearFilters()"
            class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Results Table -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            <p class="mt-2 text-slate-600 dark:text-slate-400">Loading history...</p>
          </div>
        } @else if (history().length === 0) {
          <div class="p-8 text-center">
            <span class="text-4xl">📜</span>
            <p class="mt-2 text-slate-600 dark:text-slate-400">No history entries found</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Item
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Change Type
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Changes
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                @for (entry of history(); track entry.id) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {{ formatTimestamp(entry.timestamp) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <a 
                        [routerLink]="['/inventory', entry.itemId]"
                        class="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-medium">
                        {{ entry.itemName }}
                      </a>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getChangeTypeBadgeClasses(entry.changeType)"
                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {{ getChangeTypeLabel(entry.changeType) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      <div class="space-y-1">
                        @if (entry.changeType === 'quantity_change' && entry.previousQuantity !== null && entry.newQuantity !== null) {
                          <div>Qty: {{ entry.previousQuantity }} → {{ entry.newQuantity }}</div>
                        }
                        @if (entry.changeType === 'value_change' && entry.previousValue !== null && entry.newValue !== null) {
                          <div>Value: {{ entry.previousValue | currency }} → {{ entry.newValue | currency }}</div>
                        }
                        @if (entry.changeType === 'category_change' && entry.previousCategory && entry.newCategory) {
                          <div>Category: {{ entry.previousCategory }} → {{ entry.newCategory }}</div>
                        }
                        @if (entry.changeType === 'created') {
                          <div>Item created</div>
                        }
                        @if (entry.changeType === 'updated') {
                          <div>Item updated</div>
                        }
                        @if (entry.changeType === 'deleted') {
                          <div>Item deleted</div>
                        }
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {{ entry.userEmail }}
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {{ entry.notes || '-' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Pagination -->
      @if (history().length > 0) {
        <div class="mt-6 flex items-center justify-between">
          <div class="text-sm text-slate-600 dark:text-slate-400">
            Showing {{ ((filters.page - 1) * filters.pageSize) + 1 }} to 
            {{ Math.min(filters.page * filters.pageSize, totalItems()) }} of {{ totalItems() }} entries
          </div>
          
          <div class="flex items-center space-x-2">
            <button 
              (click)="previousPage()"
              [disabled]="filters.page <= 1"
              class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700">
              Previous
            </button>
            
            <span class="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
              Page {{ filters.page }}
            </span>
            
            <button 
              (click)="nextPage()"
              [disabled]="history().length < filters.pageSize"
              class="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700">
              Next
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class StockHistoryReportComponent implements OnInit {
  private stockHistoryService = inject(StockHistoryService);
  
  history = signal<StockHistoryEntry[]>([]);
  stats = signal<StockHistoryStats | null>(null);
  loading = signal(false);
  
  Math = Math;
  
  filters = {
    page: 1,
    pageSize: 50,
    changeType: 'all',
    dateFrom: '',
    dateTo: '',
    itemName: ''
  };

  uniqueItemsCount = computed(() => {
    const uniqueItems = new Set(this.history().map(entry => entry.itemId));
    return uniqueItems.size;
  });

  valueChangesTotal = computed(() => {
    return this.history()
      .filter(entry => entry.changeType === 'value_change' && entry.newValue !== null && entry.previousValue !== null)
      .reduce((total, entry) => total + (entry.newValue! - entry.previousValue!), 0);
  });

  totalItems = computed(() => {
    return this.history().length;
  });

  ngOnInit(): void {
    this.loadHistory();
    this.loadStats();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.stockHistoryService.getHistory(this.filters).subscribe({
      next: (data) => {
        this.history.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.stockHistoryService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  clearFilters(): void {
    this.filters = {
      page: 1,
      pageSize: 50,
      changeType: 'all',
      dateFrom: '',
      dateTo: '',
      itemName: ''
    };
    this.loadHistory();
  }

  previousPage(): void {
    if (this.filters.page > 1) {
      this.filters.page--;
      this.loadHistory();
    }
  }

  nextPage(): void {
    if (this.history().length === this.filters.pageSize) {
      this.filters.page++;
      this.loadHistory();
    }
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  getChangeTypeLabel(changeType: string): string {
    const labels: Record<string, string> = {
      'created': 'Created',
      'updated': 'Updated', 
      'deleted': 'Deleted',
      'quantity_change': 'Quantity',
      'value_change': 'Value',
      'category_change': 'Category'
    };
    return labels[changeType] || changeType;
  }

  getChangeTypeBadgeClasses(changeType: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (changeType) {
      case 'created':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'deleted':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case 'quantity_change':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'value_change':
        return `${baseClasses} bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200`;
      case 'category_change':
        return `${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200`;
      case 'updated':
        return `${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200`;
    }
  }
}