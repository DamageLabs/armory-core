import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService, PortfolioValueResponse } from '../../../core/services/report.service';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Portfolio Value</h1>
        
        <!-- Group by toggle -->
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              [checked]="groupByType()"
              (change)="toggleGroupBy()"
              class="w-4 h-4 text-amber-600 bg-slate-100 border-slate-300 rounded focus:ring-amber-500 dark:focus:ring-amber-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Group by Type</span>
          </label>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-md flex items-center justify-center">
                <span class="text-blue-600 dark:text-blue-400 text-sm font-semibold">💰</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Current Value</dt>
                <dd class="text-lg font-medium text-slate-900 dark:text-white">
                  {{ formatCurrency(data()?.summary?.currentValue || 0) }}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-slate-100 dark:bg-slate-900 rounded-md flex items-center justify-center">
                <span class="text-slate-600 dark:text-slate-400 text-sm font-semibold">📊</span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Period Start</dt>
                <dd class="text-lg font-medium text-slate-900 dark:text-white">
                  {{ formatCurrency(data()?.summary?.periodStartValue || 0) }}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-md flex items-center justify-center"
                   [class]="changeColor() === 'positive' ? 'bg-green-100 dark:bg-green-900' : changeColor() === 'negative' ? 'bg-red-100 dark:bg-red-900' : 'bg-slate-100 dark:bg-slate-900'">
                <span class="text-sm font-semibold"
                      [class]="changeColor() === 'positive' ? 'text-green-600 dark:text-green-400' : changeColor() === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'">
                  {{ changeIcon() }}
                </span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Change</dt>
                <dd class="text-lg font-medium"
                    [class]="changeColor() === 'positive' ? 'text-green-600 dark:text-green-400' : changeColor() === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'">
                  {{ formatCurrency(data()?.summary?.change || 0) }}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 rounded-md flex items-center justify-center"
                   [class]="changeColor() === 'positive' ? 'bg-green-100 dark:bg-green-900' : changeColor() === 'negative' ? 'bg-red-100 dark:bg-red-900' : 'bg-slate-100 dark:bg-slate-900'">
                <span class="text-sm font-semibold"
                      [class]="changeColor() === 'positive' ? 'text-green-600 dark:text-green-400' : changeColor() === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'">
                  %
                </span>
              </div>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">% Change</dt>
                <dd class="text-lg font-medium"
                    [class]="changeColor() === 'positive' ? 'text-green-600 dark:text-green-400' : changeColor() === 'negative' ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'">
                  {{ (data()?.summary?.percentChange || 0).toFixed(1) }}%
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Period Selector -->
      <div class="flex flex-wrap gap-2">
        @for (periodOption of periodOptions; track periodOption.value) {
          <button 
            (click)="selectPeriod(periodOption.value)"
            [class]="selectedPeriod() === periodOption.value ? 
              'bg-amber-500 text-white hover:bg-amber-600' : 
              'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600'"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
            {{ periodOption.label }}
          </button>
        }
      </div>

      <!-- Chart -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div class="h-96">
          <canvas #chartCanvas></canvas>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="flex items-center justify-center h-64">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <span class="ml-3 text-slate-600 dark:text-slate-400">Loading portfolio data...</span>
        </div>
      }

      <!-- Error State -->
      @if (error()) {
        <div class="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-red-400 text-xl">⚠️</span>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading portfolio data
              </h3>
              <div class="mt-2 text-sm text-red-700 dark:text-red-300">
                {{ error() }}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PortfolioComponent implements OnInit {
  private reportService = inject(ReportService);
  
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // State
  data = signal<PortfolioValueResponse | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedPeriod = signal('all');
  groupByType = signal(false);
  
  private chart: Chart | null = null;

  // Computed values
  changeColor = computed(() => {
    const change = this.data()?.summary?.change || 0;
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  });

  changeIcon = computed(() => {
    const change = this.data()?.summary?.change || 0;
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  });

  periodOptions = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: '1 Year', value: '1y' },
    { label: 'All Time', value: 'all' }
  ];

  constructor() {
    afterNextRender(() => {
      this.loadData();
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  selectPeriod(period: string): void {
    this.selectedPeriod.set(period);
    this.loadData();
  }

  toggleGroupBy(): void {
    this.groupByType.update(value => !value);
    this.loadData();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const groupBy = this.groupByType() ? 'type' : 'none';
    
    this.reportService.getPortfolioValue(this.selectedPeriod(), groupBy).subscribe({
      next: (response) => {
        this.data.set(response);
        this.isLoading.set(false);
        this.updateChart();
      },
      error: (error) => {
        console.error('Error loading portfolio data:', error);
        this.error.set('Failed to load portfolio data. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  private updateChart(): void {
    const data = this.data();
    if (!data || !this.chartCanvas) {
      return;
    }

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) {
      return;
    }

    const labels = data.snapshots.map(s => new Date(s.date).toLocaleDateString());
    
    const datasets: any[] = [];

    if (this.groupByType() && data.snapshots[0]?.byType) {
      // Show lines for each type
      const typeColors: Record<string, string> = {
        'Firearms': '#3b82f6', // blue
        'Accessories': '#10b981', // green
        'Ammunition': '#8b5cf6', // purple
        'Other': '#6b7280' // gray
      };

      const types = Object.keys(data.snapshots[0].byType);
      types.forEach(type => {
        datasets.push({
          label: type,
          data: data.snapshots.map(s => s.byType?.[type] || 0),
          borderColor: typeColors[type] || '#6b7280',
          backgroundColor: typeColors[type] + '20' || '#6b728020',
          borderWidth: 2,
          fill: false,
          tension: 0.1
        });
      });
    } else {
      // Show total value line
      datasets.push({
        label: 'Total Portfolio Value',
        data: data.snapshots.map(s => s.totalValue),
        borderColor: '#f59e0b', // amber
        backgroundColor: '#f59e0b20',
        borderWidth: 3,
        fill: false,
        tension: 0.1
      });
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#64748b',
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#cbd5e1',
            borderColor: '#475569',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = this.formatCurrency(context.parsed.y || 0);
                return `${label}: ${value}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date',
              color: '#64748b'
            },
            ticks: {
              color: '#64748b',
              maxTicksLimit: 10
            },
            grid: {
              color: '#e2e8f020'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Value ($)',
              color: '#64748b'
            },
            ticks: {
              color: '#64748b',
              callback: (value) => this.formatCurrency(Number(value))
            },
            grid: {
              color: '#e2e8f020'
            }
          }
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}