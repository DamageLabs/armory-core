import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BomService } from '../../../core/services/bom.service';
import { Bom, BomCostResponse } from '../../../types/bom';

@Component({
  selector: 'app-bom-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    @if (bom(); as bomData) {
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav class="text-sm text-slate-500 dark:text-slate-400 mb-2">
              <a routerLink="/boms" class="hover:text-slate-700 dark:hover:text-slate-300">BOMs</a>
              <span class="mx-2">/</span>
              <span>{{ bomData.name }}</span>
            </nav>
            <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ bomData.name }}</h1>
            @if (bomData.description) {
              <p class="mt-1 text-slate-500 dark:text-slate-400">{{ bomData.description }}</p>
            }
          </div>
          
          <div class="flex items-center space-x-3">
            <button 
              (click)="duplicateBom()"
              class="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg transition-colors duration-200">
              Duplicate
            </button>
            <a [routerLink]="['/boms', bomData.id, 'edit']" 
               class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
              Edit BOM
            </a>
          </div>
        </div>

        <!-- Summary cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg mr-4">
                <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Total Items</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ bomData.items.length || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4">
                <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Total Cost</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  @if (costData(); as cost) {
                    {{ formatCurrency(cost.totalCost) }}
                  } @else {
                    <span class="text-slate-400">Loading...</span>
                  }
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4">
                <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Created</p>
                <p class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ formatDate(bomData.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Items table -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">BOM Items</h2>
          </div>

          @if (bomData.items && bomData.items.length > 0) {
            <!-- Desktop table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Unit Cost</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Cost</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                  @for (item of bomData.items; track item.itemId) {
                    <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                      <td class="px-6 py-4">
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ item.itemName || 'Item #' + item.itemId }}
                        </div>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ item.quantity }}</td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {{ item.unitValue ? formatCurrency(item.unitValue) : '-' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {{ item.totalValue ? formatCurrency(item.totalValue) : '-' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="md:hidden space-y-4 p-4">
              @for (item of bomData.items; track item.itemId) {
                <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <h3 class="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    {{ item.itemName || 'Item #' + item.itemId }}
                  </h3>
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="text-slate-500 dark:text-slate-400">Quantity:</span>
                      <span class="ml-1 text-slate-700 dark:text-slate-300">{{ item.quantity }}</span>
                    </div>
                    @if (item.unitValue) {
                      <div>
                        <span class="text-slate-500 dark:text-slate-400">Unit Cost:</span>
                        <span class="ml-1 text-slate-700 dark:text-slate-300">{{ formatCurrency(item.unitValue) }}</span>
                      </div>
                    }
                    @if (item.totalValue) {
                      <div class="col-span-2">
                        <span class="text-slate-500 dark:text-slate-400">Total Cost:</span>
                        <span class="ml-1 font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.totalValue) }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="px-6 py-12 text-center">
              <p class="text-slate-500 dark:text-slate-400">No items in this BOM.</p>
            </div>
          }
        </div>
      </div>
    }

    <!-- Loading state -->
    @if (isLoading()) {
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p class="text-slate-500 dark:text-slate-400">Loading BOM details...</p>
      </div>
    }
  `
})
export class BomDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bomService = inject(BomService);

  bom = signal<Bom | null>(null);
  costData = signal<BomCostResponse | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.loadBom(id);
      this.loadCostData(id);
    }
  }

  private loadBom(id: number): void {
    this.isLoading.set(true);
    this.bomService.getBom(id).subscribe({
      next: (bom) => {
        this.bom.set(bom);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load BOM:', error);
        this.isLoading.set(false);
        this.router.navigate(['/boms']);
      }
    });
  }

  private loadCostData(id: number): void {
    this.bomService.getBomCost(id).subscribe({
      next: (costData) => {
        this.costData.set(costData);
      },
      error: (error) => {
        console.error('Failed to load BOM cost data:', error);
      }
    });
  }

  duplicateBom(): void {
    const bomData = this.bom();
    if (!bomData) return;

    this.bomService.duplicateBom(bomData.id).subscribe({
      next: (newBom) => {
        this.router.navigate(['/boms', newBom.id]);
      },
      error: (error) => {
        console.error('Failed to duplicate BOM:', error);
        alert('Failed to duplicate BOM. Please try again.');
      }
    });
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