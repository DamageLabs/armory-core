import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ItemService } from '../../../core/services/item.service';
import { Item, PaginatedItems, ItemFilters } from '../../../types/item';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-100">Inventory</h1>
          <p class="mt-1 text-slate-400">Manage your inventory items</p>
        </div>
        <a routerLink="/inventory/new" 
           class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 text-center">
          Add Item
        </a>
      </div>

      <!-- Search and filters -->
      <div class="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <form [formGroup]="filterForm" class="flex flex-col lg:flex-row gap-4">
          
          <!-- Search -->
          <div class="flex-1">
            <input
              type="text"
              formControlName="search"
              placeholder="Search items..."
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <!-- Per page selector -->
          <div class="w-full lg:w-auto">
            <select 
              formControlName="per_page"
              class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </select>
          </div>
        </form>
      </div>

      <!-- Items table -->
      @if (itemsData(); as data) {
        <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          
          <!-- Table header -->
          <div class="px-6 py-4 border-b border-slate-700 bg-slate-750">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-100">
                Items ({{ data.meta.total | number }})
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
                <thead class="bg-slate-750 border-b border-slate-700">
                  <tr>
                    <th class="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        [checked]="allSelected()"
                        [indeterminate]="someSelected()"
                        (change)="toggleAllItems($event)"
                        class="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                      />
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Cost</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Location</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700">
                  @for (item of data.data; track item.id) {
                    <tr class="hover:bg-slate-700/50 transition-colors duration-150">
                      <td class="px-6 py-4">
                        <input
                          type="checkbox"
                          [checked]="isSelected(item.id)"
                          (change)="toggleItem(item.id)"
                          class="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td class="px-6 py-4">
                        <a [routerLink]="['/inventory', item.id]" class="font-medium text-amber-400 hover:text-amber-300">
                          {{ item.name }}
                        </a>
                      </td>
                      <td class="px-6 py-4 text-slate-300">
                        <div class="max-w-xs truncate">{{ item.description || '-' }}</div>
                      </td>
                      <td class="px-6 py-4 text-slate-300">{{ item.quantity | number }}</td>
                      <td class="px-6 py-4 text-slate-300">
                        {{ item.cost ? formatCurrency(item.cost) : '-' }}
                      </td>
                      <td class="px-6 py-4 text-slate-300">{{ item.location || '-' }}</td>
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
                <div class="bg-slate-700 p-4 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        [checked]="isSelected(item.id)"
                        (change)="toggleItem(item.id)"
                        class="rounded border-slate-600 bg-slate-600 text-amber-500 focus:ring-amber-500"
                      />
                      <h3 class="font-medium text-slate-100">{{ item.name }}</h3>
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
                      <p class="text-slate-300">{{ item.description }}</p>
                    }
                    <div class="flex flex-wrap gap-4 text-slate-400">
                      <span>Qty: {{ item.quantity }}</span>
                      @if (item.cost) {
                        <span>Cost: {{ formatCurrency(item.cost) }}</span>
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
            @if (data.meta.total_pages > 1) {
              <div class="px-6 py-4 border-t border-slate-700 bg-slate-750">
                <div class="flex items-center justify-between">
                  <p class="text-sm text-slate-400">
                    Showing {{ ((data.meta.page - 1) * data.meta.per_page) + 1 }} to 
                    {{ Math.min(data.meta.page * data.meta.per_page, data.meta.total) }} of 
                    {{ data.meta.total }} results
                  </p>
                  <div class="flex items-center space-x-2">
                    <button
                      [disabled]="data.meta.page <= 1"
                      (click)="changePage(data.meta.page - 1)"
                      class="px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600">
                      Previous
                    </button>
                    <span class="px-4 py-2 text-sm text-slate-300">
                      Page {{ data.meta.page }} of {{ data.meta.total_pages }}
                    </span>
                    <button
                      [disabled]="data.meta.page >= data.meta.total_pages"
                      (click)="changePage(data.meta.page + 1)"
                      class="px-3 py-2 text-sm bg-slate-700 text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600">
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
              <h3 class="text-lg font-medium text-slate-100 mb-2">No items found</h3>
              <p class="text-slate-400 mb-6">Get started by adding your first inventory item.</p>
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
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-400">Loading items...</p>
        </div>
      }
    </div>
  `
})
export class InventoryListComponent implements OnInit {
  private itemService = inject(ItemService);
  private fb = inject(FormBuilder);

  itemsData = signal<PaginatedItems | null>(null);
  isLoading = signal(false);
  selectedItems = signal<string[]>([]);

  Math = Math; // Make Math available in template

  filterForm = this.fb.group({
    search: [''],
    per_page: [25]
  });

  private currentFilters: ItemFilters = {
    page: 1,
    per_page: 25
  };

  ngOnInit(): void {
    this.setupFilterSubscriptions();
    this.loadItems();
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
    this.filterForm.get('per_page')?.valueChanges.subscribe(per_page => {
      this.currentFilters.per_page = Number(per_page);
      this.currentFilters.page = 1;
      this.loadItems();
    });
  }

  private loadItems(): void {
    this.isLoading.set(true);
    this.itemService.getItems(this.currentFilters).subscribe({
      next: (data) => {
        this.itemsData.set(data);
        this.isLoading.set(false);
        // Clear selections when data changes
        this.selectedItems.set([]);
      },
      error: (error) => {
        console.error('Failed to load items:', error);
        this.isLoading.set(false);
      }
    });
  }

  changePage(page: number): void {
    this.currentFilters.page = page;
    this.loadItems();
  }

  isSelected(itemId: string): boolean {
    return this.selectedItems().includes(itemId);
  }

  toggleItem(itemId: string): void {
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
        error: (error) => {
          console.error('Failed to delete item:', error);
          alert('Failed to delete item. Please try again.');
        }
      });
    }
  }

  deleteSelected(): void {
    const count = this.selectedItems().length;
    if (confirm(`Are you sure you want to delete ${count} selected item${count > 1 ? 's' : ''}?`)) {
      this.itemService.bulkDelete(this.selectedItems()).subscribe({
        next: () => {
          this.selectedItems.set([]);
          this.loadItems();
        },
        error: (error) => {
          console.error('Failed to delete items:', error);
          alert('Failed to delete items. Please try again.');
        }
      });
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }
}