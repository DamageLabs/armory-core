import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ItemService } from '../../../core/services/item.service';
import { InventoryTypeService } from '../../../core/services/inventory-type.service';
import { Item } from '../../../types/item';
import { InventoryType, FieldDefinition } from '../../../types/inventory-type';

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
          class="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {{ isEditMode() ? 'Edit Item' : 'Add New Item' }}
          </h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">
            {{ isEditMode() ? 'Update item information' : 'Create a new inventory item' }}
          </p>
        </div>
      </div>

      <!-- Error message -->
      @if (errorMessage()) {
        <div class="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-4 py-3 rounded-lg">
          {{ errorMessage() }}
        </div>
      }

      <!-- Form -->
      <form [formGroup]="itemForm" (ngSubmit)="onSubmit()" class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
        
        <!-- Basic Information -->
        <div class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">Basic Information</h2>
          
          <!-- Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Name <span class="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              formControlName="name"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter item name"
              [class.border-red-500]="itemForm.get('name')?.invalid && itemForm.get('name')?.touched"
            />
            @if (itemForm.get('name')?.invalid && itemForm.get('name')?.touched) {
              <p class="mt-1 text-sm text-red-400">Item name is required</p>
            }
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              formControlName="description"
              rows="3"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter item description">
            </textarea>
          </div>

          <!-- Quantity and Cost -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="quantity" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Quantity <span class="text-red-400">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                formControlName="quantity"
                min="0"
                class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
                [class.border-red-500]="itemForm.get('quantity')?.invalid && itemForm.get('quantity')?.touched"
              />
              @if (itemForm.get('quantity')?.invalid && itemForm.get('quantity')?.touched) {
                <p class="mt-1 text-sm text-red-400">Valid quantity is required</p>
              }
            </div>
            
            <div>
              <label for="cost" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Cost
              </label>
              <input
                id="cost"
                type="number"
                formControlName="cost"
                min="0"
                step="0.01"
                class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <!-- Location -->
          <div>
            <label for="location" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              formControlName="location"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Where is this item stored?"
            />
          </div>

          <!-- Parent Item -->
          <div>
            <label for="parentItemId" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Attach To (Parent Firearm)
            </label>
            <select
              id="parentItemId"
              formControlName="parentItemId"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
              <option value="">None (standalone item)</option>
              @for (parent of availableParents(); track parent.id) {
                <option [value]="parent.id">{{ parent.name }}</option>
              }
            </select>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select a firearm to attach this accessory to. Only firearms can be parent items.
            </p>
          </div>

          <!-- Expiration Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="expirationDate" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Expiration Date
              </label>
              <input
                id="expirationDate"
                type="date"
                formControlName="expirationDate"
                class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Optional expiration date for warranties, certifications, etc.
              </p>
            </div>
            
            <div>
              <label for="expirationNotes" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Expiration Notes
              </label>
              <input
                id="expirationNotes"
                type="text"
                formControlName="expirationNotes"
                class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Insurance policy renewal"
              />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Optional notes about what expires
              </p>
            </div>
          </div>

          <!-- Inventory Type -->
          <div>
            <label for="inventoryTypeId" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Inventory Type
            </label>
            <select
              id="inventoryTypeId"
              formControlName="inventoryTypeId"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
              <option value="">Select inventory type...</option>
              @for (type of inventoryTypes(); track type.id) {
                <option [value]="type.id">{{ type.name }}</option>
              }
            </select>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select type to enable custom fields (Firearms, Accessories, Ammunition)
            </p>
          </div>

          <!-- Notes -->
          <div>
            <label for="notes" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              formControlName="notes"
              rows="3"
              class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Additional notes about this item">
            </textarea>
          </div>
        </div>

        <!-- Custom Fields Section -->
        @if (selectedInventoryType() && getCustomFieldGroupKeys().length > 0) {
          <div class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-2">{{ selectedInventoryType()?.name }} Details</h2>
            
            <!-- Tabs (only show if multiple groups) -->
            @if (hasMultipleGroups()) {
              <nav class="flex space-x-8 border-b border-slate-200 dark:border-slate-700">
                @for (groupKey of getCustomFieldGroupKeys(); track groupKey) {
                  <button 
                    type="button"
                    (click)="activeCustomFieldTab.set(groupKey)"
                    [class]="activeCustomFieldTab() === groupKey ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
                    {{ groupKey }}
                  </button>
                }
              </nav>
            }
            
            <!-- Custom Field Forms -->
            @for (groupKey of getCustomFieldGroupKeys(); track groupKey) {
              @if (!hasMultipleGroups() || activeCustomFieldTab() === groupKey) {
                <div class="space-y-4">
                  @for (field of customFieldGroups()[groupKey]; track field.key) {
                    <div>
                      <label [for]="'custom-' + field.key" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                        {{ field.label }}
                        @if (field.required) {
                          <span class="text-red-400">*</span>
                        }
                      </label>
                      
                      <!-- Text Input -->
                      @if (field.type === 'text') {
                        <input
                          [id]="'custom-' + field.key"
                          type="text"
                          [value]="getCustomFieldValue(field.key)"
                          (input)="onCustomFieldTextChange(field.key, $event)"
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      }
                      
                      <!-- Number Input -->
                      @if (field.type === 'number') {
                        <input
                          [id]="'custom-' + field.key"
                          type="number"
                          [value]="getCustomFieldValue(field.key)"
                          (input)="onCustomFieldNumberChange(field.key, $event)"
                          [placeholder]="field.placeholder || ''"
                          class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      }
                      
                      <!-- Select Input -->
                      @if (field.type === 'select' && field.options) {
                        <select
                          [id]="'custom-' + field.key"
                          [value]="getCustomFieldValue(field.key)"
                          (change)="onCustomFieldSelectChange(field.key, $event)"
                          class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent">
                          <option value="">{{ field.placeholder || 'Select an option...' }}</option>
                          @for (option of field.options; track option) {
                            <option [value]="option">{{ option }}</option>
                          }
                        </select>
                      }
                      
                      <!-- Date Input -->
                      @if (field.type === 'date') {
                        <input
                          [id]="'custom-' + field.key"
                          type="date"
                          [value]="getCustomFieldValue(field.key)"
                          (input)="onCustomFieldDateChange(field.key, $event)"
                          class="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                      }
                      
                      <!-- Boolean Input -->
                      @if (field.type === 'boolean') {
                        <div class="flex items-center space-x-3">
                          <input
                            [id]="'custom-' + field.key"
                            type="checkbox"
                            [checked]="getCustomFieldValue(field.key)"
                            (change)="onCustomFieldBooleanChange(field.key, $event)"
                            class="w-4 h-4 text-amber-500 bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded focus:ring-amber-500 focus:ring-2"
                          />
                          <label [for]="'custom-' + field.key" class="text-sm text-slate-600 dark:text-slate-300">
                            {{ field.placeholder || 'Yes' }}
                          </label>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            }
          </div>
        }

        <!-- Form actions -->
        <div class="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            (click)="goBack()"
            class="px-6 py-3 text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300 font-medium transition-colors duration-200">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="itemForm.invalid || isLoading()"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
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
  private inventoryTypeService = inject(InventoryTypeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  itemForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  isEditMode = signal(false);
  itemId: string | null = null;
  availableParents = signal<Item[]>([]);
  inventoryTypes = signal<InventoryType[]>([]);
  selectedInventoryType = signal<InventoryType | null>(null);
  customFieldGroups = signal<{[key: string]: FieldDefinition[]}>({});
  activeCustomFieldTab = signal<string>('Details');

  constructor() {
    this.itemForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      quantity: [1, [Validators.required, Validators.min(0)]],
      cost: [null, Validators.min(0)],
      location: [''],
      notes: [''],
      parentItemId: [null],
      inventoryTypeId: [null],
      customFields: [{}],
      expirationDate: [null],
      expirationNotes: ['']
    });
  }

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id');
    this.loadAvailableParents();
    this.loadInventoryTypes();
    
    // Watch for inventory type changes
    this.itemForm.get('inventoryTypeId')?.valueChanges.subscribe((typeId) => {
      if (typeId) {
        this.loadCustomFieldSchema(typeId);
      } else {
        this.clearCustomFieldSchema();
      }
    });
    
    if (this.itemId) {
      this.isEditMode.set(true);
      this.loadItem();
    }
  }

  private loadAvailableParents(): void {
    // Load firearms that can be parent items
    this.itemService.getFirearms().subscribe({
      next: (firearms) => {
        // Filter out the current item if editing
        const filtered = firearms.filter(firearm => 
          !this.itemId || firearm.id !== Number(this.itemId)
        );
        this.availableParents.set(filtered);
      },
      error: (error) => {
        console.error('Failed to load available parents:', error);
        // Don't show error for this - it's not critical
      }
    });
  }

  private loadInventoryTypes(): void {
    this.inventoryTypeService.getInventoryTypes().subscribe({
      next: (types) => {
        this.inventoryTypes.set(types);
      },
      error: (error) => {
        console.error('Failed to load inventory types:', error);
        this.errorMessage.set('Failed to load inventory types. Please try again.');
      }
    });
  }

  private loadCustomFieldSchema(typeId: number): void {
    const type = this.inventoryTypes().find(t => t.id === typeId);
    if (!type) return;
    
    this.selectedInventoryType.set(type);
    
    // Group fields by their group property (default to "Details")
    const grouped: {[key: string]: FieldDefinition[]} = {};
    
    type.schema.forEach(field => {
      const group = field.group || 'Details';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(field);
    });
    
    this.customFieldGroups.set(grouped);
    
    // Set active tab to first group
    const groups = Object.keys(grouped);
    if (groups.length > 0) {
      this.activeCustomFieldTab.set(groups[0]);
    }
    
    // Initialize custom fields form group with existing values or defaults
    this.initializeCustomFieldsForm(type.schema);
  }

  private clearCustomFieldSchema(): void {
    this.selectedInventoryType.set(null);
    this.customFieldGroups.set({});
    this.activeCustomFieldTab.set('Details');
    // Clear custom fields from form
    this.itemForm.patchValue({ customFields: {} });
  }

  private initializeCustomFieldsForm(schema: FieldDefinition[]): void {
    const currentCustomFields = this.itemForm.get('customFields')?.value || {};
    const updatedCustomFields: any = {};
    
    schema.forEach(field => {
      // Preserve existing values or set defaults
      if (currentCustomFields[field.key] !== undefined) {
        updatedCustomFields[field.key] = currentCustomFields[field.key];
      } else {
        // Set default values based on field type
        switch (field.type) {
          case 'boolean':
            updatedCustomFields[field.key] = false;
            break;
          case 'number':
            updatedCustomFields[field.key] = null;
            break;
          default:
            updatedCustomFields[field.key] = '';
        }
      }
    });
    
    this.itemForm.patchValue({ customFields: updatedCustomFields });
  }

  private loadItem(): void {
    if (!this.itemId) return;
    
    this.isLoading.set(true);
    this.itemService.getItem(Number(this.itemId)).subscribe({
      next: (item) => {
        // Map backend fields to form fields
        const formData = {
          ...item,
          cost: item.unitValue || null
        };
        this.itemForm.patchValue(formData);
        
        // Load custom field schema if inventory type is set
        if (item.inventoryTypeId) {
          this.loadCustomFieldSchema(item.inventoryTypeId);
        }
        
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

      const formData = { ...this.itemForm.value };
      
      // Map form fields to backend API fields
      if (formData.cost !== null && formData.cost !== undefined) {
        formData.unitValue = formData.cost;
        delete formData.cost;
      }
      
      // Convert empty string to null for parentItemId
      if (formData.parentItemId === '' || formData.parentItemId === undefined) {
        formData.parentItemId = null;
      } else if (formData.parentItemId) {
        formData.parentItemId = Number(formData.parentItemId);
      }

      // Convert empty expiration date to null
      if (formData.expirationDate === '' || formData.expirationDate === undefined) {
        formData.expirationDate = null;
      }

      // Convert empty expiration notes to empty string
      if (!formData.expirationNotes) {
        formData.expirationNotes = '';
      }
      
      const request = this.isEditMode() && this.itemId 
        ? this.itemService.updateItem(Number(this.itemId), formData)
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

  // Helper method to get custom field value
  getCustomFieldValue(fieldKey: string): any {
    const customFields = this.itemForm.get('customFields')?.value || {};
    return customFields[fieldKey];
  }

  // Helper method to update custom field value
  updateCustomFieldValue(fieldKey: string, value: any): void {
    const currentCustomFields = this.itemForm.get('customFields')?.value || {};
    const updatedCustomFields = {
      ...currentCustomFields,
      [fieldKey]: value
    };
    this.itemForm.patchValue({ customFields: updatedCustomFields });
  }

  // Helper method to check if field has group tabs
  hasMultipleGroups(): boolean {
    return Object.keys(this.customFieldGroups()).length > 1;
  }

  // Helper method to get available groups
  getCustomFieldGroupKeys(): string[] {
    return Object.keys(this.customFieldGroups());
  }

  // Event handlers for custom fields
  onCustomFieldTextChange(fieldKey: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateCustomFieldValue(fieldKey, target.value);
  }

  onCustomFieldNumberChange(fieldKey: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateCustomFieldValue(fieldKey, target.value ? +target.value : null);
  }

  onCustomFieldSelectChange(fieldKey: string, event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.updateCustomFieldValue(fieldKey, target.value);
  }

  onCustomFieldDateChange(fieldKey: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateCustomFieldValue(fieldKey, target.value);
  }

  onCustomFieldBooleanChange(fieldKey: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateCustomFieldValue(fieldKey, target.checked);
  }
}