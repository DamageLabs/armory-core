import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../types/user';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div class="max-w-4xl mx-auto space-y-6">
        
        <!-- Page Header -->
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">User Profile</h1>
          <p class="text-slate-600 dark:text-slate-400 mt-1">Manage your account settings and preferences</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Left Column -->
          <div class="lg:col-span-2 space-y-6">
            
            <!-- Account Info Card -->
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Account Information</h2>
              
              @if (emailUpdateMessage(); as message) {
                <div class="mb-4 p-3 rounded-lg" [class]="message.type === 'success' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 text-green-200' : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200'">
                  {{ message.text }}
                </div>
              }

              <form [formGroup]="emailForm" (ngSubmit)="updateEmail()" class="space-y-4">
                
                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    formControlName="email"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter your email"
                    [class.border-red-500]="emailForm.get('email')?.invalid && emailForm.get('email')?.touched"
                  />
                  @if (emailForm.get('email')?.invalid && emailForm.get('email')?.touched) {
                    <p class="mt-1 text-sm text-red-400">Valid email is required</p>
                  }
                </div>

                <!-- Role (display only) -->
                <div>
                  <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Role
                  </label>
                  <div class="flex items-center">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                          [class]="currentUser()?.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'">
                      {{ currentUser()?.role }}
                    </span>
                  </div>
                </div>

                <!-- Member Since -->
                <div>
                  <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Member Since
                  </label>
                  <p class="text-sm text-slate-900 dark:text-slate-100">
                    {{ formatDate(currentUser()?.createdAt) }}
                  </p>
                </div>

                <!-- Last Sign In -->
                <div>
                  <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Last Sign In
                  </label>
                  <p class="text-sm text-slate-900 dark:text-slate-100">
                    {{ currentUser()?.lastSignInAt ? formatDate(currentUser()?.lastSignInAt) : 'Never' }}
                  </p>
                </div>

                <!-- Save Button -->
                <div class="pt-4">
                  <button
                    type="submit"
                    [disabled]="emailForm.invalid || isEmailLoading() || !emailForm.dirty"
                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    @if (isEmailLoading()) {
                      <span class="flex items-center space-x-2">
                        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </span>
                    } @else {
                      Save Email Changes
                    }
                  </button>
                </div>
              </form>
            </div>

            <!-- Change Password Card -->
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Change Password</h2>
              
              @if (passwordUpdateMessage(); as message) {
                <div class="mb-4 p-3 rounded-lg" [class]="message.type === 'success' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 text-green-200' : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200'">
                  {{ message.text }}
                </div>
              }

              <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="space-y-4">
                
                <!-- Current Password -->
                <div>
                  <label for="currentPassword" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    formControlName="currentPassword"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter current password"
                    [class.border-red-500]="passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched"
                  />
                  @if (passwordForm.get('currentPassword')?.invalid && passwordForm.get('currentPassword')?.touched) {
                    <p class="mt-1 text-sm text-red-400">Current password is required</p>
                  }
                </div>

                <!-- New Password -->
                <div>
                  <label for="password" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Enter new password"
                    [class.border-red-500]="passwordForm.get('password')?.invalid && passwordForm.get('password')?.touched"
                  />
                  @if (passwordForm.get('password')?.invalid && passwordForm.get('password')?.touched) {
                    <p class="mt-1 text-sm text-red-400">Password must be at least 8 characters</p>
                  }
                </div>

                <!-- Confirm Password -->
                <div>
                  <label for="confirmPassword" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    formControlName="confirmPassword"
                    class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Confirm new password"
                    [class.border-red-500]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched"
                  />
                  @if (passwordForm.hasError('passwordMismatch') && passwordForm.get('confirmPassword')?.touched) {
                    <p class="mt-1 text-sm text-red-400">Passwords do not match</p>
                  }
                </div>

                <!-- Save Button -->
                <div class="pt-4">
                  <button
                    type="submit"
                    [disabled]="passwordForm.invalid || isPasswordLoading()"
                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                    @if (isPasswordLoading()) {
                      <span class="flex items-center space-x-2">
                        <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </span>
                    } @else {
                      Change Password
                    }
                  </button>
                </div>
              </form>
            </div>

            <!-- Danger Zone Card -->
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-red-300 dark:border-red-700 p-6">
              <h2 class="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
              
              @if (deleteAccountMessage(); as message) {
                <div class="mb-4 p-3 rounded-lg" [class]="message.type === 'success' ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-50 text-green-200' : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200'">
                  {{ message.text }}
                </div>
              }

              <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Account deletion is permanent and cannot be undone. All your data will be permanently deleted.
              </p>

              @if (!showDeleteConfirmation()) {
                <button
                  (click)="showDeleteConfirmation.set(true)"
                  class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                  Delete Account
                </button>
              } @else {
                <div class="space-y-4">
                  <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p class="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                      Are you absolutely sure?
                    </p>
                    <p class="text-sm text-red-600 dark:text-red-300">
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </p>
                  </div>
                  
                  <div class="flex space-x-3">
                    <button
                      (click)="confirmDeleteAccount()"
                      [disabled]="isDeleteLoading()"
                      class="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                      @if (isDeleteLoading()) {
                        <span class="flex items-center space-x-2">
                          <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Deleting...</span>
                        </span>
                      } @else {
                        Yes, delete my account
                      }
                    </button>
                    <button
                      (click)="showDeleteConfirmation.set(false)"
                      [disabled]="isDeleteLoading()"
                      class="bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                      Cancel
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right Column -->
          <div class="space-y-6">
            
            <!-- Profile Photo Card -->
            <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Profile Photo</h2>
              
              <!-- Current Avatar -->
              <div class="flex flex-col items-center space-y-4">
                <div class="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center">
                  <span class="text-slate-900 font-bold text-3xl">
                    {{ currentUser()?.email?.charAt(0)?.toUpperCase() || 'U' }}
                  </span>
                </div>
                
                <!-- Upload Button (Disabled) -->
                <button
                  disabled
                  class="bg-slate-600 opacity-50 cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg">
                  Upload Photo
                </button>
                
                <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Photo upload coming soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  currentUser = signal<User | null>(null);
  emailForm: FormGroup;
  passwordForm: FormGroup;
  isEmailLoading = signal(false);
  isPasswordLoading = signal(false);
  isDeleteLoading = signal(false);
  showDeleteConfirmation = signal(false);
  emailUpdateMessage = signal<{type: 'success' | 'error', text: string} | null>(null);
  passwordUpdateMessage = signal<{type: 'success' | 'error', text: string} | null>(null);
  deleteAccountMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  constructor() {
    // Initialize forms
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.emailForm.patchValue({ email: user.email });
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  updateEmail(): void {
    if (this.emailForm.valid && this.currentUser()) {
      this.isEmailLoading.set(true);
      this.emailUpdateMessage.set(null);

      const emailData = {
        email: this.emailForm.value.email
      };

      this.authService.updateProfile(this.currentUser()!.id, emailData).subscribe({
        next: (updatedUser) => {
          this.isEmailLoading.set(false);
          this.emailUpdateMessage.set({
            type: 'success',
            text: 'Email updated successfully!'
          });
          // Reset form dirty state
          this.emailForm.markAsPristine();
          // Clear message after 3 seconds
          setTimeout(() => this.emailUpdateMessage.set(null), 3000);
        },
        error: (error) => {
          this.isEmailLoading.set(false);
          this.emailUpdateMessage.set({
            type: 'error',
            text: error.error?.message || 'Failed to update email. Please try again.'
          });
        }
      });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.valid && this.currentUser()) {
      this.isPasswordLoading.set(true);
      this.passwordUpdateMessage.set(null);

      const passwordData = {
        password: this.passwordForm.value.password,
        currentPassword: this.passwordForm.value.currentPassword
      };

      this.authService.updateProfile(this.currentUser()!.id, passwordData).subscribe({
        next: () => {
          this.isPasswordLoading.set(false);
          this.passwordUpdateMessage.set({
            type: 'success',
            text: 'Password updated successfully!'
          });
          // Reset password form
          this.passwordForm.reset();
          // Clear message after 3 seconds
          setTimeout(() => this.passwordUpdateMessage.set(null), 3000);
        },
        error: (error) => {
          this.isPasswordLoading.set(false);
          this.passwordUpdateMessage.set({
            type: 'error',
            text: error.error?.message || 'Failed to update password. Please try again.'
          });
        }
      });
    }
  }

  confirmDeleteAccount(): void {
    if (this.currentUser()) {
      this.isDeleteLoading.set(true);
      this.deleteAccountMessage.set(null);

      this.authService.deleteAccount(this.currentUser()!.id).subscribe({
        next: () => {
          this.isDeleteLoading.set(false);
          this.deleteAccountMessage.set({
            type: 'success',
            text: 'Account deleted successfully. You will be logged out in a moment.'
          });
          // Auto logout after 2 seconds
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
        },
        error: (error) => {
          this.isDeleteLoading.set(false);
          this.deleteAccountMessage.set({
            type: 'error',
            text: error.error?.message || 'Failed to delete account. Please try again.'
          });
          this.showDeleteConfirmation.set(false);
        }
      });
    }
  }
}