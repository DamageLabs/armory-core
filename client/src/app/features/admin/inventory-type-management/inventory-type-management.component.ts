import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryTypeService } from '../../../core/services/inventory-type.service';
import { InventoryType, FieldDefinition, FieldType } from '../../../types/inventory-type';

@Component({
  selector: 'app-inventory-type-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Inventory Type Management</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Manage inventory types and custom field schemas</p>
      </div>

      <!-- Inventory types list -->
      @if (inventoryTypes(); as types) {
        @for (type of types; track type.id) {
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            <!-- Type header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {{ type.name }} ({{ type.schema.length }} fields)
                </h2>
                <button
                  (click)="toggleAddFieldForm(type.id)"
                  class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                  {{ showAddFieldForm() === type.id ? 'Cancel' : 'Add Field' }}
                </button>
              </div>
            </div>

            <!-- Add field form -->
            @if (showAddFieldForm() === type.id) {
              <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <form [formGroup]="addFieldForm" (ngSubmit)="addField(type)" class="space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- Field key -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Field Key</label>
                      <input
                        type="text"
                        formControlName="key"
                        placeholder="fieldName"
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    
                    <!-- Field label -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Label</label>
                      <input
                        type="text"
                        formControlName="label"
                        placeholder="Field Label"
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    
                    <!-- Field type -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                      <select
                        formControlName="type"
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                        <option value="date">Date</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </div>
                    
                    <!-- Required checkbox -->
                    <div class="flex items-center">
                      <div class="flex items-center h-5">
                        <input
                          type="checkbox"
                          formControlName="required"
                          class="h-4 w-4 text-amber-500 focus:ring-amber-500 border-slate-600 rounded"
                        />
                        <label class="ml-2 text-sm text-slate-700 dark:text-slate-300">Required</label>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Additional fields -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Placeholder -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Placeholder (optional)</label>
                      <input
                        type="text"
                        formControlName="placeholder"
                        placeholder="Enter placeholder text..."
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                    
                    <!-- Group -->
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group (optional)</label>
                      <input
                        type="text"
                        formControlName="group"
                        placeholder="Details"
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                      />
                    </div>
                  </div>
                  
                  <!-- Options for select type -->
                  @if (addFieldForm.get('type')?.value === 'select') {
                    <div>
                      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Options (one per line)</label>
                      <textarea
                        formControlName="options"
                        rows="4"
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                        class="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                      </textarea>
                    </div>
                  }
                  
                  <div class="flex justify-end space-x-3">
                    <button
                      type="button"
                      (click)="cancelAddField()"
                      class="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors duration-200">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      [disabled]="addFieldForm.invalid || isUpdating()"
                      class="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-slate-900 font-medium rounded-lg transition-colors duration-200">
                      {{ isUpdating() ? 'Adding...' : 'Add Field' }}
                    </button>
                  </div>
                </form>
              </div>
            }

            <!-- Schema fields -->
            @if (type.schema.length > 0) {
              
              <!-- Desktop table -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Field</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Required</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Group</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Options</th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700">
                    @for (field of type.schema; track field.key; let i = $index) {
                      <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                        <td class="px-6 py-4">
                          <div>
                            <div class="font-medium text-slate-900 dark:text-slate-100">{{ field.label }}</div>
                            <div class="text-sm text-slate-500 dark:text-slate-400">{{ field.key }}</div>
                            @if (field.placeholder) {
                              <div class="text-xs text-slate-400 dark:text-slate-500">{{ field.placeholder }}</div>
                            }
                          </div>
                        </td>
                        <td class="px-6 py-4">
                          <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                            {{ field.type }}
                          </span>
                        </td>
                        <td class="px-6 py-4">
                          <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                                [class]="field.required ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
                            {{ field.required ? 'Yes' : 'No' }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                          {{ field.group || 'Details' }}
                        </td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                          @if (field.options && field.options.length > 0) {
                            <div class="text-sm">
                              {{ field.options.join(', ') }}
                            </div>
                          } @else {
                            -
                          }
                        </td>
                        <td class="px-6 py-4 text-right">
                          <button
                            (click)="removeField(type, i)"
                            class="text-red-400 hover:text-red-300 text-sm font-medium">
                            Remove
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Mobile cards -->
              <div class="md:hidden space-y-4 p-4">
                @for (field of type.schema; track field.key; let i = $index) {
                  <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    <div class="flex items-start justify-between mb-2">
                      <div>
                        <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ field.label }}</h3>
                        <p class="text-sm text-slate-500 dark:text-slate-400">{{ field.key }}</p>
                        @if (field.placeholder) {
                          <p class="text-xs text-slate-400 dark:text-slate-500">{{ field.placeholder }}</p>
                        }
                      </div>
                      <button
                        (click)="removeField(type, i)"
                        class="text-red-400 hover:text-red-300 text-sm ml-4">
                        Remove
                      </button>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 text-xs">
                      <span class="inline-flex px-2 py-1 font-medium rounded-full bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200">
                        {{ field.type }}
                      </span>
                      <span class="inline-flex px-2 py-1 font-medium rounded-full"
                            [class]="field.required ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200'">
                        {{ field.required ? 'Required' : 'Optional' }}
                      </span>
                      <span class="inline-flex px-2 py-1 font-medium rounded-full bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200">
                        {{ field.group || 'Details' }}
                      </span>
                    </div>
                    
                    @if (field.options && field.options.length > 0) {
                      <div class="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        <strong>Options:</strong> {{ field.options.join(', ') }}
                      </div>
                    }
                  </div>
                }
              </div>

            } @else {
              <!-- Empty schema -->
              <div class="px-6 py-8 text-center">
                <div class="text-4xl mb-2">📝</div>
                <p class="text-slate-500 dark:text-slate-400">No custom fields defined for this type.</p>
              </div>
            }
          </div>
        }
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading inventory types...</p>
        </div>
      }
    </div>
  `
})
export class InventoryTypeManagementComponent implements OnInit {
  private inventoryTypeService = inject(InventoryTypeService);
  private fb = inject(FormBuilder);

  inventoryTypes = signal<InventoryType[]>([]);
  isLoading = signal(false);
  isUpdating = signal(false);
  showAddFieldForm = signal<number | null>(null);

  addFieldForm = this.fb.group({
    key: ['', [Validators.required]],
    label: ['', [Validators.required]],
    type: ['text' as FieldType, [Validators.required]],
    required: [false],
    placeholder: [''],
    group: [''],
    options: ['']
  });

  ngOnInit(): void {
    this.loadInventoryTypes();
  }

  private loadInventoryTypes(): void {
    this.isLoading.set(true);
    this.inventoryTypeService.getInventoryTypes().subscribe({
      next: (types) => {
        this.inventoryTypes.set(types);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load inventory types:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleAddFieldForm(typeId: number): void {
    if (this.showAddFieldForm() === typeId) {
      this.showAddFieldForm.set(null);
      this.addFieldForm.reset();
    } else {
      this.showAddFieldForm.set(typeId);
      this.addFieldForm.patchValue({ type: 'text' });
    }
  }

  cancelAddField(): void {
    this.showAddFieldForm.set(null);
    this.addFieldForm.reset();
  }

  addField(type: InventoryType): void {
    if (this.addFieldForm.valid) {
      this.isUpdating.set(true);
      
      const formValue = this.addFieldForm.value;
      const newField: FieldDefinition = {
        key: formValue.key!,
        label: formValue.label!,
        type: formValue.type!,
        required: formValue.required || false,
        placeholder: formValue.placeholder || undefined,
        group: formValue.group || undefined
      };

      // Add options if it's a select field
      if (formValue.type === 'select' && formValue.options) {
        newField.options = formValue.options.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
      }

      const updatedSchema = [...type.schema, newField];
      
      this.inventoryTypeService.updateInventoryType(type.id, { schema: updatedSchema }).subscribe({
        next: () => {
          this.addFieldForm.reset();
          this.showAddFieldForm.set(null);
          this.loadInventoryTypes(); // Reload to get updated data
          this.isUpdating.set(false);
        },
        error: (error: any) => {
          console.error('Failed to add field:', error);
          alert('Failed to add field. Please try again.');
          this.isUpdating.set(false);
        }
      });
    }
  }

  removeField(type: InventoryType, fieldIndex: number): void {
    const field = type.schema[fieldIndex];
    const confirmMessage = `Are you sure you want to remove the field "${field.label}"? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      this.isUpdating.set(true);
      const updatedSchema = type.schema.filter((_, index) => index !== fieldIndex);
      
      this.inventoryTypeService.updateInventoryType(type.id, { schema: updatedSchema }).subscribe({
        next: () => {
          this.loadInventoryTypes(); // Reload to get updated data
          this.isUpdating.set(false);
        },
        error: (error: any) => {
          console.error('Failed to remove field:', error);
          alert('Failed to remove field. Please try again.');
          this.isUpdating.set(false);
        }
      });
    }
  }
}