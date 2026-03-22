import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../types/dashboard';

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
                <p class="text-slate-500 dark:text-slate-400 text-sm">Total Items</p>
                <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ statsData.totalItems | number }}</p>
                <p class="text-xs text-slate-500">Across all types</p>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Quick actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Actions</h3>
          <div class="space-y-3">
            <a routerLink="/inventory/new" 
               class="block w-full text-left px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
              <div class="flex items-center space-x-3">
                <span class="text-xl">➕</span>
                <div>
                  <p class="font-medium text-slate-900 dark:text-slate-100">Add New Item</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Create a new inventory item</p>
                </div>
              </div>
            </a>
            <a routerLink="/inventory" 
               class="block w-full text-left px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
              <div class="flex items-center space-x-3">
                <span class="text-xl">📋</span>
                <div>
                  <p class="font-medium text-slate-900 dark:text-slate-100">View All Items</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Browse your inventory</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        <!-- Recent Activity placeholder -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h3>
          <div class="text-slate-500 dark:text-slate-400 text-sm">
            <p class="text-center py-8">Activity tracking coming soon...</p>
          </div>
        </div>

        <!-- Chart placeholder -->
        <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Value by Category</h3>
          <div class="text-slate-500 dark:text-slate-400 text-sm">
            <p class="text-center py-8">Chart visualization coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  
  stats = signal<DashboardStats | null>(null);

  ngOnInit(): void {
    this.loadStats();
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

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  }
}