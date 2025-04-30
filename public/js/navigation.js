// navigation.js - Add interactivity to the improved navigation

document.addEventListener('DOMContentLoaded', function() {
    // Add active class to current navigation item
    highlightCurrentPage();
    
    // Mobile search form submission
    setupMobileSearch();
    
    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      initTooltips();
    }
  });
  
  /**
   * Adds 'active' class to the current page's navigation link
   */
  function highlightCurrentPage() {
    // Get current path
    const currentPath = window.location.pathname;
    
    // Find all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Skip dropdown toggles
      if (link.classList.contains('dropdown-toggle')) {
        return;
      }
      
      // Check if this is the current page
      if (href === currentPath || 
          (href !== '/' && currentPath.startsWith(href))) {
        
        // Add active class to link
        link.classList.add('active');
        
        // Add active class to parent if it's a nav-item
        const parentItem = link.closest('.nav-item');
        if (parentItem) {
          parentItem.classList.add('active');
        }
        
        // If it's in a dropdown, also activate the dropdown
        const dropdownParent = link.closest('.dropdown-menu');
        if (dropdownParent) {
          const dropdownToggle = document.querySelector(`[data-bs-toggle="dropdown"][aria-expanded="false"]`);
          if (dropdownToggle) {
            dropdownToggle.classList.add('active');
            dropdownToggle.closest('.nav-item')?.classList.add('active');
          }
        }
      }
    });
  }
  
  /**
   * Setup mobile search functionality 
   */
  function setupMobileSearch() {
    const mobileSearchForm = document.querySelector('.offcanvas-body form');
    if (!mobileSearchForm) return;
    
    mobileSearchForm.addEventListener('submit', function(e) {
      const searchInput = this.querySelector('input[name="q"]');
      if (!searchInput || !searchInput.value.trim()) {
        e.preventDefault();
        
        // Add shake animation if the input is empty
        searchInput.classList.add('is-invalid');
        setTimeout(() => {
          searchInput.classList.remove('is-invalid');
        }, 1000);
      }
    });
  }
  
  /**
   * Initialize Bootstrap tooltips
   */
  function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }