import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLogEntry, PaginatedAuditLogs, AuditLogFilters } from '../../../types/audit-log';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Audit Log</h1>
          <p class="mt-1 text-slate-500 dark:text-slate-400">Monitor system activities and changes</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          
          <!-- Action Type -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Action Type</label>
            <select 
              formControlName="action"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">All Actions</option>
              @for (action of availableActions(); track action) {
                <option [value]="action">{{ action }}</option>
              }
            </select>
          </div>

          <!-- User Email -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">User</label>
            <select 
              formControlName="userEmail"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">All Users</option>
              @for (user of availableUsers(); track user) {
                <option [value]="user">{{ user }}</option>
              }
            </select>
          </div>

          <!-- Resource Type -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Resource Type</label>
            <select 
              formControlName="resourceType"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="item">Item</option>
              <option value="category">Category</option>
              <option value="inventory-type">Inventory Type</option>
              <option value="auth">Authentication</option>
            </select>
          </div>

          <!-- Date From -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">From Date</label>
            <input
              type="date"
              formControlName="from"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">To Date</label>
            <input
              type="date"
              formControlName="to"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <!-- Per page selector -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Per Page</label>
            <select 
              formControlName="pageSize"
              class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </form>
      </div>

      <!-- Audit log table -->
      @if (auditData(); as data) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <!-- Table header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Audit Entries ({{ data.pagination.totalItems | number }})
            </h2>
          </div>

          @if (data.data.length > 0) {
            
            <!-- Desktop table -->
            <div class="hidden lg:block overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Resource ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">IP Address</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700">
                  @for (entry of data.data; track entry.id) {
                    <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {{ formatTimestamp(entry.timestamp) }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {{ entry.userEmail }}
                      </td>
                      <td class="px-6 py-4">
                        <span [class]="getActionBadgeClass(entry.action)" 
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {{ entry.action }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {{ entry.resourceType }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {{ entry.resourceId || '-' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">
                        {{ entry.ipAddress }}
                      </td>
                      <td class="px-6 py-4">
                        @if (entry.details && entry.details !== '{}' && entry.details !== 'null') {
                          <button 
                            (click)="toggleDetails(entry.id)"
                            class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                            {{ isDetailsExpanded(entry.id) ? 'Hide' : 'Show' }} Details
                          </button>
                        } @else {
                          <span class="text-slate-400 text-sm">-</span>
                        }
                      </td>
                    </tr>
                    @if (isDetailsExpanded(entry.id) && entry.details && entry.details !== '{}' && entry.details !== 'null') {
                      <tr class="bg-slate-50 dark:bg-slate-750">
                        <td colspan="7" class="px-6 py-4">
                          <div class="bg-slate-100 dark:bg-slate-600 p-4 rounded-lg">
                            <h4 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Details:</h4>
                            <pre class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-x-auto">{{ formatDetails(entry.details) }}</pre>
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile/tablet cards -->
            <div class="lg:hidden space-y-4 p-4">
              @for (entry of data.data; track entry.id) {
                <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-1">
                        <span [class]="getActionBadgeClass(entry.action)" 
                              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                          {{ entry.action }}
                        </span>
                        <span class="text-sm text-slate-500 dark:text-slate-400">{{ entry.resourceType }}</span>
                      </div>
                      <p class="text-sm text-slate-600 dark:text-slate-300">{{ entry.userEmail }}</p>
                      <p class="text-xs text-slate-500 dark:text-slate-400">{{ formatTimestamp(entry.timestamp) }}</p>
                    </div>
                  </div>
                  
                  <div class="space-y-2 text-sm">
                    @if (entry.resourceId) {
                      <div class="flex justify-between">
                        <span class="text-slate-500 dark:text-slate-400">Resource ID:</span>
                        <span class="text-slate-600 dark:text-slate-300">{{ entry.resourceId }}</span>
                      </div>
                    }
                    <div class="flex justify-between">
                      <span class="text-slate-500 dark:text-slate-400">IP Address:</span>
                      <span class="text-slate-600 dark:text-slate-300">{{ entry.ipAddress }}</span>
                    </div>
                    @if (entry.details && entry.details !== '{}' && entry.details !== 'null') {
                      <div class="pt-2 border-t border-slate-600">
                        <button 
                          (click)="toggleDetails(entry.id)"
                          class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                          {{ isDetailsExpanded(entry.id) ? 'Hide' : 'Show' }} Details
                        </button>
                        @if (isDetailsExpanded(entry.id)) {
                          <div class="mt-2 bg-slate-600 dark:bg-slate-600 p-3 rounded">
                            <pre class="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto">{{ formatDetails(entry.details) }}</pre>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Pagination -->
            @if (data.pagination.totalPages > 1) {
              <div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
                <div class="flex items-center justify-between">
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Showing {{ ((data.pagination.page - 1) * data.pagination.pageSize) + 1 }} to 
                    {{ Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems) }} of 
                    {{ data.pagination.totalItems }} results
                  </p>
                  <div class="flex items-center space-x-2">
                    <button
                      [disabled]="data.pagination.page <= 1"
                      (click)="changePage(data.pagination.page - 1)"
                      class="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600">
                      Previous
                    </button>
                    <span class="px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
                      Page {{ data.pagination.page }} of {{ data.pagination.totalPages }}
                    </span>
                    <button
                      [disabled]="data.pagination.page >= data.pagination.totalPages"
                      (click)="changePage(data.pagination.page + 1)"
                      class="px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-600">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            }

          } @else {
            <!-- Empty state -->
            <div class="px-6 py-12 text-center">
              <div class="text-6xl mb-4">📋</div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No audit entries found</h3>
              <p class="text-slate-500 dark:text-slate-400">Try adjusting your filters to see more results.</p>
            </div>
          }
        </div>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading audit entries...</p>
        </div>
      }
    </div>
  `
})
export class AuditLogComponent implements OnInit {
  private auditLogService = inject(AuditLogService);
  private fb = inject(FormBuilder);

  auditData = signal<PaginatedAuditLogs | null>(null);
  isLoading = signal(false);
  expandedDetails = signal<Set<number>>(new Set());
  availableActions = signal<string[]>([]);
  availableUsers = signal<string[]>([]);

  Math = Math; // Make Math available in template

  filterForm = this.fb.group({
    action: [''],
    userEmail: [''],
    resourceType: [''],
    from: [''],
    to: [''],
    pageSize: [25]
  });

  private currentFilters: AuditLogFilters = {
    page: 1,
    pageSize: 25
  };

  ngOnInit(): void {
    this.loadFilterOptions();
    this.setupFilterSubscriptions();
    this.loadAuditLogs();
  }

  private loadFilterOptions(): void {
    forkJoin({
      actions: this.auditLogService.getActions(),
      users: this.auditLogService.getUsers()
    }).subscribe({
      next: (data) => {
        this.availableActions.set(data.actions);
        this.availableUsers.set(data.users);
      },
      error: (error) => {
        console.error('Failed to load filter options:', error);
      }
    });
  }

  private setupFilterSubscriptions(): void {
    // Action changes
    this.filterForm.get('action')?.valueChanges.subscribe(action => {
      this.currentFilters.action = action || undefined;
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });

    // User email changes  
    this.filterForm.get('userEmail')?.valueChanges.subscribe(userEmail => {
      this.currentFilters.userEmail = userEmail || undefined;
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });

    // Resource type changes
    this.filterForm.get('resourceType')?.valueChanges.subscribe(resourceType => {
      this.currentFilters.resourceType = resourceType || undefined;
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });

    // Date range changes
    this.filterForm.get('from')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(from => {
      this.currentFilters.from = from || undefined;
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });

    this.filterForm.get('to')?.valueChanges.pipe(
      debounceTime(300)
    ).subscribe(to => {
      this.currentFilters.to = to || undefined;
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });

    // Per page changes
    this.filterForm.get('pageSize')?.valueChanges.subscribe(pageSize => {
      this.currentFilters.pageSize = Number(pageSize);
      this.currentFilters.page = 1;
      this.loadAuditLogs();
    });
  }

  private loadAuditLogs(): void {
    this.isLoading.set(true);
    
    this.auditLogService.getAuditLogs(this.currentFilters).subscribe({
      next: (data) => {
        this.auditData.set(data);
        this.isLoading.set(false);
        // Clear expanded details when data changes
        this.expandedDetails.set(new Set());
      },
      error: (error) => {
        console.error('Failed to load audit logs:', error);
        this.isLoading.set(false);
      }
    });
  }

  changePage(page: number): void {
    this.currentFilters.page = page;
    this.loadAuditLogs();
  }

  toggleDetails(entryId: number): void {
    const expanded = new Set(this.expandedDetails());
    if (expanded.has(entryId)) {
      expanded.delete(entryId);
    } else {
      expanded.add(entryId);
    }
    this.expandedDetails.set(expanded);
  }

  isDetailsExpanded(entryId: number): boolean {
    return this.expandedDetails().has(entryId);
  }

  getActionBadgeClass(action: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    if (action.startsWith('user.')) {
      return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
    }
    if (action.startsWith('item.')) {
      return `${baseClasses} bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300`;
    }
    if (action.startsWith('auth.')) {
      return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
    }
    
    // Default gray for unknown actions
    return `${baseClasses} bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`;
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString();
  }

  formatDetails(details: string): string {
    try {
      const parsed = JSON.parse(details);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return details;
    }
  }
}