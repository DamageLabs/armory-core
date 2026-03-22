import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { WishlistService } from '../../core/services/wishlist.service';
import { InventoryTypeService } from '../../core/services/inventory-type.service';
import { WishlistItem, CreateWishlistItem, WishlistFilters, WishlistPriority } from '../../types/wishlist';
import { InventoryType } from '../../types/inventory-type';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Wishlist</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Track items you want to purchase</p>
        </div>
        <button
          (click)="showAddForm = true"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
          🛒 Add to Wishlist
        </button>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ totalItems() }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Items</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="text-2xl font-bold text-green-600">{{ purchasedCount() }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Purchased</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="text-2xl font-bold text-blue-600">\${{ totalTargetCost() | number:'1.2-2' }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Target Cost</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="text-2xl font-bold text-amber-600">\${{ remainingCost() | number:'1.2-2' }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">Remaining</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <form [formGroup]="filterForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <!-- Priority filter -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
              <select 
                formControlName="priority"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <!-- Purchased toggle -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select 
                formControlName="purchased"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">All Items</option>
                <option value="false">Not Purchased</option>
                <option value="true">Purchased</option>
              </select>
            </div>

            <!-- Sort by -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sort By</label>
              <select 
                formControlName="sort"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="date">Date Added</option>
                <option value="priority">Priority</option>
                <option value="price">Target Price</option>
                <option value="name">Name</option>
              </select>
            </div>

            <!-- Sort order -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Order</label>
              <select 
                formControlName="order"
                class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            
          </div>
        </form>
      </div>

      <!-- Add Item Form -->
      @if (showAddForm) {
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Add to Wishlist</h3>
            <button 
              (click)="cancelAdd()"
              class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              ✕
            </button>
          </div>
          
          <form [formGroup]="addForm" (ngSubmit)="addItem()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Name (required) -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="name"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Item name"
                />
                @if (addForm.get('name')?.invalid && addForm.get('name')?.touched) {
                  <p class="text-red-500 text-sm mt-1">Name is required</p>
                }
              </div>

              <!-- Target Price -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Price</label>
                <input
                  type="number"
                  formControlName="targetPrice"
                  min="0"
                  step="0.01"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="0.00"
                />
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                <select 
                  formControlName="priority"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <!-- Inventory Type -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                <select 
                  formControlName="inventoryTypeId"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  @for (type of inventoryTypes(); track type.id) {
                    <option [value]="type.id">{{ type.name }}</option>
                  }
                </select>
              </div>

              <!-- Vendor URL -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vendor URL</label>
                <input
                  type="url"
                  formControlName="vendorUrl"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="https://..."
                />
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                <textarea
                  formControlName="description"
                  rows="3"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Optional description">
                </textarea>
              </div>

              <!-- Notes -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                <textarea
                  formControlName="notes"
                  rows="2"
                  class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Private notes">
                </textarea>
              </div>
              
            </div>

            <!-- Submit buttons -->
            <div class="flex justify-end gap-3 pt-4">
              <button
                type="button"
                (click)="cancelAdd()"
                class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="addForm.invalid || isSubmitting()"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white disabled:text-slate-200 px-4 py-2 rounded-lg transition-colors">
                {{ isSubmitting() ? 'Adding...' : 'Add to Wishlist' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Items List -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        @if (isLoading()) {
          <div class="p-8 text-center text-slate-500 dark:text-slate-400">
            Loading wishlist items...
          </div>
        } @else if (filteredItems().length === 0) {
          <div class="p-8 text-center">
            <div class="text-6xl mb-4">🛒</div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No items yet</h3>
            <p class="text-slate-500 dark:text-slate-400 mb-4">Start building your wishlist by adding items you want to purchase.</p>
            <button
              (click)="showAddForm = true"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Add First Item
            </button>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                @for (item of filteredItems(); track item.id) {
                  <tr [class.opacity-60]="item.purchased">
                    <!-- Item -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-slate-900 dark:text-slate-100"
                             [class.line-through]="item.purchased">
                          {{ item.name }}
                        </div>
                        @if (item.description) {
                          <div class="text-sm text-slate-500 dark:text-slate-400 truncate max-w-xs">
                            {{ item.description }}
                          </div>
                        }
                        @if (item.vendorUrl) {
                          <a [href]="item.vendorUrl" target="_blank" rel="noopener noreferrer"
                             class="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                            View at vendor →
                          </a>
                        }
                      </div>
                    </td>

                    <!-- Priority -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getPriorityBadgeClass(item.priority)"
                            class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                        {{ item.priority | titlecase }}
                      </span>
                    </td>

                    <!-- Price -->
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      @if (item.targetPrice > 0) {
                        \${{ item.targetPrice | number:'1.2-2' }}
                      } @else {
                        <span class="text-slate-400">—</span>
                      }
                    </td>

                    <!-- Category -->
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ item.inventoryTypeName || 'Unknown' }}
                    </td>

                    <!-- Status -->
                    <td class="px-6 py-4 whitespace-nowrap">
                      @if (item.purchased) {
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Purchased
                        </span>
                        @if (item.purchasedAt) {
                          <div class="text-xs text-slate-400 mt-1">
                            {{ item.purchasedAt | date:'short' }}
                          </div>
                        }
                      } @else {
                        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                          Wanted
                        </span>
                      }
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div class="flex space-x-2">
                        @if (!item.purchased) {
                          <button
                            (click)="purchaseItem(item)"
                            class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium">
                            Mark Purchased
                          </button>
                        }
                        <button
                          (click)="editItem(item)"
                          class="text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-300">
                          Edit
                        </button>
                        <button
                          (click)="deleteItem(item)"
                          class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Edit Modal -->
      @if (editingItem()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Item</h3>
                <button 
                  (click)="cancelEdit()"
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  ✕
                </button>
              </div>
              
              <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <!-- Same form fields as add form -->
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      formControlName="name"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Price</label>
                    <input
                      type="number"
                      formControlName="targetPrice"
                      min="0"
                      step="0.01"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Priority</label>
                    <select 
                      formControlName="priority"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Category</label>
                    <select 
                      formControlName="inventoryTypeId"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                      @for (type of inventoryTypes(); track type.id) {
                        <option [value]="type.id">{{ type.name }}</option>
                      }
                    </select>
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Vendor URL</label>
                    <input
                      type="url"
                      formControlName="vendorUrl"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                    <textarea
                      formControlName="description"
                      rows="3"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    </textarea>
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                    <textarea
                      formControlName="notes"
                      rows="2"
                      class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                    </textarea>
                  </div>
                  
                </div>

                <div class="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    (click)="cancelEdit()"
                    class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    [disabled]="editForm.invalid || isSubmitting()"
                    class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white disabled:text-slate-200 px-4 py-2 rounded-lg transition-colors">
                    {{ isSubmitting() ? 'Saving...' : 'Save Changes' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      }

    </div>
  `
})
export class WishlistComponent implements OnInit {
  private wishlistService = inject(WishlistService);
  private inventoryTypeService = inject(InventoryTypeService);
  private fb = inject(FormBuilder);

  // Signals
  items = signal<WishlistItem[]>([]);
  inventoryTypes = signal<InventoryType[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  editingItem = signal<WishlistItem | null>(null);

  // State
  showAddForm = false;

  // Forms
  filterForm = this.fb.group({
    priority: ['all'],
    purchased: [''],
    sort: ['date'],
    order: ['desc']
  });

  addForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    targetPrice: [0, [Validators.min(0)]],
    vendorUrl: [''],
    priority: ['medium' as WishlistPriority],
    inventoryTypeId: [1],
    notes: ['']
  });

  editForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    targetPrice: [0, [Validators.min(0)]],
    vendorUrl: [''],
    priority: ['medium' as WishlistPriority],
    inventoryTypeId: [1],
    notes: ['']
  });

  ngOnInit() {
    this.loadData();

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.loadItems();
    });
  }

  async loadData() {
    try {
      // Load inventory types
      this.inventoryTypeService.getInventoryTypes().subscribe({
        next: (types) => this.inventoryTypes.set(types),
        error: (error) => console.error('Error loading inventory types:', error)
      });

      await this.loadItems();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  loadItems() {
    const filters: WishlistFilters = {};
    const formValue = this.filterForm.value;

    if (formValue.priority && formValue.priority !== 'all') {
      filters.priority = formValue.priority;
    }
    if (formValue.purchased !== '') {
      filters.purchased = formValue.purchased === 'true';
    }
    if (formValue.sort) {
      filters.sort = formValue.sort as any;
    }
    if (formValue.order) {
      filters.order = formValue.order as any;
    }

    this.wishlistService.getWishlistItems(filters).subscribe({
      next: (items) => this.items.set(items),
      error: (error) => console.error('Error loading wishlist items:', error)
    });
  }

  // Computed values
  filteredItems() {
    return this.items();
  }

  totalItems() {
    return this.items().length;
  }

  purchasedCount() {
    return this.items().filter(item => item.purchased).length;
  }

  totalTargetCost() {
    return this.items().reduce((sum, item) => sum + item.targetPrice, 0);
  }

  remainingCost() {
    return this.items()
      .filter(item => !item.purchased)
      .reduce((sum, item) => sum + item.targetPrice, 0);
  }

  getPriorityBadgeClass(priority: WishlistPriority): string {
    const classes = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
      low: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
    };
    return classes[priority];
  }

  // Actions
  addItem() {
    if (this.addForm.valid) {
      this.isSubmitting.set(true);
      
      const formValue = this.addForm.value;
      const newItem: CreateWishlistItem = {
        name: formValue.name!,
        description: formValue.description || '',
        targetPrice: formValue.targetPrice || 0,
        vendorUrl: formValue.vendorUrl || '',
        priority: formValue.priority as WishlistPriority,
        inventoryTypeId: formValue.inventoryTypeId || 1,
        notes: formValue.notes || ''
      };

      this.wishlistService.createItem(newItem).subscribe({
        next: (item) => {
          this.items.update(items => [item, ...items]);
          this.cancelAdd();
        },
        error: (error) => {
          console.error('Error creating item:', error);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancelAdd() {
    this.showAddForm = false;
    this.addForm.reset({
      priority: 'medium',
      targetPrice: 0,
      inventoryTypeId: 1
    });
  }

  editItem(item: WishlistItem) {
    this.editingItem.set(item);
    this.editForm.patchValue({
      name: item.name,
      description: item.description,
      targetPrice: item.targetPrice,
      vendorUrl: item.vendorUrl,
      priority: item.priority,
      inventoryTypeId: item.inventoryTypeId,
      notes: item.notes
    });
  }

  saveEdit() {
    const item = this.editingItem();
    if (item && this.editForm.valid) {
      this.isSubmitting.set(true);

      const formValue = this.editForm.value;
      const updateData = {
        name: formValue.name!,
        description: formValue.description || '',
        targetPrice: formValue.targetPrice || 0,
        vendorUrl: formValue.vendorUrl || '',
        priority: formValue.priority as WishlistPriority,
        inventoryTypeId: formValue.inventoryTypeId || 1,
        notes: formValue.notes || ''
      };

      this.wishlistService.updateItem(item.id, updateData).subscribe({
        next: (updatedItem) => {
          this.items.update(items => 
            items.map(i => i.id === updatedItem.id ? updatedItem : i)
          );
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating item:', error);
        },
        complete: () => {
          this.isSubmitting.set(false);
        }
      });
    }
  }

  cancelEdit() {
    this.editingItem.set(null);
    this.editForm.reset();
  }

  purchaseItem(item: WishlistItem) {
    if (confirm(`Mark "${item.name}" as purchased and add it to your inventory?`)) {
      this.wishlistService.purchaseItem(item.id).subscribe({
        next: (result) => {
          // Update the item in the list
          this.items.update(items => 
            items.map(i => i.id === item.id ? { ...i, purchased: true, purchasedAt: new Date().toISOString() } : i)
          );
          
          // Could redirect to edit the new inventory item
          console.log('Item purchased, inventory item created:', result.inventoryItemId);
        },
        error: (error) => {
          console.error('Error purchasing item:', error);
          alert('Failed to purchase item. Please try again.');
        }
      });
    }
  }

  deleteItem(item: WishlistItem) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      this.wishlistService.deleteItem(item.id).subscribe({
        next: () => {
          this.items.update(items => items.filter(i => i.id !== item.id));
        },
        error: (error) => {
          console.error('Error deleting item:', error);
          alert('Failed to delete item. Please try again.');
        }
      });
    }
  }
}