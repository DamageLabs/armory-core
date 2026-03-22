import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats, CategoryStats, InventoryTypeStats } from '../../types/dashboard';
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
  
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('typeChart', { static: false }) typeChartRef!: ElementRef<HTMLCanvasElement>;
  
  stats = signal<DashboardStats | null>(null);
  categoryStats = signal<CategoryStats[]>([]);
  inventoryTypeStats = signal<InventoryTypeStats[]>([]);
  recentItems = signal<Item[]>([]);

  private categoryChart: Chart | null = null;
  private typeChart: Chart | null = null;

  ngOnInit(): void {
    this.loadStats();
    this.loadCategoryStats();
    this.loadInventoryTypeStats();
    this.loadRecentItems();
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
}