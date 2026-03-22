import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CategoryService } from '../../../core/services/category.service';
import { InventoryTypeService } from '../../../core/services/inventory-type.service';
import { Category, CategoryFormData, CategoriesGrouped } from '../../../types/category';
import { InventoryType } from '../../../types/inventory-type';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Category Management</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Manage inventory categories by type</p>
        </div>
        <button
          (click)="showCreateForm.set(!showCreateForm())"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 text-center">
          {{ showCreateForm() ? 'Cancel' : 'Add Category' }}
        </button>
      </div>

      <!-- Create category form -->
      @if (showCreateForm()) {
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Create New Category</h2>
          <form [formGroup]="createForm" (ngSubmit)="createCategory()" class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <input
                type="text"
                formControlName="name"
                placeholder="Category name..."
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <div class="w-full sm:w-48">
              <select
                formControlName="inventoryTypeId"
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="">Select type...</option>
                @for (type of inventoryTypes(); track type.id) {
                  <option [value]="type.id">{{ type.name }}</option>
                }
              </select>
            </div>
            <button
              type="submit"
              [disabled]="createForm.invalid || isCreating()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200">
              {{ isCreating() ? 'Creating...' : 'Create' }}
            </button>
          </form>
        </div>
      }

      <!-- Categories grouped by type -->
      @if (categoriesGrouped(); as grouped) {
        @for (typeName of Object.keys(grouped); track typeName) {
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            <!-- Type header -->
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ typeName }} ({{ grouped[typeName].length }})
              </h2>
            </div>

            @if (grouped[typeName].length > 0) {
              
              <!-- Desktop table -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sort Order</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-700">
                    @for (category of grouped[typeName]; track category.id) {
                      <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                        <td class="px-6 py-4">
                          @if (editingCategory()?.id === category.id) {
                            <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="flex items-center space-x-2">
                              <input
                                type="text"
                                formControlName="name"
                                class="flex-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button
                                type="submit"
                                [disabled]="editForm.invalid"
                                class="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm rounded">
                                Save
                              </button>
                              <button
                                type="button"
                                (click)="cancelEdit()"
                                class="px-2 py-1 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded">
                                Cancel
                              </button>
                            </form>
                          } @else {
                            <span class="font-medium text-slate-900 dark:text-slate-100">{{ category.name }}</span>
                          }
                        </td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ category.sortOrder }}</td>
                        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ formatDate(category.createdAt) }}</td>
                        <td class="px-6 py-4 text-right">
                          @if (editingCategory()?.id === category.id) {
                            <!-- Edit form is showing above -->
                          } @else {
                            <div class="flex items-center justify-end space-x-2">
                              <button
                                (click)="startEdit(category)"
                                class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                                Edit
                              </button>
                              <button
                                (click)="deleteCategory(category)"
                                class="text-red-400 hover:text-red-300 text-sm font-medium">
                                Delete
                              </button>
                            </div>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Mobile cards -->
              <div class="md:hidden space-y-4 p-4">
                @for (category of grouped[typeName]; track category.id) {
                  <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                    @if (editingCategory()?.id === category.id) {
                      <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="space-y-3">
                        <input
                          type="text"
                          formControlName="name"
                          class="w-full px-3 py-2 bg-slate-200 dark:bg-slate-600 border border-slate-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <div class="flex space-x-2">
                          <button
                            type="submit"
                            [disabled]="editForm.invalid"
                            class="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white text-sm rounded">
                            Save
                          </button>
                          <button
                            type="button"
                            (click)="cancelEdit()"
                            class="px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm rounded">
                            Cancel
                          </button>
                        </div>
                      </form>
                    } @else {
                      <div class="flex items-start justify-between">
                        <div>
                          <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ category.name }}</h3>
                          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Sort: {{ category.sortOrder }} • Created: {{ formatDate(category.createdAt) }}
                          </div>
                        </div>
                        <div class="flex space-x-2 ml-4">
                          <button
                            (click)="startEdit(category)"
                            class="text-amber-400 hover:text-amber-300 text-sm">
                            Edit
                          </button>
                          <button
                            (click)="deleteCategory(category)"
                            class="text-red-400 hover:text-red-300 text-sm">
                            Delete
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>

            } @else {
              <!-- Empty type -->
              <div class="px-6 py-8 text-center">
                <p class="text-slate-500 dark:text-slate-400">No categories in this type yet.</p>
              </div>
            }
          </div>
        }
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading categories...</p>
        </div>
      }
    </div>
  `
})
export class CategoryManagementComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private inventoryTypeService = inject(InventoryTypeService);
  private fb = inject(FormBuilder);

  categories = signal<Category[]>([]);
  inventoryTypes = signal<InventoryType[]>([]);
  categoriesGrouped = signal<CategoriesGrouped>({});
  isLoading = signal(false);
  isCreating = signal(false);
  editingCategory = signal<Category | null>(null);
  showCreateForm = signal(false);

  Object = Object; // Make Object available in template

  createForm = this.fb.group({
    name: ['', [Validators.required]],
    inventoryTypeId: ['', [Validators.required]]
  });

  editForm = this.fb.group({
    name: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    
    forkJoin({
      categories: this.categoryService.getCategories(),
      inventoryTypes: this.inventoryTypeService.getInventoryTypes()
    }).subscribe({
      next: ({ categories, inventoryTypes }) => {
        this.categories.set(categories);
        this.inventoryTypes.set(inventoryTypes);
        this.groupCategories(categories, inventoryTypes);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load data:', error);
        this.isLoading.set(false);
      }
    });
  }

  private groupCategories(categories: Category[], inventoryTypes: InventoryType[]): void {
    const typeMap = new Map(inventoryTypes.map(t => [t.id, t.name]));
    const grouped: CategoriesGrouped = {};

    // Initialize groups for all inventory types
    inventoryTypes.forEach(type => {
      grouped[type.name] = [];
    });

    // Group categories
    categories.forEach(category => {
      const typeName = typeMap.get(category.inventoryTypeId);
      if (typeName && grouped[typeName]) {
        grouped[typeName].push(category);
      }
    });

    // Sort categories within each group by sortOrder
    Object.keys(grouped).forEach(typeName => {
      grouped[typeName].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    this.categoriesGrouped.set(grouped);
  }

  createCategory(): void {
    if (this.createForm.valid) {
      this.isCreating.set(true);
      const formData: CategoryFormData = {
        name: this.createForm.value.name!,
        inventoryTypeId: Number(this.createForm.value.inventoryTypeId!)
      };

      this.categoryService.createCategory(formData).subscribe({
        next: () => {
          this.createForm.reset();
          this.showCreateForm.set(false);
          this.loadData(); // Reload to get updated data
          this.isCreating.set(false);
        },
        error: (error: any) => {
          console.error('Failed to create category:', error);
          alert('Failed to create category. Please try again.');
          this.isCreating.set(false);
        }
      });
    }
  }

  startEdit(category: Category): void {
    this.editingCategory.set(category);
    this.editForm.patchValue({
      name: category.name
    });
  }

  saveEdit(): void {
    const category = this.editingCategory();
    if (category && this.editForm.valid) {
      const updateData = {
        name: this.editForm.value.name!
      };

      this.categoryService.updateCategory(category.id, updateData).subscribe({
        next: () => {
          this.editingCategory.set(null);
          this.loadData(); // Reload to get updated data
        },
        error: (error: any) => {
          console.error('Failed to update category:', error);
          alert('Failed to update category. Please try again.');
        }
      });
    }
  }

  cancelEdit(): void {
    this.editingCategory.set(null);
    this.editForm.reset();
  }

  deleteCategory(category: Category): void {
    const confirmMessage = `Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.loadData(); // Reload to get updated data
        },
        error: (error: any) => {
          console.error('Failed to delete category:', error);
          alert('Failed to delete category. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}