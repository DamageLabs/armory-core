import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ItemService } from '../../../core/services/item.service';
import { SavedFilterService } from '../../../core/services/saved-filter.service';
import { Item, PaginatedItems, ItemFilters } from '../../../types/item';
import { SavedFilter } from '../../../types/saved-filter';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Inventory</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Manage your inventory items</p>
        </div>
        <a routerLink="/inventory/new" 
           class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 text-center">
          Add Item
        </a>
      </div>

      <!-- Search and filters -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <form [formGroup]="filterForm" class="space-y-4">
          
          <!-- Main search and controls row -->
          <div class="flex flex-col lg:flex-row gap-4">
            
            <!-- Search -->
            <div class="flex-1">
              <input
                type="text"
                formControlName="search"
                placeholder="Search items..."
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <!-- Save current filter -->
            <button
              type="button"
              (click)="showSaveFilterModal()"
              [disabled]="!hasActiveFilters()"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white disabled:text-slate-500 px-4 py-2 rounded-lg transition-colors duration-200 whitespace-nowrap">
              Save Filter
            </button>

            <!-- Per page selector -->
            <div class="w-full lg:w-auto">
              <select 
                formControlName="pageSize"
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>

          <!-- Saved filters -->
          @if (savedFilters().length > 0) {
            <div class="flex flex-wrap gap-2">
              <span class="text-sm text-slate-500 dark:text-slate-400 py-1">Saved filters:</span>
              @for (filter of savedFilters(); track filter.id) {
                <div class="inline-flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <button
                    type="button"
                    (click)="applySavedFilter(filter)"
                    class="px-3 py-1 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-colors">
                    {{ filter.name }}
                  </button>
                  <button
                    type="button"
                    (click)="deleteSavedFilter(filter)"
                    class="px-2 py-1 text-slate-400 hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>
              }
            </div>
          }
        </form>
      </div>

      <!-- Items table -->
      @if (itemsData(); as data) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <!-- Table header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Items ({{ data.pagination.totalItems | number }})
              </h2>
              @if (selectedItems().length > 0) {
                <button
                  (click)="deleteSelected()"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                  Delete Selected ({{ selectedItems().length }})
                </button>
              }
            </div>
          </div>

          @if (data.data.length > 0) {
            
            <!-- Desktop table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        [checked]="allSelected()"
                        [indeterminate]="someSelected()"
                        (change)="toggleAllItems($event)"
                        class="rounded border-slate-600 bg-slate-100 dark:bg-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Location</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700">
                  @for (item of data.data; track item.id) {
                    <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                      <td class="px-6 py-4">
                        <input
                          type="checkbox"
                          [checked]="isSelected(item.id)"
                          (change)="toggleItem(item.id)"
                          class="rounded border-slate-600 bg-slate-100 dark:bg-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center space-x-2">
                          @if (item.parentItemId) {
                            <span class="text-slate-400 dark:text-slate-500 text-sm">↳</span>
                          }
                          @if (item.expirationDate && getExpirationStatus(item) !== 'good') {
                            <span [class]="getExpirationStatusClass(item)">{{ getExpirationStatusIcon(item) }}</span>
                          }
                          <a [routerLink]="['/inventory', item.id]" class="font-medium text-amber-400 hover:text-amber-300">
                            {{ item.name }}
                          </a>
                          @if (item.child_count && item.child_count > 0) {
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🔗 {{ item.child_count }} {{ item.child_count === 1 ? 'accessory' : 'accessories' }}
                            </span>
                          }
                        </div>
                        @if (item.parent_name) {
                          <div class="mt-1">
                            <span class="text-xs text-slate-500 dark:text-slate-400">Attached to:</span>
                            <span class="inline-flex items-center px-2 py-0.5 ml-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {{ item.parent_name }}
                            </span>
                          </div>
                        }
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        <div class="max-w-xs truncate">{{ item.description || '-' }}</div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ item.quantity | number }}</td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {{ item.unitValue ? formatCurrency(item.unitValue) : '-' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ item.location || '-' }}</td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end space-x-2">
                          <a [routerLink]="['/inventory', item.id, 'edit']"
                             class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                            Edit
                          </a>
                          <button
                            (click)="deleteItem(item)"
                            class="text-red-400 hover:text-red-300 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="md:hidden space-y-4 p-4">
              @for (item of data.data; track item.id) {
                <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        [checked]="isSelected(item.id)"
                        (change)="toggleItem(item.id)"
                        class="rounded border-slate-600 bg-slate-600 text-amber-500 focus:ring-amber-500"
                      />
                      <div>
                        <div class="flex items-center space-x-2">
                          @if (item.parentItemId) {
                            <span class="text-slate-400 dark:text-slate-500 text-sm">↳</span>
                          }
                          @if (item.expirationDate && getExpirationStatus(item) !== 'good') {
                            <span [class]="getExpirationStatusClass(item)">{{ getExpirationStatusIcon(item) }}</span>
                          }
                          <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</h3>
                          @if (item.child_count && item.child_count > 0) {
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              🔗 {{ item.child_count }}
                            </span>
                          }
                        </div>
                        @if (item.parent_name) {
                          <div class="mt-1">
                            <span class="text-xs text-slate-500 dark:text-slate-400">Attached to:</span>
                            <span class="inline-flex items-center px-2 py-0.5 ml-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              {{ item.parent_name }}
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="flex space-x-2">
                      <a [routerLink]="['/inventory', item.id, 'edit']"
                         class="text-amber-400 hover:text-amber-300 text-sm">
                        Edit
                      </a>
                      <button
                        (click)="deleteItem(item)"
                        class="text-red-400 hover:text-red-300 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div class="space-y-2 text-sm">
                    @if (item.description) {
                      <p class="text-slate-600 dark:text-slate-300">{{ item.description }}</p>
                    }
                    <div class="flex flex-wrap gap-4 text-slate-500 dark:text-slate-400">
                      <span>Qty: {{ item.quantity }}</span>
                      @if (item.unitValue) {
                        <span>Cost: {{ formatCurrency(item.unitValue) }}</span>
                      }
                      @if (item.location) {
                        <span>Location: {{ item.location }}</span>
                      }
                    </div>
                  </div>
                  
                  <div class="mt-3">
                    <a [routerLink]="['/inventory', item.id]"
                       class="inline-flex items-center text-amber-400 hover:text-amber-300 text-sm font-medium">
                      View Details →
                    </a>
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (data.pagination.totalPages > 1) {
              <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <div class="flex items-center justify-between">
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Showing {{ ((data.pagination.page - 1) * data.pagination.pageSize) + 1 }} to 
                    {{ Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems) }} of 
                    {{ data.pagination.totalItems }} results
                  </p>
                  <div class="flex items-center space-x-2">
                    <button
                      [disabled]="data.pagination.page <= 1"
                      (click)="changePage(data.pagination.page - 1)"
                      class="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600">
                      Previous
                    </button>
                    <span class="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                      Page {{ data.pagination.page }} of {{ data.pagination.totalPages }}
                    </span>
                    <button
                      [disabled]="data.pagination.page >= data.pagination.totalPages"
                      (click)="changePage(data.pagination.page + 1)"
                      class="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            }

          } @else {
            <!-- Empty state -->
            <div class="px-6 py-12 text-center">
              <div class="text-6xl mb-4">📦</div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No items found</h3>
              <p class="text-slate-500 dark:text-slate-400 mb-6">Get started by adding your first inventory item.</p>
              <a routerLink="/inventory/new" 
                 class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
                Add First Item
              </a>
            </div>
          }
        </div>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading items...</p>
        </div>
      }
    </div>

    <!-- Save Filter Modal -->
    @if (showSaveFilter()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md mx-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Save Current Filter</h3>
          
          <form [formGroup]="saveFilterForm" (ngSubmit)="saveCurrentFilter()">
            <div class="mb-4">
              <label for="filterName" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filter Name
              </label>
              <input
                type="text"
                id="filterName"
                formControlName="name"
                placeholder="Enter filter name..."
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div class="flex items-center justify-end space-x-3">
              <button
                type="button"
                (click)="hideSaveFilterModal()"
                class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-4 py-2 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saveFilterForm.invalid"
                class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 disabled:text-slate-500 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
                Save Filter
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class InventoryListComponent implements OnInit {
  private itemService = inject(ItemService);
  private savedFilterService = inject(SavedFilterService);
  private fb = inject(FormBuilder);

  itemsData = signal<PaginatedItems | null>(null);
  isLoading = signal(false);
  selectedItems = signal<number[]>([]);
  savedFilters = signal<SavedFilter[]>([]);
  showSaveFilter = signal(false);

  Math = Math; // Make Math available in template

  filterForm = this.fb.group({
    search: [''],
    pageSize: [25]
  });

  saveFilterForm = this.fb.group({
    name: ['', [Validators.required]]
  });

  private currentFilters: ItemFilters = {
    page: 1,
    pageSize: 25
  };

  ngOnInit(): void {
    this.setupFilterSubscriptions();
    this.loadItems();
    this.loadSavedFilters();
  }

  private setupFilterSubscriptions(): void {
    // Search debouncing
    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.currentFilters.search = search || undefined;
      this.currentFilters.page = 1;
      this.loadItems();
    });

    // Per page changes
    this.filterForm.get('pageSize')?.valueChanges.subscribe(pageSize => {
      this.currentFilters.pageSize = Number(pageSize);
      this.currentFilters.page = 1;
      this.loadItems();
    });
  }

  private loadItems(): void {
    this.isLoading.set(true);
    this.itemService.getItems(this.currentFilters).subscribe({
      next: (data) => {
        // Compute child_count and parent_name client-side
        const items = data.data;
        const itemMap = new Map(items.map(i => [i.id, i]));
        for (const item of items) {
          // Count children
          (item as any).child_count = items.filter(i => i.parentItemId === item.id).length;
          // Resolve parent name
          if (item.parentItemId) {
            const parent = itemMap.get(item.parentItemId);
            (item as any).parent_name = parent?.name || null;
          }
        }
        this.itemsData.set(data);
        this.isLoading.set(false);
        // Clear selections when data changes
        this.selectedItems.set([]);
      },
      error: (error: any) => {
        console.error('Failed to load items:', error);
        this.isLoading.set(false);
      }
    });
  }

  changePage(page: number): void {
    this.currentFilters.page = page;
    this.loadItems();
  }

  isSelected(itemId: number): boolean {
    return this.selectedItems().includes(itemId);
  }

  toggleItem(itemId: number): void {
    const selected = this.selectedItems();
    if (selected.includes(itemId)) {
      this.selectedItems.set(selected.filter(id => id !== itemId));
    } else {
      this.selectedItems.set([...selected, itemId]);
    }
  }

  toggleAllItems(event: Event): void {
    const target = event.target as HTMLInputElement;
    const items = this.itemsData()?.data || [];
    
    if (target.checked) {
      this.selectedItems.set(items.map(item => item.id));
    } else {
      this.selectedItems.set([]);
    }
  }

  allSelected(): boolean {
    const items = this.itemsData()?.data || [];
    return items.length > 0 && this.selectedItems().length === items.length;
  }

  someSelected(): boolean {
    const selectedCount = this.selectedItems().length;
    const totalCount = this.itemsData()?.data.length || 0;
    return selectedCount > 0 && selectedCount < totalCount;
  }

  deleteItem(item: Item): void {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      this.itemService.deleteItem(item.id).subscribe({
        next: () => {
          this.loadItems();
        },
        error: (error: any) => {
          console.error('Failed to delete item:', error);
          alert('Failed to delete item. Please try again.');
        }
      });
    }
  }

  deleteSelected(): void {
    const count = this.selectedItems().length;
    if (confirm(`Are you sure you want to delete ${count} selected item${count > 1 ? 's' : ''}?`)) {
      // TODO: implement bulk delete
      alert('Bulk delete not yet implemented in Angular version');
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  // Saved filter methods
  private loadSavedFilters(): void {
    this.savedFilterService.getSavedFilters().subscribe({
      next: (filters) => {
        this.savedFilters.set(filters);
      },
      error: (error) => {
        console.error('Failed to load saved filters:', error);
      }
    });
  }

  hasActiveFilters(): boolean {
    return !!(this.currentFilters.search && this.currentFilters.search.trim().length > 0);
  }

  showSaveFilterModal(): void {
    this.showSaveFilter.set(true);
    this.saveFilterForm.reset();
  }

  hideSaveFilterModal(): void {
    this.showSaveFilter.set(false);
  }

  saveCurrentFilter(): void {
    if (this.saveFilterForm.valid) {
      const name = this.saveFilterForm.get('name')?.value;
      if (name) {
        this.savedFilterService.createSavedFilter({
          name,
          filterConfig: { ...this.currentFilters }
        }).subscribe({
          next: () => {
            this.loadSavedFilters();
            this.hideSaveFilterModal();
          },
          error: (error) => {
            console.error('Failed to save filter:', error);
            alert('Failed to save filter. Please try again.');
          }
        });
      }
    }
  }

  applySavedFilter(filter: SavedFilter): void {
    this.currentFilters = { ...filter.filterConfig, page: 1 };
    
    // Update form controls
    this.filterForm.patchValue({
      search: filter.filterConfig.search || '',
      pageSize: filter.filterConfig.pageSize || 25
    });
    
    this.loadItems();
  }

  deleteSavedFilter(filter: SavedFilter): void {
    if (confirm(`Are you sure you want to delete the saved filter "${filter.name}"?`)) {
      this.savedFilterService.deleteSavedFilter(filter.id).subscribe({
        next: () => {
          this.loadSavedFilters();
        },
        error: (error) => {
          console.error('Failed to delete saved filter:', error);
          alert('Failed to delete saved filter. Please try again.');
        }
      });
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
}