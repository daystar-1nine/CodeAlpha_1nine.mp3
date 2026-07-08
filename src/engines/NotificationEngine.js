import gsap from 'gsap';

export class NotificationEngine {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.position = 'fixed';
    this.container.style.bottom = 'var(--spacing-2xl)';
    this.container.style.right = 'var(--spacing-2xl)';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = 'var(--spacing-md)';
    this.container.style.zIndex = '9999';
    this.container.style.pointerEvents = 'none';
    
    document.body.appendChild(this.container);
  }

  show({ title, message, type = 'info', duration = 3000 }) {
    const toast = document.createElement('div');
    toast.className = 'clay-surface flex-row';
    toast.style.padding = 'var(--spacing-md) var(--spacing-lg)';
    toast.style.minWidth = '250px';
    toast.style.maxWidth = '350px';
    toast.style.pointerEvents = 'auto';
    toast.style.alignItems = 'center';
    
    // Icon based on type
    const iconContainer = document.createElement('div');
    iconContainer.style.marginRight = 'var(--spacing-md)';
    let iconName = 'info';
    let iconColor = 'var(--color-primary)';
    
    if (type === 'success') {
      iconName = 'check-circle';
      iconColor = '#10B981';
    } else if (type === 'error') {
      iconName = 'x-circle';
      iconColor = '#EF4444';
    } else if (type === 'warning') {
      iconName = 'alert-triangle';
      iconColor = '#F59E0B';
    }
    
    iconContainer.innerHTML = `<i data-lucide="${iconName}" style="color: ${iconColor};"></i>`;
    
    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';
    
    if (title) {
      const titleEl = document.createElement('h4');
      titleEl.textContent = title;
      titleEl.style.margin = '0 0 4px 0';
      titleEl.style.fontSize = 'var(--font-size-body)';
      textContainer.appendChild(titleEl);
    }
    
    if (message) {
      const msgEl = document.createElement('p');
      msgEl.textContent = message;
      msgEl.style.margin = '0';
      msgEl.style.fontSize = 'var(--font-size-small)';
      msgEl.style.color = 'var(--color-text-muted)';
      textContainer.appendChild(msgEl);
    }
    
    toast.appendChild(iconContainer);
    toast.appendChild(textContainer);
    
    this.container.appendChild(toast);
    
    // Re-initialize lucide icons for the newly added icon
    if (window.lucide) {
      window.lucide.createIcons({ root: toast });
    }
    
    // Animate in
    gsap.fromTo(toast, 
      { x: 100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }
    );
    
    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
    
    // Click to dismiss
    toast.addEventListener('click', () => {
      this.dismiss(toast);
    });
  }
  
  dismiss(toastElement) {
    gsap.to(toastElement, {
      x: 100,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (toastElement.parentNode) {
          toastElement.parentNode.removeChild(toastElement);
        }
      }
    });
  }
}

export const notificationEngine = new NotificationEngine();
