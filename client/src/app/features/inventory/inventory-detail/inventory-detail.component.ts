import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../../core/services/item.service';
import { Item } from '../../../types/item';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading item details...</p>
        </div>
      }

      <!-- Error state -->
      @if (errorMessage()) {
        <div class="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-4 py-3 rounded-lg">
          {{ errorMessage() }}
        </div>
      }

      <!-- Item details -->
      @if (item(); as itemData) {
        
        <!-- Page header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4">
            <button 
              (click)="goBack()"
              class="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ itemData.name }}</h1>
              @if (itemData.description) {
                <p class="mt-1 text-slate-500 dark:text-slate-400">{{ itemData.description }}</p>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <a [routerLink]="['/inventory', itemData.id, 'edit']"
               class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
              Edit
            </a>
            <button
              (click)="deleteItem()"
              class="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
              Delete
            </button>
          </div>
        </div>

        <!-- Main content -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Item information -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Basic info -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Item Information</h2>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                  <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.name }}</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                  <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.quantity | number }}</p>
                </div>
                
                @if (itemData.unitValue) {
                  <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Cost</label>
                    <p class="text-slate-900 dark:text-slate-100 font-medium">{{ formatCurrency(itemData.unitValue) }}</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</label>
                    <p class="text-slate-900 dark:text-slate-100 font-medium">{{ formatCurrency(itemData.unitValue * itemData.quantity) }}</p>
                  </div>
                }
                
                @if (itemData.location) {
                  <div>
                    <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Location</label>
                    <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.location }}</p>
                  </div>
                }
              </div>
              
              @if (itemData.description) {
                <div class="mt-6">
                  <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
                  <p class="text-slate-900 dark:text-slate-100">{{ itemData.description }}</p>
                </div>
              }
              
              @if (itemData.description) {
                <div class="mt-6">
                  <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Notes</label>
                  <p class="text-slate-900 dark:text-slate-100">{{ itemData.description }}</p>
                </div>
              }
            </div>

            <!-- Custom fields -->
            @if (hasCustomFields(itemData.customFields)) {
              <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Additional Information</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  @for (field of getCustomFieldEntries(itemData.customFields); track field.key) {
                    <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{{ field.key }}</label>
                      <p class="text-slate-900 dark:text-slate-100">{{ field.value || '-' }}</p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            
            <!-- Quick stats -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Stats</h3>
              
              <div class="space-y-4">
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Created</span>
                  <span class="text-slate-900 dark:text-slate-100">{{ formatDate(itemData.createdAt) }}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Updated</span>
                  <span class="text-slate-900 dark:text-slate-100">{{ formatDate(itemData.updatedAt) }}</span>
                </div>
                
                @if (itemData.unitValue && itemData.quantity) {
                  <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div class="flex justify-between">
                      <span class="text-slate-500 dark:text-slate-400">Individual Value</span>
                      <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(itemData.unitValue) }}</span>
                    </div>
                    <div class="flex justify-between font-medium">
                      <span class="text-slate-600 dark:text-slate-300">Total Value</span>
                      <span class="text-amber-400">{{ formatCurrency(itemData.unitValue * itemData.quantity) }}</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Actions -->
            <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Actions</h3>
              
              <div class="space-y-3">
                <a [routerLink]="['/inventory', itemData.id, 'edit']"
                   class="block w-full text-center bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-3 rounded-lg transition-colors duration-200">
                  Edit Item
                </a>
                
                <button
                  (click)="duplicateItem()"
                  class="block w-full text-center bg-slate-600 hover:bg-slate-500 text-slate-900 dark:text-slate-100 font-semibold px-4 py-3 rounded-lg transition-colors duration-200">
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InventoryDetailComponent implements OnInit {
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  item = signal<Item | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    const itemId = this.route.snapshot.paramMap.get('id');
    if (itemId) {
      this.loadItem(itemId);
    }
  }

  private loadItem(id: string): void {
    this.isLoading.set(true);
    this.itemService.getItem(Number(id)).subscribe({
      next: (item) => {
        this.item.set(item);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load item details. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load item:', error);
      }
    });
  }

  deleteItem(): void {
    const itemData = this.item();
    if (!itemData) return;

    if (confirm(`Are you sure you want to delete "${itemData.name}"? This action cannot be undone.`)) {
      this.itemService.deleteItem(itemData.id).subscribe({
        next: () => {
          this.router.navigate(['/inventory']);
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete item. Please try again.');
          console.error('Failed to delete item:', error);
        }
      });
    }
  }

  duplicateItem(): void {
    const itemData = this.item();
    if (!itemData) return;

    // Create a copy with modified name and reset ID
    const duplicateData = {
      ...itemData,
      name: `${itemData.name} (Copy)`,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    };

    this.itemService.createItem(duplicateData).subscribe({
      next: (newItem) => {
        this.router.navigate(['/inventory', newItem.id]);
      },
      error: (error) => {
        this.errorMessage.set('Failed to duplicate item. Please try again.');
        console.error('Failed to duplicate item:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  hasCustomFields(customFields: Record<string, any>): boolean {
    return customFields && Object.keys(customFields).length > 0;
  }

  getCustomFieldEntries(customFields: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(customFields || {}).map(([key, value]) => ({ key, value }));
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }
}