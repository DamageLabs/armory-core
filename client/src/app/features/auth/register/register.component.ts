import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        
        <!-- Header -->
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
            <span class="text-slate-900 font-bold text-2xl">A</span>
          </div>
          <h2 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>
          <p class="mt-2 text-slate-500 dark:text-slate-400">Join Armory Core today</p>
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <div class="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-4 py-3 rounded-lg">
            {{ errorMessage() }}
          </div>
        }

        <!-- Register form -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <!-- Name fields -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="first_name" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                First Name
              </label>
              <input
                id="first_name"
                type="text"
                formControlName="first_name"
                class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="First name"
                [class.border-red-500]="registerForm.get('first_name')?.invalid && registerForm.get('first_name')?.touched"
              />
            </div>
            <div>
              <label for="last_name" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                Last Name
              </label>
              <input
                id="last_name"
                type="text"
                formControlName="last_name"
                class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="Last name"
                [class.border-red-500]="registerForm.get('last_name')?.invalid && registerForm.get('last_name')?.touched"
              />
            </div>
          </div>

          <!-- Username -->
          <div>
            <label for="username" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              formControlName="username"
              class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Choose a username"
              [class.border-red-500]="registerForm.get('username')?.invalid && registerForm.get('username')?.touched"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter your email"
              [class.border-red-500]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
            />
            @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
              <p class="mt-1 text-sm text-red-400">Valid email is required</p>
            }
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Choose a password"
              [class.border-red-500]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
            />
            @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
              <p class="mt-1 text-sm text-red-400">Password must be at least 6 characters</p>
            }
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirm_password" class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              type="password"
              formControlName="confirm_password"
              class="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Confirm your password"
              [class.border-red-500]="registerForm.get('confirm_password')?.invalid && registerForm.get('confirm_password')?.touched"
            />
            @if (registerForm.hasError('passwordMismatch') && registerForm.get('confirm_password')?.touched) {
              <p class="mt-1 text-sm text-red-400">Passwords do not match</p>
            }
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            [disabled]="registerForm.invalid || isLoading()"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
            @if (isLoading()) {
              <span class="flex items-center justify-center space-x-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating account...</span>
              </span>
            } @else {
              Create account
            }
          </button>

          <!-- Login link -->
          <div class="text-center">
            <p class="text-slate-500 dark:text-slate-400">
              Already have an account? 
              <a routerLink="/login" class="text-amber-400 hover:text-amber-300 font-medium">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirm_password');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
        }
      });
    }
  }
}