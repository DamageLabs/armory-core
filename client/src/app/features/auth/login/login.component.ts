import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
          <h2 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Sign in to Armory Core</h2>
          <p class="mt-2 text-slate-500 dark:text-slate-400">Manage your inventory with ease</p>
        </div>

        <!-- Error message -->
        @if (errorMessage()) {
          <div class="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-4 py-3 rounded-lg">
            {{ errorMessage() }}
          </div>
        }

        <!-- Login form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
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
              [class.border-red-500]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
            />
            @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
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
              placeholder="Enter your password"
              [class.border-red-500]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
            />
            @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
              <p class="mt-1 text-sm text-red-400">Password is required</p>
            }
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading()"
            class="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
            @if (isLoading()) {
              <span class="flex items-center justify-center space-x-2">
                <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              </span>
            } @else {
              Sign in
            }
          </button>

          <!-- Register link -->
          <div class="text-center">
            <p class="text-slate-500 dark:text-slate-400">
              Don't have an account? 
              <a routerLink="/register" class="text-amber-400 hover:text-amber-300 font-medium">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
          this.router.navigate([returnUrl]);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Login failed. Please try again.');
        }
      });
    }
  }
}