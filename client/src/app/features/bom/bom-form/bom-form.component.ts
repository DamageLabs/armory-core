import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BomService } from '../../../core/services/bom.service';
import { ItemService } from '../../../core/services/item.service';
import { Bom, CreateBomRequest, UpdateBomRequest } from '../../../types/bom';
import { Item } from '../../../types/item';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-bom-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div>
        <nav class="text-sm text-slate-500 dark:text-slate-400 mb-2">
          <a routerLink="/boms" class="hover:text-slate-700 dark:hover:text-slate-300">BOMs</a>
          <span class="mx-2">/</span>
          <span>{{ isEditing() ? 'Edit BOM' : 'Create BOM' }}</span>
        </nav>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {{ isEditing() ? 'Edit BOM' : 'Create New BOM' }}
        </h1>
      </div>

      <!-- Form -->
      <form [formGroup]="bomForm" (ngSubmit)="onSubmit()" class="space-y-6">
        
        <!-- Basic information -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">BOM Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Name -->
            <div class="md:col-span-2">
              <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                BOM Name <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                formControlName="name"
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter BOM name"
              />
              @if (bomForm.get('name')?.invalid && bomForm.get('name')?.touched) {
                <p class="text-red-500 text-sm mt-1">BOM name is required</p>
              }
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Enter BOM description"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Items section -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">BOM Items</h2>
            <button
              type="button"
              (click)="addItem()"
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200">
              Add Item
            </button>
          </div>

          <div formArrayName="items" class="space-y-4">
            @for (itemControl of itemsFormArray.controls; track $index) {
              <div [formGroupName]="$index" class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  
                  <!-- Item Search -->
                  <div class="md:col-span-3">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Item <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input
                        type="text"
                        [value]="getSelectedItemName($index)"
                        (input)="onItemSearch($event, $index)"
                        placeholder="Search for items..."
                        class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                      
                      <!-- Search results dropdown -->
                      @if (searchResults()[$index] && searchResults()[$index].length > 0) {
                        <div class="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          @for (item of searchResults()[$index]; track item.id) {
                            <button
                              type="button"
                              (click)="selectItem(item, $index)"
                              class="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                              <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</div>
                              <div class="text-sm text-slate-500 dark:text-slate-400">
                                Stock: {{ item.quantity }} • {{ item.unitValue ? formatCurrency(item.unitValue) : 'No price' }}
                              </div>
                            </button>
                          }
                        </div>
                      }
                    </div>
                    <input type="hidden" formControlName="itemId" />
                  </div>

                  <!-- Quantity -->
                  <div class="md:col-span-1">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Quantity <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      formControlName="quantity"
                      min="1"
                      class="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>

                  <!-- Unit Cost (read-only) -->
                  <div class="md:col-span-1">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Unit Cost
                    </label>
                    <input
                      type="text"
                      [value]="getItemUnitValue($index)"
                      readonly
                      class="w-full px-4 py-2 bg-slate-200 dark:bg-slate-600 border border-slate-600 rounded-lg text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <!-- Remove button -->
                  <div class="md:col-span-1">
                    <button
                      type="button"
                      (click)="removeItem($index)"
                      class="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          @if (itemsFormArray.length === 0) {
            <div class="text-center py-8 text-slate-500 dark:text-slate-400">
              No items added yet. Click "Add Item" to get started.
            </div>
          }
        </div>

        <!-- Form actions -->
        <div class="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <a routerLink="/boms" 
             class="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            Cancel
          </a>
          <div class="flex items-center space-x-3">
            <button
              type="submit"
              [disabled]="bomForm.invalid || isSubmitting()"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white disabled:text-slate-200 font-semibold px-6 py-2 rounded-lg transition-colors duration-200">
              @if (isSubmitting()) {
                <span class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ isEditing() ? 'Updating...' : 'Creating...' }}
                </span>
              } @else {
                {{ isEditing() ? 'Update BOM' : 'Create BOM' }}
              }
            </button>
          </div>
        </div>
      </form>
    </div>

    <!-- Click outside to close search dropdowns -->
    @if (hasOpenSearchDropdown()) {
      <div class="fixed inset-0 z-5" (click)="closeAllSearchDropdowns()"></div>
    }
  `
})
export class BomFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bomService = inject(BomService);
  private itemService = inject(ItemService);

  bomForm = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    items: this.fb.array([])
  });

  isEditing = signal(false);
  isSubmitting = signal(false);
  searchResults = signal<{ [index: number]: Item[] }>({});
  selectedItems = signal<{ [index: number]: Item }>({});

  get itemsFormArray(): FormArray {
    return this.bomForm.get('items') as FormArray;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing.set(true);
      this.loadBom(Number(id));
    }
  }

  private loadBom(id: number): void {
    this.bomService.getBom(id).subscribe({
      next: (bom) => {
        this.bomForm.patchValue({
          name: bom.name,
          description: bom.description
        });

        // Clear existing items and add loaded ones
        this.itemsFormArray.clear();
        bom.items?.forEach((item, index) => {
          const itemForm = this.fb.group({
            itemId: [item.itemId, [Validators.required]],
            quantity: [item.quantity, [Validators.required, Validators.min(1)]]
          });
          this.itemsFormArray.push(itemForm);

          // Store item details for display
          if (item.itemName) {
            this.selectedItems.update(items => ({
              ...items,
              [index]: {
                id: item.itemId,
                name: item.itemName,
                unitValue: item.unitValue || 0
              } as Item
            }));
          }
        });
      },
      error: (error) => {
        console.error('Failed to load BOM:', error);
        this.router.navigate(['/boms']);
      }
    });
  }

  addItem(): void {
    const itemForm = this.fb.group({
      itemId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
    this.itemsFormArray.push(itemForm);
  }

  removeItem(index: number): void {
    this.itemsFormArray.removeAt(index);
    
    // Clean up search results and selected items for this index
    this.searchResults.update(results => {
      const newResults = { ...results };
      delete newResults[index];
      // Shift higher indexes down
      Object.keys(newResults).forEach(key => {
        const numKey = Number(key);
        if (numKey > index) {
          newResults[numKey - 1] = newResults[numKey];
          delete newResults[numKey];
        }
      });
      return newResults;
    });

    this.selectedItems.update(items => {
      const newItems = { ...items };
      delete newItems[index];
      // Shift higher indexes down
      Object.keys(newItems).forEach(key => {
        const numKey = Number(key);
        if (numKey > index) {
          newItems[numKey - 1] = newItems[numKey];
          delete newItems[numKey];
        }
      });
      return newItems;
    });
  }

  onItemSearch(event: Event, index: number): void {
    const query = (event.target as HTMLInputElement).value;
    
    if (query.length < 2) {
      this.searchResults.update(results => ({ ...results, [index]: [] }));
      return;
    }

    // Search for items
    this.itemService.getItems({ search: query, pageSize: 10 }).subscribe({
      next: (response) => {
        this.searchResults.update(results => ({ ...results, [index]: response.data }));
      },
      error: (error) => {
        console.error('Failed to search items:', error);
      }
    });
  }

  selectItem(item: Item, index: number): void {
    // Update form control
    const itemFormGroup = this.itemsFormArray.at(index) as FormGroup;
    itemFormGroup.patchValue({ itemId: item.id });

    // Store selected item for display
    this.selectedItems.update(items => ({ ...items, [index]: item }));

    // Clear search results for this index
    this.searchResults.update(results => ({ ...results, [index]: [] }));
  }

  getSelectedItemName(index: number): string {
    const item = this.selectedItems()[index];
    return item ? item.name : '';
  }

  getItemUnitValue(index: number): string {
    const item = this.selectedItems()[index];
    return item && item.unitValue ? this.formatCurrency(item.unitValue) : '-';
  }

  hasOpenSearchDropdown(): boolean {
    return Object.values(this.searchResults()).some(results => results.length > 0);
  }

  closeAllSearchDropdowns(): void {
    this.searchResults.set({});
  }

  onSubmit(): void {
    if (this.bomForm.valid) {
      this.isSubmitting.set(true);
      
      const formValue = this.bomForm.value;
      const request = {
        name: formValue.name!,
        description: formValue.description || '',
        items: formValue.items!.map((item: any) => ({
          itemId: item.itemId!,
          quantity: item.quantity!
        }))
      };

      const operation = this.isEditing()
        ? this.bomService.updateBom(Number(this.route.snapshot.paramMap.get('id')), request as UpdateBomRequest)
        : this.bomService.createBom(request as CreateBomRequest);

      operation.subscribe({
        next: (bom) => {
          this.router.navigate(['/boms', bom.id]);
        },
        error: (error) => {
          console.error('Failed to save BOM:', error);
          alert('Failed to save BOM. Please try again.');
          this.isSubmitting.set(false);
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