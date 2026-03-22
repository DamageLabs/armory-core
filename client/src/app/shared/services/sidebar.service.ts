import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private _isExpanded = signal(false);
  private _isHovered = signal(false);
  private _isMobileOpen = signal(false);

  readonly isExpanded$ = this._isExpanded.asReadonly();
  readonly isHovered$ = this._isHovered.asReadonly();
  readonly isMobileOpen$ = this._isMobileOpen.asReadonly();

  setExpanded(expanded: boolean): void {
    this._isExpanded.set(expanded);
  }

  setHovered(hovered: boolean): void {
    this._isHovered.set(hovered);
  }

  setMobileOpen(open: boolean): void {
    this._isMobileOpen.set(open);
  }

  toggle(): void {
    this._isMobileOpen.update(open => !open);
  }
}