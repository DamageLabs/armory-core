import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../types/user';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Page header -->
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Manage system users and permissions</p>
      </div>

      <!-- Search bar -->
      <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
        <form [formGroup]="filterForm">
          <div class="flex flex-col lg:flex-row gap-4">
            <div class="flex-1">
              <input
                type="text"
                formControlName="search"
                placeholder="Search users by email..."
                class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Users table -->
      @if (users(); as userList) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          <!-- Table header -->
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-750">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Users ({{ filteredUsers().length }})
            </h2>
          </div>

          @if (filteredUsers().length > 0) {
            
            <!-- Desktop table -->
            <div class="hidden md:block overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sign-ins</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Sign-in</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-700">
                  @for (user of filteredUsers(); track user.id) {
                    <tr class="hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors duration-150">
                      <td class="px-6 py-4">
                        <div class="font-medium text-slate-900 dark:text-slate-100">{{ user.email }}</div>
                      </td>
                      <td class="px-6 py-4">
                        <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                              [class]="user.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ user.signInCount | number }}</td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {{ user.lastSignInAt ? formatDate(user.lastSignInAt) : 'Never' }}
                      </td>
                      <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ formatDate(user.createdAt) }}</td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end space-x-2">
                          <select 
                            [value]="user.role"
                            (change)="updateUserRole(user, $event)"
                            class="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-900 dark:text-slate-100">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            (click)="deleteUser(user)"
                            class="text-red-400 hover:text-red-300 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Mobile cards -->
            <div class="md:hidden space-y-4 p-4">
              @for (user of filteredUsers(); track user.id) {
                <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-lg">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ user.email }}</h3>
                      <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full mt-1"
                            [class]="user.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200'">
                        {{ user.role }}
                      </span>
                    </div>
                    <div class="flex space-x-2">
                      <select 
                        [value]="user.role"
                        (change)="updateUserRole(user, $event)"
                        class="text-xs bg-slate-200 dark:bg-slate-600 border border-slate-500 rounded px-2 py-1 text-slate-900 dark:text-slate-100">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        (click)="deleteUser(user)"
                        class="text-red-400 hover:text-red-300 text-sm">
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div class="space-y-2 text-sm">
                    <div class="flex flex-wrap gap-4 text-slate-500 dark:text-slate-400">
                      <span>Sign-ins: {{ user.signInCount }}</span>
                      <span>Last: {{ user.lastSignInAt ? formatDate(user.lastSignInAt) : 'Never' }}</span>
                    </div>
                    <div class="text-slate-500 dark:text-slate-400">
                      Created: {{ formatDate(user.createdAt) }}
                    </div>
                  </div>
                </div>
              }
            </div>

          } @else {
            <!-- Empty state -->
            <div class="px-6 py-12 text-center">
              <div class="text-6xl mb-4">👥</div>
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">No users found</h3>
              <p class="text-slate-500 dark:text-slate-400">No users match your search criteria.</p>
            </div>
          }
        </div>
      }

      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading users...</p>
        </div>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);
  isLoading = signal(false);

  filterForm = this.fb.group({
    search: ['']
  });

  ngOnInit(): void {
    this.setupFilterSubscriptions();
    this.loadUsers();
  }

  private setupFilterSubscriptions(): void {
    this.filterForm.get('search')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.filterUsers(search || '');
    });
  }

  private filterUsers(search: string): void {
    const allUsers = this.users();
    if (!search.trim()) {
      this.filteredUsers.set(allUsers);
      return;
    }

    const filtered = allUsers.filter(user => 
      user.email.toLowerCase().includes(search.toLowerCase())
    );
    this.filteredUsers.set(filtered);
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.filteredUsers.set(users);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load users:', error);
        this.isLoading.set(false);
      }
    });
  }

  updateUserRole(user: User, event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newRole = target.value as 'user' | 'admin';
    
    if (newRole === user.role) return;

    const confirmMessage = `Are you sure you want to change ${user.email}'s role to ${newRole}?`;
    if (window.confirm(confirmMessage)) {
      this.userService.updateUserRole(user.id, newRole).subscribe({
        next: (updatedUser) => {
          const users = this.users().map(u => 
            u.id === updatedUser.id ? updatedUser : u
          );
          this.users.set(users);
          this.filterUsers(this.filterForm.get('search')?.value || '');
        },
        error: (error: any) => {
          console.error('Failed to update user role:', error);
          alert('Failed to update user role. Please try again.');
          // Reset select value
          target.value = user.role;
        }
      });
    } else {
      // Reset select value
      target.value = user.role;
    }
  }

  deleteUser(user: User): void {
    const confirmMessage = `Are you sure you want to delete ${user.email}? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          const users = this.users().filter(u => u.id !== user.id);
          this.users.set(users);
          this.filterUsers(this.filterForm.get('search')?.value || '');
        },
        error: (error: any) => {
          console.error('Failed to delete user:', error);
          alert('Failed to delete user. Please try again.');
        }
      });
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
}