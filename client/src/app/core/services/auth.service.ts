import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { User } from '../../types/user';
import { LoginRequest, RegisterRequest, AuthResponse } from '../../types/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenKey = 'armory_token';
  private userKey = 'armory_user';

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userData = localStorage.getItem(this.userKey);
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      } catch {
        this.clearAuth();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', credentials).pipe(
      tap(response => {
        this.setAuth(response.token, response.user);
      }),
      catchError(error => {
        this.clearAuth();
        throw error;
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/register', userData).pipe(
      tap(response => {
        this.setAuth(response.token, response.user);
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setAuth(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticated.set(true);
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.isAuthenticated.set(false);
  }

  updateProfile(id: number, data: { email?: string; password?: string; currentPassword?: string }): Observable<User> {
    return this.http.put<User>(`/api/auth/profile/${id}`, data).pipe(
      tap(updatedUser => {
        // Update stored user data if email was changed
        if (data.email) {
          localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  deleteAccount(id: number): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`/api/auth/profile/${id}`);
  }

  checkAuthStatus(): Observable<User> {
    return this.http.get<User>('/api/auth/me').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.isAuthenticated.set(true);
      }),
      catchError(() => {
        this.clearAuth();
        return of(null as any);
      })
    );
  }
}