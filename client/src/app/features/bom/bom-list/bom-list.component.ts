import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BomService } from '../../../core/services/bom.service';
import { Bom } from '../../../types/bom';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Bills of Materials</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Manage your BOMs and track component costs</p>
        </div>
        <a routerLink="/boms/new" 
           class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 text-center">
          Create BOM
        </a>
      </div>

      <!-- BOMs grid -->
      @if (boms(); as bomList) {
        @if (bomList.length > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (bom of bomList; track bom.id) {
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg transition-shadow duration-200">
                
                <!-- BOM header -->
                <div class="flex items-start justify-between mb-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      <a [routerLink]="['/boms', bom.id]" class="hover:text-amber-500 transition-colors">
                        {{ bom.name }}
                      </a>
                    </h3>
                    @if (bom.description) {
                      <p class="text-slate-600 dark:text-slate-300 text-sm line-clamp-2">{{ bom.description }}</p>
                    }
                  </div>
                  
                  <!-- Dropdown menu -->
                  <div class="relative">
                    <button 
                      (click)="toggleDropdown(bom.id)"
                      class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                      </svg>
                    </button>
                    
                    @if (openDropdown() === bom.id) {
                      <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-lg shadow-xl border border-slate-200 dark:border-slate-600 z-10">
                        <div class="py-1">
                          <a [routerLink]="['/boms', bom.id]" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                            View Details
                          </a>
                          <a [routerLink]="['/boms', bom.id, 'edit']" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                            Edit
                          </a>
                          <button (click)="duplicateBom(bom)" class="w-full text-left block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600">
                            Duplicate
                          </button>
                          <button (click)="deleteBom(bom)" class="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600">
                            Delete
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- BOM stats -->
                <div class="grid grid-cols-2 gap-4 mb-4">
                  <div class="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ bom.itemCount || bom.items.length || 0 }}</div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Items</div>
                  </div>
                  <div class="text-center p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                    <div class="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {{ bom.totalCost ? formatCurrency(bom.totalCost) : '$--' }}
                    </div>
                    <div class="text-sm text-slate-500 dark:text-slate-400">Total Cost</div>
                  </div>
                </div>

                <!-- Created date -->
                <div class="text-xs text-slate-400 dark:text-slate-500">
                  Created {{ formatDate(bom.createdAt) }}
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Empty state -->
          <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div class="text-6xl mb-4">📋</div>
            <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No BOMs found</h3>
            <p class="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first Bill of Materials.</p>
            <a routerLink="/boms/new" 
               class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
              Create First BOM
            </a>
          </div>
        }
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading BOMs...</p>
        </div>
      }
    </div>

    <!-- Click outside to close dropdown -->
    @if (openDropdown()) {
      <div class="fixed inset-0 z-5" (click)="closeDropdown()"></div>
    }
  `
})
export class BomListComponent implements OnInit {
  private bomService = inject(BomService);

  boms = signal<Bom[]>([]);
  isLoading = signal(false);
  openDropdown = signal<number | null>(null);

  ngOnInit(): void {
    this.loadBoms();
  }

  private loadBoms(): void {
    this.isLoading.set(true);
    this.bomService.getBoms().subscribe({
      next: (boms) => {
        this.boms.set(boms);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load BOMs:', error);
        this.isLoading.set(false);
      }
    });
  }

  toggleDropdown(bomId: number): void {
    this.openDropdown.set(this.openDropdown() === bomId ? null : bomId);
  }

  closeDropdown(): void {
    this.openDropdown.set(null);
  }

  duplicateBom(bom: Bom): void {
    this.closeDropdown();
    this.bomService.duplicateBom(bom.id).subscribe({
      next: () => {
        this.loadBoms();
      },
      error: (error) => {
        console.error('Failed to duplicate BOM:', error);
        alert('Failed to duplicate BOM. Please try again.');
      }
    });
  }

  deleteBom(bom: Bom): void {
    this.closeDropdown();
    if (confirm(`Are you sure you want to delete "${bom.name}"?`)) {
      this.bomService.deleteBom(bom.id).subscribe({
        next: () => {
          this.loadBoms();
        },
        error: (error) => {
          console.error('Failed to delete BOM:', error);
          alert('Failed to delete BOM. Please try again.');
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}