import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { ItemService } from '../../core/services/item.service';
import { DashboardStats, CategoryStats, InventoryTypeStats, ValueByTypeStats, TopValuedItem, CategoryBreakdown } from '../../types/dashboard';
import { Item } from '../../types/item';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Overview of your inventory</p>
        </div>
        <a routerLink="/inventory/new" 
           class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
          Add Item
        </a>
      </div>

      <!-- Stats cards -->
      @if (stats(); as statsData) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                <span class="text-2xl">📦</span>
              </div>
              <div class="ml-4">
                <p class="text-slate-500 dark:text-slate-400 text-sm">Total Items</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ statsData.totalItems | number }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                <span class="text-2xl">💰</span>
              </div>
              <div class="ml-4">
                <p class="text-slate-500 dark:text-slate-400 text-sm">Total Value</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(statsData.totalValue) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-2 bg-amber-500 bg-opacity-20 rounded-lg">
                <span class="text-2xl">🏷️</span>
              </div>
              <div class="ml-4">
                <p class="text-slate-500 dark:text-slate-400 text-sm">Total Quantity</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ statsData.totalQuantity | number }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div class="flex items-center">
              <div class="p-2 bg-purple-500 bg-opacity-20 rounded-lg">
                <span class="text-2xl">📈</span>
              </div>
              <div class="ml-4">
                <p class="text-slate-500 dark:text-slate-400 text-sm">Avg. Item Value</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(statsData.totalValue / statsData.totalItems) }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Per item</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Charts section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- Value by Category Chart -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Value by Category</h3>
          @if (categoryStats().length > 0) {
            <div class="h-64">
              <canvas #categoryChart></canvas>
            </div>
          } @else {
            <div class="text-slate-500 dark:text-slate-400 text-sm">
              <p class="text-center py-8">Loading chart...</p>
            </div>
          }
        </div>

        <!-- Items by Type Chart -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Items by Type</h3>
          @if (inventoryTypeStats().length > 0) {
            <div class="h-64">
              <canvas #typeChart></canvas>
            </div>
          } @else {
            <div class="text-slate-500 dark:text-slate-400 text-sm">
              <p class="text-center py-8">Loading chart...</p>
            </div>
          }
        </div>

        <!-- Value by Type Chart -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Value by Type</h3>
          @if (valueByTypeStats().length > 0) {
            <div class="h-64">
              <canvas #valueByTypeChart></canvas>
            </div>
          } @else {
            <div class="text-slate-500 dark:text-slate-400 text-sm">
              <p class="text-center py-8">Loading chart...</p>
            </div>
          }
        </div>

        <!-- Top 5 Most Valuable Items Chart -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Top 5 Most Valuable Items</h3>
          @if (topValuedItems().length > 0) {
            <div class="h-64">
              <canvas #topValuedChart></canvas>
            </div>
          } @else {
            <div class="text-slate-500 dark:text-slate-400 text-sm">
              <p class="text-center py-8">Loading chart...</p>
            </div>
          }
        </div>
      </div>

      <!-- Expiring Items Widget -->
      @if (expiringItems().length > 0) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Expiring Soon</h3>
            <div class="text-sm text-slate-500 dark:text-slate-400">
              {{ expiringItems().length }} {{ expiringItems().length === 1 ? 'item' : 'items' }} expiring within 30 days
            </div>
          </div>
          <div class="space-y-3">
            @for (item of expiringItems(); track item.id) {
              <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                <div class="flex items-center space-x-3">
                  <span [class]="getExpirationStatusClass(item)">{{ getExpirationStatusIcon(item) }}</span>
                  <div>
                    <a [routerLink]="['/inventory', item.id]" class="font-medium text-amber-400 hover:text-amber-300">
                      {{ item.name }}
                    </a>
                    @if (item.expirationNotes) {
                      <p class="text-sm text-slate-500 dark:text-slate-400">{{ item.expirationNotes }}</p>
                    }
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ formatDate(item.expirationDate!) }}
                  </div>
                  <div [class]="getExpirationStatusTextClass(item)" class="text-xs">
                    {{ getExpirationStatusText(item) }}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Category Breakdown Table -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Category Breakdown</h3>
        @if (categoryBreakdown().length > 0) {
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead class="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Item Count
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">
                    Avg Value
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                @for (category of categoryBreakdown(); track category.category) {
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                      {{ category.category }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ category.itemCount | number }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 font-medium">
                      {{ formatCurrency(category.totalValue) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {{ formatCurrency(category.avgValue) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="text-slate-500 dark:text-slate-400 text-sm">
            <p class="text-center py-8">Loading category breakdown...</p>
          </div>
        }
      </div>

      <!-- Recent Activity -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
          <a routerLink="/inventory" 
             class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium">
            View all →
          </a>
        </div>
        @if (recentItems().length > 0) {
          <div class="space-y-3">
            @for (item of recentItems(); track item.id) {
              <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div class="flex items-center space-x-3">
                  <div class="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                    <span class="text-sm">📦</span>
                  </div>
                  <div>
                    <p class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</p>
                    <div class="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                      <span>{{ item.category }}</span>
                      <span>•</span>
                      <span>{{ formatDate(item.createdAt) }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.value) }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Qty: {{ item.quantity }}</p>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="text-slate-500 dark:text-slate-400 text-sm">
            <p class="text-center py-8">No recent items to display</p>
          </div>
        }
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private dashboardService = inject(DashboardService);
  private itemService = inject(ItemService);
  
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart', { static: false }) typeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('valueByTypeChart', { static: false }) valueByTypeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topValuedChart', { static: false }) topValuedChartRef!: ElementRef<HTMLCanvasElement>;
  
  stats = signal<DashboardStats | null>(null);
  categoryStats = signal<CategoryStats[]>([]);
  inventoryTypeStats = signal<InventoryTypeStats[]>([]);
  valueByTypeStats = signal<ValueByTypeStats[]>([]);
  topValuedItems = signal<TopValuedItem[]>([]);
  categoryBreakdown = signal<CategoryBreakdown[]>([]);
  recentItems = signal<Item[]>([]);
  expiringItems = signal<Item[]>([]);

  private categoryChart: Chart | null = null;
  private typeChart: Chart | null = null;
  private valueByTypeChart: Chart | null = null;
  private topValuedChart: Chart | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadCategoryStats();
    this.loadInventoryTypeStats();
    this.loadValueByTypeStats();
    this.loadTopValuedItems();
    this.loadCategoryBreakdown();
    this.loadRecentItems();
    this.loadExpiringItems();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized when data is loaded
  }

  private loadStats(): void {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
      },
      error: (error) => {
        console.error('Failed to load dashboard stats:', error);
      }
    });
  }

  private loadCategoryStats(): void {
    this.dashboardService.getCategoryStats().subscribe({
      next: (data) => {
        this.categoryStats.set(data);
        setTimeout(() => this.initializeCategoryChart(), 0);
      },
      error: (error) => {
        console.error('Failed to load category stats:', error);
      }
    });
  }

  private loadInventoryTypeStats(): void {
    this.dashboardService.getInventoryTypeStats().subscribe({
      next: (data) => {
        this.inventoryTypeStats.set(data);
        setTimeout(() => this.initializeTypeChart(), 0);
      },
      error: (error) => {
        console.error('Failed to load inventory type stats:', error);
      }
    });
  }

  private loadValueByTypeStats(): void {
    this.dashboardService.getValueByTypeStats().subscribe({
      next: (data) => {
        this.valueByTypeStats.set(data);
        setTimeout(() => this.initializeValueByTypeChart(), 0);
      },
      error: (error) => {
        console.error('Failed to load value by type stats:', error);
      }
    });
  }

  private loadTopValuedItems(): void {
    this.dashboardService.getTopValuedItems().subscribe({
      next: (data) => {
        this.topValuedItems.set(data);
        setTimeout(() => this.initializeTopValuedChart(), 0);
      },
      error: (error) => {
        console.error('Failed to load top valued items:', error);
      }
    });
  }

  private loadCategoryBreakdown(): void {
    this.dashboardService.getCategoryBreakdown().subscribe({
      next: (data) => {
        this.categoryBreakdown.set(data);
      },
      error: (error) => {
        console.error('Failed to load category breakdown:', error);
      }
    });
  }

  private loadRecentItems(): void {
    this.dashboardService.getRecentItems().subscribe({
      next: (data) => {
        this.recentItems.set(data);
      },
      error: (error) => {
        console.error('Failed to load recent items:', error);
      }
    });
  }

  private loadExpiringItems(): void {
    this.itemService.getExpiringItems(30).subscribe({
      next: (data) => {
        this.expiringItems.set(data);
      },
      error: (error) => {
        console.error('Failed to load expiring items:', error);
      }
    });
  }

  private initializeCategoryChart(): void {
    if (!this.categoryChartRef?.nativeElement || this.categoryChart) return;

    const data = this.categoryStats();
    const colors = [
      '#F59E0B', // amber-500
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#8B5CF6', // purple-500
      '#EF4444', // red-500
      '#F97316', // orange-500
      '#06B6D4', // cyan-500
      '#84CC16'  // lime-500
    ];

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.category),
        datasets: [{
          data: data.map(d => d.value),
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 2,
          borderColor: 'transparent'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: this.getTextColor()
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const categoryData = data[context.dataIndex];
                return `${context.label}: ${this.formatCurrency(categoryData.value)} (${categoryData.count} items)`;
              }
            }
          }
        },
        cutout: '60%'
      }
    };

    this.categoryChart = new Chart(this.categoryChartRef.nativeElement, config);
  }

  private initializeTypeChart(): void {
    if (!this.typeChartRef?.nativeElement || this.typeChart) return;

    const data = this.inventoryTypeStats();
    const colors = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Items',
          data: data.map(d => d.count),
          backgroundColor: colors.slice(0, data.length),
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const typeData = data[context.dataIndex];
                return `${context.label}: ${context.parsed.y} items (${this.formatCurrency(typeData.value)})`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: this.getTextColor()
            },
            grid: {
              color: this.getGridColor()
            }
          },
          x: {
            ticks: {
              color: this.getTextColor()
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.typeChart = new Chart(this.typeChartRef.nativeElement, config);
  }

  private initializeValueByTypeChart(): void {
    if (!this.valueByTypeChartRef?.nativeElement || this.valueByTypeChart) return;

    const data = this.valueByTypeStats();
    const colors = {
      'Firearms': '#f59e0b', // amber
      'Accessories': '#3b82f6', // blue
      'Ammunition': '#10b981', // green
      'Other': '#8b5cf6' // purple
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Value',
          data: data.map(d => d.value),
          backgroundColor: data.map(d => colors[d.name as keyof typeof colors] || '#8b5cf6'),
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const typeData = data[context.dataIndex];
                return `${context.label}: ${this.formatCurrency(context.parsed.y || 0)} (${typeData.count} items)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number),
              color: this.getTextColor()
            },
            grid: {
              color: this.getGridColor()
            }
          },
          x: {
            ticks: {
              color: this.getTextColor()
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.valueByTypeChart = new Chart(this.valueByTypeChartRef.nativeElement, config);
  }

  private initializeTopValuedChart(): void {
    if (!this.topValuedChartRef?.nativeElement || this.topValuedChart) return;

    const data = this.topValuedItems();

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.map(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name),
        datasets: [{
          label: 'Value',
          data: data.map(d => d.value),
          backgroundColor: '#f59e0b', // amber
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y', // This makes it horizontal
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const item = data[context.dataIndex];
                return `${item.name}: ${this.formatCurrency(context.parsed.x || 0)}`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              callback: (value) => this.formatCurrency(value as number),
              color: this.getTextColor()
            },
            grid: {
              color: this.getGridColor()
            }
          },
          y: {
            ticks: {
              color: this.getTextColor()
            },
            grid: {
              display: false
            }
          }
        }
      }
    };

    this.topValuedChart = new Chart(this.topValuedChartRef.nativeElement, config);
  }

  private getTextColor(): string {
    // Check if dark mode is enabled
    return document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
  }

  private getGridColor(): string {
    return document.documentElement.classList.contains('dark') ? '#374151' : '#e2e8f0';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  getExpirationStatus(item: Item): 'expired' | 'warning' | 'good' | null {
    if (!item.expirationDate) return null;
    
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 30) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  getExpirationStatusIcon(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'good':
        return '🟢';
      default:
        return '';
    }
  }

  getExpirationStatusClass(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'good':
        return 'text-green-500';
      default:
        return '';
    }
  }

  getExpirationStatusText(item: Item): string {
    if (!item.expirationDate) return '';
    
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else {
      return `Expires in ${diffDays} days`;
    }
  }

  getExpirationStatusTextClass(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return 'text-red-500 font-medium';
      case 'warning':
        return 'text-yellow-500 font-medium';
      case 'good':
        return 'text-green-500';
      default:
        return 'text-slate-500';
    }
  }
}