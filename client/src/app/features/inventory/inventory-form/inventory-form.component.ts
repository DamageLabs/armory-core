import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ItemService } from '../../../core/services/item.service';
import { Item } from '../../../types/item';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Page header -->
      <div class="flex items-center space-x-4">
        <button 
          (click)="goBack()"
          class="text-slate-400 hover:text-slate-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div>
          <h1 class="text-3xl font-bold text-slate-100">
            {{ isEditMode() ? 'Edit Item' : 'Add New Item' }}
          </h1>
          <p class="mt-1 text-slate-400">
            {{ isEditMode() ? 'Update item information' : 'Create a new inventory item' }}
          </p>
        </div>
      </div>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
          {{ errorMessage() }}
        </div>
      }

      <!-- Form -->
      <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-6">
        
        <!-- Basic Information -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-100 border-b border-slate-700 pb-2">Basic Information</h2>
          
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-slate-300 mb-1">
              Name <span class="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter item name"
              [class.border-red-500]="itemForm.get('name')?.invalid && itemForm.get('name')?.touched"
            />
            @if (itemForm.get('name')?.invalid && itemForm.get('name')?.touched) {
              <p class="mt-1 text-sm text-red-400">Item name is required</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter item description">
            </textarea>
          </div>

          <!-- Quantity and Cost -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="quantity" class="block text-sm font-medium text-slate-300 mb-1">
                Quantity <span class="text-red-400">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                formControlName="quantity"
                min="0"
                class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                [class.border-red-500]="itemForm.get('quantity')?.invalid && itemForm.get('quantity')?.touched"
              />
              @if (itemForm.get('quantity')?.invalid && itemForm.get('quantity')?.touched) {
                <p class="mt-1 text-sm text-red-400">Valid quantity is required</p>
              }
            </div>
            
            <div>
              <label for="cost" class="block text-sm font-medium text-slate-300 mb-1">
                Cost
              </label>
              <input
                id="cost"
                type="number"
                formControlName="cost"
                min="0"
                step="0.01"
                class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-slate-300 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              formControlName="location"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Where is this item stored?"
            />
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              formControlName="notes"
              rows="3"
              class="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Additional notes about this item">
            </textarea>
          </div>
        </div>

        <!-- Form actions -->
        <div class="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700">
          <button
            type="button"
            (click)="goBack()"
            class="px-6 py-3 text-slate-400 hover:text-slate-300 font-medium transition-colors duration-200">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="itemForm.invalid || isLoading()"
            class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
            @if (isLoading()) {
              <span class="flex items-center space-x-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isEditMode() ? 'Updating...' : 'Creating...' }}</span>
              </span>
            } @else {
              {{ isEditMode() ? 'Update Item' : 'Create Item' }}
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class InventoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private itemService = inject(ItemService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  itemForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  isEditMode = signal(false);
  itemId: string | null = null;

  constructor() {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0)]],
      cost: [null, Validators.min(0)],
      location: [''],
      notes: [''],
      custom_fields: [{}]
    });
  }

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    
    if (this.itemId) {
      this.isEditMode.set(true);
      this.loadItem();
    }
  }

  private loadItem(): void {
    if (!this.itemId) return;
    
    this.isLoading.set(true);
    this.itemService.getItem(this.itemId).subscribe({
      next: (item) => {
        this.itemForm.patchValue(item);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load item. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load item:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const formData = this.itemForm.value;
      
      const request = this.isEditMode() && this.itemId 
        ? this.itemService.updateItem(this.itemId, formData)
        : this.itemService.createItem(formData);

      request.subscribe({
        next: (item) => {
          this.router.navigate(['/inventory', item.id]);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Failed to save item. Please try again.');
          console.error('Failed to save item:', error);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }
}