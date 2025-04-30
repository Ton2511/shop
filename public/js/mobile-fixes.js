/**
 * JavaScript สำหรับแก้ไขปัญหาการแสดงผลบนมือถือ
 */
document.addEventListener('DOMContentLoaded', function() {
    // แก้ไขปัญหาเมนูที่ซ้อนทับกันบนมือถือ
    fixMobileMenuOverlap();
    
    // ตรวจจับขนาดหน้าจอและปรับแต่ง UI ตามความเหมาะสม
    handleResponsiveLayout();
    
    // ตรวจจับปุ่มเปิดเมนูบนมือถือ
    setupMobileMenuToggle();
    
    // ทำเครื่องหมายเมนูที่กำลังเปิดอยู่
    highlightActiveMenu();
    
    // ปิดเมนูมือถือเมื่อคลิกที่ลิงก์
    closeMenuOnClick();
  });
  
  /**
   * แก้ไขปัญหาเมนูที่ซ้อนทับกันบนมือถือ
   */
  function fixMobileMenuOverlap() {
    // แก้ไขปัญหาแถบ navbar ทับเนื้อหาบนมือถือ
    if (window.innerWidth <= 991) {
      const header = document.querySelector('header.bg-teal');
      const headerHeight = header ? header.offsetHeight : 0;
      
      if (headerHeight > 0) {
        document.body.style.paddingTop = headerHeight + 'px';
      }
    }
  }
  
  /**
   * ปรับแต่ง UI ตามขนาดหน้าจอ
   */
  function handleResponsiveLayout() {
    const adjustLayout = () => {
      const isMobile = window.innerWidth <= 576;
      const isTablet = window.innerWidth > 576 && window.innerWidth <= 991;
      
      // ปรับขนาดตัวอักษรบนมือถือ
      if (isMobile) {
        document.querySelectorAll('.navbar-brand h2').forEach(brand => {
          brand.style.fontSize = '1.2rem';
        });
      } else if (isTablet) {
        document.querySelectorAll('.navbar-brand h2').forEach(brand => {
          brand.style.fontSize = '1.5rem';
        });
      }
      
      // ปรับช่องค้นหาบนมือถือให้แสดงผลถูกต้อง
      adjustSearchBar(isMobile);
    };
    
    // เรียกใช้ทันทีและเมื่อมีการเปลี่ยนแปลงขนาดหน้าจอ
    adjustLayout();
    window.addEventListener('resize', adjustLayout);
  }
  
  /**
   * ปรับแต่งช่องค้นหาสำหรับมือถือ
   */
  function adjustSearchBar(isMobile) {
    const searchCollapse = document.getElementById('mobileSearchCollapse');
    
    if (!searchCollapse) return;
    
    // ตั้งค่า animation สำหรับการแสดง/ซ่อนช่องค้นหา
    searchCollapse.addEventListener('show.bs.collapse', function() {
      this.style.opacity = '0';
      setTimeout(() => {
        this.style.opacity = '1';
      }, 10);
    });
    
    // ปรับแต่ง form input เมื่อแสดงผล
    searchCollapse.addEventListener('shown.bs.collapse', function() {
      const input = this.querySelector('input');
      if (input) input.focus();
    });
  }
  
  /**
   * ตรวจจับปุ่มเปิดเมนูบนมือถือ
   */
  function setupMobileMenuToggle() {
    const navbarToggler = document.querySelector('.navbar-toggler');
    const offcanvas = document.getElementById('mobileNavOffcanvas');
    
    if (!navbarToggler || !offcanvas) return;
    
    // แก้ไขตำแหน่งการแสดงผลของ offcanvas บนมือถือ
    offcanvas.addEventListener('show.bs.offcanvas', function() {
      // เลื่อนหน้าจอกลับไปด้านบนถ้าเลื่อนลงมาแล้ว
      if (window.scrollY > 50) {
        window.scrollTo({top: 0, behavior: 'smooth'});
      }
    });
  }
  
  /**
   * ทำเครื่องหมายเมนูที่กำลังเปิดอยู่
   */
  function highlightActiveMenu() {
    const currentPath = window.location.pathname;
    
    // เลือกเมนูทั้งหมด
    const menuLinks = document.querySelectorAll('.list-group-item, .nav-link');
    
    menuLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // ตรวจสอบว่าลิงก์ตรงกับหน้าปัจจุบันหรือไม่
      if (href === currentPath || 
          (href !== '/' && currentPath.startsWith(href))) {
        
        // เพิ่ม class active
        link.classList.add('active');
        
        // สำหรับ list-group-item เพิ่มสีพื้นหลัง
        if (link.classList.contains('list-group-item')) {
          link.style.backgroundColor = 'rgba(0, 128, 128, 0.1)';
          link.style.color = '#008080';
          link.style.fontWeight = '500';
        }
      }
    });
  }
  
  /**
   * ปิดเมนูเมื่อคลิกที่ลิงก์ในเมนูมือถือ
   */
  function closeMenuOnClick() {
    const offcanvas = document.getElementById('mobileNavOffcanvas');
    if (!offcanvas) return;
    
    const menuLinks = offcanvas.querySelectorAll('.list-group-item');
    
    menuLinks.forEach(link => {
      link.addEventListener('click', function() {
        // ใช้ Bootstrap API เพื่อปิด offcanvas
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvas);
        if (bsOffcanvas) {
          // หน่วงเวลาเล็กน้อยเพื่อให้เห็น active state ก่อน
          setTimeout(() => {
            bsOffcanvas.hide();
          }, 150);
        }
      });
    });
  }