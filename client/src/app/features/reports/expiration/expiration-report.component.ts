import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ItemService } from '../../../core/services/item.service';
import { Item } from '../../../types/item';

@Component({
  selector: 'app-expiration-report',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Expiration Report</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Items with expiration dates</p>
        </div>
      </div>

      <!-- Status filters -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap gap-3">
          <button
            (click)="setStatusFilter(null)"
            [class]="statusFilter() === null ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'"
            class="px-4 py-2 rounded-lg font-medium transition-colors">
            All ({{ allExpiringItems().length }})
          </button>
          <button
            (click)="setStatusFilter('expired')"
            [class]="statusFilter() === 'expired' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'"
            class="px-4 py-2 rounded-lg font-medium transition-colors">
            🔴 Expired ({{ expiredItems().length }})
          </button>
          <button
            (click)="setStatusFilter('warning')"
            [class]="statusFilter() === 'warning' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'"
            class="px-4 py-2 rounded-lg font-medium transition-colors">
            🟡 Warning ({{ warningItems().length }})
          </button>
          <button
            (click)="setStatusFilter('good')"
            [class]="statusFilter() === 'good' ? 'bg-green-500 text-slate-900' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'"
            class="px-4 py-2 rounded-lg font-medium transition-colors">
            🟢 Good ({{ goodItems().length }})
          </button>
        </div>
      </div>

      <!-- Items table -->
      @if (filteredItems().length > 0) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <!-- Desktop table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full">
              <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Expiration Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700">
                @for (item of filteredItems(); track item.id) {
                  <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                    <td class="px-6 py-4">
                      <div class="flex items-center space-x-2">
                        <span [class]="getExpirationStatusClass(item)">{{ getExpirationStatusIcon(item) }}</span>
                        <span [class]="getExpirationStatusTextClass(item)" class="text-xs font-medium">
                          {{ getExpirationStatusText(item) }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <a [routerLink]="['/inventory', item.id]" class="font-medium text-amber-400 hover:text-amber-300">
                        {{ item.name }}
                      </a>
                    </td>
                    <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ item.category || '-' }}</td>
                    <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ formatExpirationDate(item.expirationDate!) }}</td>
                    <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                      <div class="max-w-xs truncate">{{ item.expirationNotes || '-' }}</div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <a [routerLink]="['/inventory', item.id, 'edit']"
                         class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                        Edit
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="md:hidden space-y-4 p-4">
            @for (item of filteredItems(); track item.id) {
              <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <div class="flex items-center space-x-2 mb-1">
                      <span [class]="getExpirationStatusClass(item)">{{ getExpirationStatusIcon(item) }}</span>
                      <h3 class="font-medium text-slate-900 dark:text-slate-100">
                        <a [routerLink]="['/inventory', item.id]" class="text-amber-400 hover:text-amber-300">
                          {{ item.name }}
                        </a>
                      </h3>
                    </div>
                    <div [class]="getExpirationStatusTextClass(item)" class="text-sm font-medium">
                      {{ getExpirationStatusText(item) }}
                    </div>
                  </div>
                  <a [routerLink]="['/inventory', item.id, 'edit']"
                     class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                    Edit
                  </a>
                </div>
                
                <div class="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  @if (item.category) {
                    <div><span class="font-medium">Category:</span> {{ item.category }}</div>
                  }
                  <div><span class="font-medium">Expires:</span> {{ formatExpirationDate(item.expirationDate!) }}</div>
                  @if (item.expirationNotes) {
                    <div><span class="font-medium">Notes:</span> {{ item.expirationNotes }}</div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p class="text-slate-500 dark:text-slate-400">
            @if (statusFilter()) {
              No {{ statusFilter() }} items found.
            } @else {
              No items with expiration dates found.
            }
          </p>
        </div>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading expiration data...</p>
        </div>
      }
    </div>
  `
})
export class ExpirationReportComponent implements OnInit {
  private itemService = inject(ItemService);

  allExpiringItems = signal<Item[]>([]);
  statusFilter = signal<'expired' | 'warning' | 'good' | null>(null);
  isLoading = signal(false);

  // Computed signals for filtered data
  expiredItems = signal<Item[]>([]);
  warningItems = signal<Item[]>([]);
  goodItems = signal<Item[]>([]);
  filteredItems = signal<Item[]>([]);

  ngOnInit(): void {
    this.loadExpiringItems();
  }

  private loadExpiringItems(): void {
    this.isLoading.set(true);
    
    // Load all items with expiration dates (using a large days value to get all)
    this.itemService.getExpiringItems(9999).subscribe({
      next: (items) => {
        const sortedItems = items.sort((a, b) => {
          const dateA = new Date(a.expirationDate!);
          const dateB = new Date(b.expirationDate!);
          return dateA.getTime() - dateB.getTime();
        });
        
        this.allExpiringItems.set(sortedItems);
        this.categorizeItems(sortedItems);
        this.applyFilter();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load expiring items:', error);
        this.isLoading.set(false);
      }
    });
  }

  private categorizeItems(items: Item[]): void {
    const expired: Item[] = [];
    const warning: Item[] = [];
    const good: Item[] = [];

    items.forEach(item => {
      const status = this.getExpirationStatus(item);
      switch (status) {
        case 'expired':
          expired.push(item);
          break;
        case 'warning':
          warning.push(item);
          break;
        case 'good':
          good.push(item);
          break;
      }
    });

    this.expiredItems.set(expired);
    this.warningItems.set(warning);
    this.goodItems.set(good);
  }

  setStatusFilter(status: 'expired' | 'warning' | 'good' | null): void {
    this.statusFilter.set(status);
    this.applyFilter();
  }

  private applyFilter(): void {
    const filter = this.statusFilter();
    if (!filter) {
      this.filteredItems.set(this.allExpiringItems());
    } else {
      switch (filter) {
        case 'expired':
          this.filteredItems.set(this.expiredItems());
          break;
        case 'warning':
          this.filteredItems.set(this.warningItems());
          break;
        case 'good':
          this.filteredItems.set(this.goodItems());
          break;
      }
    }
  }

  getExpirationStatus(item: Item): 'expired' | 'warning' | 'good' | null {
    if (!item.expirationDate) return null;
    
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 30) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  getExpirationStatusIcon(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'good':
        return '🟢';
      default:
        return '';
    }
  }

  getExpirationStatusClass(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'good':
        return 'text-green-500';
      default:
        return '';
    }
  }

  getExpirationStatusText(item: Item): string {
    if (!item.expirationDate) return '';
    
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  }

  getExpirationStatusTextClass(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return 'text-red-500 font-medium';
      case 'warning':
        return 'text-yellow-500 font-medium';
      case 'good':
        return 'text-green-500';
      default:
        return 'text-slate-500';
    }
  }

  formatExpirationDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}