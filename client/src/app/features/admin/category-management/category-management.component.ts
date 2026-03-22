import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Category Management</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Manage inventory categories</p>
      </div>

      <!-- Coming soon -->
      <div class="bg-white dark:bg-slate-800 p-12 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
        <div class="text-6xl mb-4">🏷️</div>
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Category Management</h3>
        <p class="text-slate-500 dark:text-slate-400">Category management features coming soon...</p>
      </div>
    </div>
  `
})
export class CategoryManagementComponent {}